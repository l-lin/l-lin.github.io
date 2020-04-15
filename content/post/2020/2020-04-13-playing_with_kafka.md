---
title: "Playing with Kafka"
date: 2020-04-13T20:47:48+02:00
imageUrl: "/images/2020-04-13/heart-rates.gif"
tags: ["kafka", "spring"]
categories: ["post"]
comment: true
toc: true
autoCollapseToc: true
contentCopyright: false
---

During the COVID-19 shutdown, one way to "pass time" is to learn and play with new things.

I made a small project, [heart-rate-calculator](https://github.com/l-lin/heart-rate-calculator/),
whose goal is to take a file containing heartbeat information in input, compute and write the
heart rates in another file.

That was quite a nice project, but I was wondering if I want to go further, what the project would
look like? Let's say, I want to have a whole SAAS solution, production-ready, to read a stream of
data from smart-watches that measure heartbeats, then compute their heart rates and display a graph
to the user. Of course, if that's just that, it will be too simple, so what about having the
challenge of dealing with massive amount of data. Mmh, a bit more tricky.

This is a good opportunity to play with Kafka and Kafka Streams! In this blog post, I will show how
to build a resilient system to compute and generate heart rates from heartbeat data.

If you are in hurry, you can check the source code here: https://github.com/l-lin/poc-kafka

<!--more-->

Note that the micro-services are Java applications, using [Spring Framework](https://spring.io/)
because that's what I'm most familiar with.

I will use [docker-compose](https://docs.docker.com/compose/) to mount the whole environment.

## The target architecture

I want to design a scalable, real-time and distributed pipeline to display the heart rate from a
continuous stream of heartbeats provided by smart-watches.

One way is to use [Apache Kafka](https://kafka.apache.org/), which is a distributed streaming
platform, to help me achieve that (and that was the whole of this project: learn and play with
Kafka).

The target architecture is the following:

{{< figure class="center" src="/images/2020-04-13/architecture.svg" alt="Target architecture" title="Target architecture" >}}

- __heart-beat-producer__: when a smart-watch sends a heartbeat, it should end in Kafka right away
- __heart-beat-validator__: this service deals with a stream of heartbeats to validate them and flag
  them as invalid
- __heart-rate-computor__: now we have valid heartbeats, we aggregate them and compute the
  associated heart rates
- __heart-rate-connector__: we need to sink the heart rates into a database, like PostgreSQL, so
  that other services can pick them up and show the heart rates to the users
- __heart-rate-consumer__: this application will listen to the kafka topic to stream in real-time
  the heart rates, as well as displaying a time window of the heart rates of a user

## Designing models with Apache Avro

Before diving in developing the micro-services, I need to define the models that will circulate
around the micro-services: `HeartBeat` and `HeartRate`.

It's important to define the model, especially in a micro-services oriented architecture as each
micro-service have their own responsibility, and in a real world company, they can be handled by
different teams. So, in order to have coherent "data" circulating in the whole system, it's
important to be rigorous and define some sort of "contracts" so that each micro-services are aware
of the data received and sent, and they can manipulate them without worry.

There are multiple solutions out there:

- [JSON schema](https://json-schema.org/)
- [Apache Avro](https://avro.apache.org/)
- [ProtoBuf](https://github.com/protocolbuffers/protobuf)

### Apache Avro

I choose to use Apache Avro because I already manipulated ProtoBuf and JSON schema, and moreover
Confluent, the company for which I used most of their community products for this project, advocates
using Avro as they offer a [Schema
Management](https://docs.confluent.io/current/schema-registry/index.html).

With Avro, you define the model schemas that contain the fields of the data along with their types.
Once the Avro object is formed, it can easily be serialized as an array of bytes, which is the type
Kafka likes. Another point to raise is that any other programming language can use Avro bytes and
deserialize them into an object specific to their programming language, which is nice because that
means every team can "communicate" data through Avro schemas.

Avro also support schema evolutivity: each schema that is registered in the registry has their own
version. It stresses out the backward and forward compatibility by having strict verification in the
schema registry.

What is the schema registry? It's nice to design the Avro schemas, but they need to be stored and
available somewhere so that the micro-services are aware of the schemas. That's where the Schema
Registry is all about.

### Schema Registry

The [Schema Registry](https://docs.confluent.io/current/schema-registry/docs/index.html) is a
serving layer for the Avro metadata. It provides RESTful interfaces for storing and retrieving
Apache Avro schemas, stores a versioned history of all schemas based on a specified subject name
strategy, provides multiple compatibility settings and allows evolution of schemas according to the
configured compatibility settings and expanded Avro support. It provides serializers that plug into
Apache Kafka clients that handle schema storage and retrieval for Kafka messages that are sent in
the Avro format.

I configured the schema registry with the following docker-compose configuration:

```yaml
version: '3'
services:
  schema-registry:
    image: confluentinc/cp-schema-registry:${CONFLUENT_TAG}
    depends_on:
      - zk1
      - zk2
      - zk3
      - kafka1
      - kafka2
      - kafka3
    ports:
      - 8081:8081
    environment:
      SCHEMA_REGISTRY_HOST_NAME: schema-registry
      SCHEMA_REGISTRY_KAFKASTORE_CONNECTION_URL: 'zk1:2181,zk2:2181,zk3:2181'
```

### Heartbeat Avro schema

The heartbeat model is quite simple:

- `userId`: the ID of the user that uses the smart-watch
- `HRI`: a heart rate instant value, detected by the smart-watch
- [`QRS`](https://en.wikipedia.org/wiki/QRS_complex): the event describing the heart's activity:
  - A: supra-ventricular
  - V: premature ventricular
  - N: normal
  - F: fusion
  - P: paced
  - X: invalid
- `timestamp`: the time of the registered heartbeat

Using the [Avro specifications](https://avro.apache.org/docs/1.8.1/spec.html#schemas), the Avro
model looks like this:

```json
[
  {"namespace": "lin.louis.poc.models",
    "name": "HeartBeatQRS",
    "type": "enum",
    "doc": "Event describing the activity of the heart: V: premature ventricular heartbeat - N: normal heartbeat - F: fusion heartbeat - P: paced heartbeat - X: invalid heartbeat",
    "symbols": ["A", "V", "N", "F", "P", "X"]
  },
  {"namespace": "lin.louis.poc.models",
    "name": "HeartBeat",
    "type": "record",
    "fields": [
      {"name": "userId", "type": "long", "doc": "User ID of the heart beat"},
      {"name": "hri", "type": "int", "doc": "Heart rate instant value"},
      {"name": "qrs", "type": "lin.louis.poc.models.HeartBeatQRS", "doc": "Event describing heart's activity"},
      {"name": "timestamp", "type": {"type": "long", "logicalType": "timestamp-millis"}, "doc": "Epoch timestamp of heart beat"}
    ]
  }
]
```

I needed to have the declaration of those two models in a single schema file because the Schema
Registry does not support having a schema that is dependent of another schema file.

I struggled a bit to make it work before finding this stackoverflow answer:
https://stackoverflow.com/questions/40854529/nesting-avro-schemas#40865366

### Heart rate model

The heart model is the following:

- `userId`: the ID of the user associated to the heart rate
- `value`: the computed heart rate from the heartbeats
- `timestamp`: the time of the registered heart rate
- `isReset`: Heart rate is reset if a gap is detected, a QRS type X is detected, HRI is out of range
  or the new timestamp is prior to the last detected timestamp

Which gives the following:

```json
{"namespace": "lin.louis.poc.models",
  "name": "HeartRate",
  "type": "record",
  "fields": [
    {"name": "userId", "type": "long", "doc": "User ID of the heart beat"},
    {"name": "value", "type": "double", "doc": "Heart rate value"},
    {"name": "timestamp", "type": {"type": "long", "logicalType": "timestamp-millis"}, "doc": "Epoch timestamp of heart beat"},
    {"name":  "isReset", "type":  "boolean", "default": false, "doc": "Heart rate is reset if a gap is detected, a QRS type X is detected, HRI is out of range or the new timestamp is prior to the last detected timestamp"}
  ]
}
```

### Avro Java object generation

I used the [avro-maven-plugin](https://avro.apache.org/docs/current/gettingstartedjava.html) to
generate the Java POJOs. Tus I created a maven module
[`heart-models`](https://github.com/l-lin/poc-kafka/tree/master/heart-models), so the other projects
can use it the auto-generated Java POJOs.

The `pom.xml` looks like this:

```xml
<dependencies>
  <dependency>
    <groupId>org.apache.avro</groupId>
    <artifactId>avro</artifactId>
  </dependency>
</dependencies>

<build>
  <plugins>
    <plugin>
      <groupId>org.apache.avro</groupId>
      <artifactId>avro-maven-plugin</artifactId>
      <executions>
        <execution>
          <phase>generate-sources</phase>
          <goals>
            <goal>schema</goal>
          </goals>
          <configuration>
            <sourceDirectory>${project.basedir}/src/main/resources/avro/</sourceDirectory>
            <outputDirectory>${project.build.directory}/generated-sources</outputDirectory>
          </configuration>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

So, by running a simple `mvn generate-sources`, this will generate the java classes in the folder
`target/generated-sources`.

It's also possible to check if the Avro schema defined in this project is compatible with what's
defined in the Schema Registry by using the
[kafka-schema-registry-maven-plugin](https://docs.confluent.io/current/schema-registry/develop/maven-plugin.html):

```xml
<build>
  <plugins>
    <plugin>
      <groupId>io.confluent</groupId>
      <artifactId>kafka-schema-registry-maven-plugin</artifactId>
      <executions>
        <execution>
          <goals><goal>test-compatibility</goal></goals>
        </execution>
      </executions>
      <configuration>
        <schemaRegistryUrls>
          <param>http://localhost:8081</param>
        </schemaRegistryUrls>
        <subjects>
          <heart-beats-value>${project.basedir}/src/main/resources/avro/HeartBeats.avsc</heart-beats-value>
          <heart-rates-value>${project.basedir}/src/main/resources/avro/HeartRate.avsc</heart-rates-value>
        </subjects>
        <outputDirectory/>
      </configuration>
    </plugin>
  </plugins>
</build>
```

It can be useful to boost the SDLC to check any potential issues when updating Avro schemas.

## Heart beat producer

{{< figure class="center" src="/images/2020-04-13/heart-beat-producer.svg" alt="heart-beat-producer" title="heart-beat-producer" >}}

The smart-watches must send their data somewhere. Thus, I started with a classical spring-boot
MVC project, auto-generated from the [Spring Initializr](https://start.spring.io/). The `pom.xml`
looks like this:

```xml
<dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
<build>
  <finalName>heart-beat-producer</finalName>
  <plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
    </plugin>
</build>
```

Just a simple dependency to `spring-boot-starter-web` and we can create the controller.

### REST endpoint to register a heartbeat

Nothing too complicated:

```java
@RestController
@RequestMapping(path = "/heart-beats")
public class HBController {

  private final HBRepository hbRepository;

  public HBController(HBRepository hbRepository) {
    this.hbRepository = hbRepository;
  }

  /**
   * Simple endpoint the smart-watch can attack to register a new heartbeat
   */
  @PostMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void create(@RequestBody HeartBeatDTO heartBeatDTO) {
    var heartBeat = HeartBeat.newBuilder()
                 .setUserId(heartBeatDTO.getUserId())
                 .setHri(heartBeatDTO.getHri())
                 .setQrs(heartBeatDTO.getQrs())
                 .setTimestamp(Instant.now())
                 .build();
    hbRepository.save(heartBeat);
  }
}
```

You may notice that I use a `HeartBeatDTO`, it's because the `HeartBeat` Java class, auto-generated
by the avro-maven-plugin, contains other methods, like `getSchema()`, which Jackson do not like to
serialize.

### Sending the heartbeat to Kafka

The `HBRepository` is a simple interface that will save the heartbeat somewhere:

```java
public interface HBRepository {
  void save(HeartBeat heartBeat);
}
```

The implementation is the following:

```java
/**
 * Simple Spring Kafka producer implementation.
 *
 * @see <a href="https://docs.spring.io/spring-kafka/docs/2.3.7.RELEASE/reference/html/#kafka-template">Spring Kafka
 * documentation</a>
 */
public class KafkaHBRepository implements HBRepository {

  private final Logger logger = LoggerFactory.getLogger(getClass());

  private final String topicName;

  private final KafkaTemplate<Long, HeartBeat> kafkaTemplate;

  public KafkaHBRepository(String topicName, KafkaTemplate<Long, HeartBeat> kafkaTemplate) {
    this.topicName = topicName;
    this.kafkaTemplate = kafkaTemplate;
  }

  @Override
  public void save(HeartBeat heartBeat) {
    logger.debug(
        "Sending to kafka topic '{}' the following heart beat in key {}: {}",
        topicName,
        heartBeat.getUserId(),
        heartBeat
    );
    // using the userId as the topic key, so I can easily aggregate them afterwards
    kafkaTemplate.send(topicName, heartBeat.getUserId(), heartBeat);
  }
}
```

As you notice, I used Spring Kafka to help me easily configure the Kafka producer client
`KafkaTemplate` by providing the right properties in my `application.yml` file:

```yaml
spring:
  kafka:
    bootstrap-servers:
      - localhost:9092
    properties:
      # using a schema registry to fetch the Avro schemas
      # see https://docs.confluent.io/current/schema-registry/index.html
      schema.registry.url: http://localhost:8081
    producer:
      # producer properties can be found in org.apache.kafka.clients.producer.ProducerConfig
      key-serializer: org.apache.kafka.common.serialization.LongSerializer
      value-serializer: io.confluent.kafka.serializers.KafkaAvroSerializer
```

Kafka likes bytes array, so we need to specify the serializers to use when serializing the key and
the value of the message.

The Kafka client also needs a URL to the Schema Registry to fetch the Avro schemas.

However, the timestamp is not registered correctly. Indeed, the timestamps in the input are in
`Long` in milliseconds, and they are represented as an `Instant`, whereas Jackson reads timestamp as
nanoseconds.

I found this [blog
post](https://www.codesd.com/item/effective-way-to-have-jackson-serialize-java-8-instant-as-epoch-milliseconds.html)
that helps me find a simple solution by adding the right properties in Jackson:

```yaml
spring:
  jackson:
    # ensure the input/output in epoch milli are correctly read/written by Jackson
    deserialization:
      READ_DATE_TIMESTAMPS_AS_NANOSECONDS: false
    serialization:
      WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS: false
```

### Unit tests

[Following the example to test Kafka given by
Spring](https://docs.spring.io/spring-kafka/docs/2.3.7.RELEASE/reference/html/#example), I added the
following dependencies to my `pom.xml`:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <scope>test</scope>
  <exclusions>
    <exclusion>
      <groupId>org.junit.vintage</groupId>
      <artifactId>junit-vintage-engine</artifactId>
    </exclusion>
  </exclusions>
</dependency>
<dependency>
  <groupId>org.springframework.kafka</groupId>
  <artifactId>spring-kafka-test</artifactId>
  <scope>test</scope>
</dependency>
```

However, there is lots of boilerplate code... And I got lots of `Caused by:
java.lang.ClassCastException: class org.apache.avro.generic.GenericData$Record cannot be cast to
class lin.louis.poc.models.HeartBeat (org.apache.avro.generic.GenericData$Record and
lin.louis.poc.models.HeartBeat are in unnamed module of loader 'app')`. It's due to the fact that my
Avro schema is considered as specific since I used a timestamp... I did not know this beforehand...
For me, it was a simple schema, so I naively used the `GenericAvroSerializer` (and I did not know
the existence of the `SpecificAvroSerializer`...). What a mistake! I struggled some hours just to
find a innocent comment on [Stackoverflow](https://stackoverflow.com/a/58390067/3612053) that led me
go into "AHA" moment...

The Kafka producer configuration can be set like this:

```java
private void buildProducer() {
  // Using the helper provided by Spring KafkaTestUtils#producerProps to boilerplate the producer properties
  var producerProps = KafkaTestUtils.producerProps(embeddedKafka);
  // Use the right serializers for the topic key and value
  producerProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, LongSerializer.class);
  producerProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, SpecificAvroSerializer.class);
  producerProps.put(KafkaAvroSerializerConfig.SCHEMA_REGISTRY_URL_CONFIG, schemaRegistry.getUrl());
  var template = new KafkaTemplate<>(new DefaultKafkaProducerFactory<Long, HeartBeat>(producerProps));
  hbRepository = new KafkaHBRepository(TOPIC, template);
}
```

As you may have notice, I use a `schemaRegistry` instance. But since it's a unit test, I do not want
to mount a Schema Registry only for my tests.

After some searches on the internet, I found a library, from [Bakdata](https://www.bakdata.com/),
[schema-registry-mock](https://github.com/bakdata/fluent-kafka-streams-tests/tree/master/schema-registry-mock)
that can help mock the Schema Registry! It provides a nice JUnit5 extension to start up a Schema
Registry mock for each test. I need to add a new dependency:

```xml
<dependency>
  <groupId>com.bakdata.fluent-kafka-streams-tests</groupId>
  <artifactId>schema-registry-mock-junit5</artifactId>
  <scope>test</scope>
</dependency>
```

Now, all I have to do is to declare it like this:

```java
@RegisterExtension
final SchemaRegistryMockExtension schemaRegistry = new SchemaRegistryMockExtension();
```

Finally, I need a consumer to check if my messages are sent correctly to Kafka. Using the [example
provided by Spring](https://docs.spring.io/spring-kafka/docs/2.3.7.RELEASE/reference/html/#example),
this is the consumer configuration:

```java
private void buildConsumer() {
  var consumerProps = KafkaTestUtils.consumerProps("consumer", "false", embeddedKafka);
  consumerProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, LongDeserializer.class);
  consumerProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, SpecificAvroDeserializer.class);
  consumerProps.put(KafkaAvroDeserializerConfig.SCHEMA_REGISTRY_URL_CONFIG, schemaRegistry.getUrl());
  consumerRecords = new LinkedBlockingQueue<>();
  container = new KafkaMessageListenerContainer<>(
      new DefaultKafkaConsumerFactory<>(consumerProps),
      new ContainerProperties(TOPIC)
  );
  container.setupMessageListener((MessageListener<Long, HeartBeat>) record -> consumerRecords.add(record));
  container.start();
  ContainerTestUtils.waitForAssignment(container, embeddedKafka.getPartitionsPerTopic());
}
```

Now I can perform the tests:

```java
@Test
void send_shouldSendKafkaMessage() throws InterruptedException {
  // GIVEN
  var now = Instant.now();
  var heartBeat = new HeartBeat(123L, 80, HeartBeatQRS.A, now);

  // WHEN
  hbRepository.save(heartBeat);
  var received = consumerRecords.poll(10, TimeUnit.SECONDS);

  // THEN
  assertNotNull(received);
  var receivedValue = received.value();
  assertNotNull(receivedValue);
  assertAll(() -> {
    assertEquals(heartBeat.getUserId(), receivedValue.getUserId());
    assertEquals(heartBeat.getHri(), receivedValue.getHri());
    assertEquals(heartBeat.getQrs(), receivedValue.getQrs());
    assertEquals(heartBeat.getTimestamp(), receivedValue.getTimestamp());
  });
}
```

[You can check the whole test file here.](https://github.com/l-lin/poc-kafka/blob/master/heart-beat-producer/src/test/java/lin/louis/poc/hbp/repository/kafa/KafkaHBRepositoryTest.java)

### Running heart-beat-producer

I want my whole environment to be run by docker-compose, so I need to build a Docker image for this
project. Here is a simple Dockerfile:

```
FROM openjdk:11.0.6-jre-slim

EXPOSE 8180
WORKDIR /opt
COPY target/heart-beat-producer.jar /opt
ENTRYPOINT ["java", "-jar", "/opt/heart-beat-producer.jar"]
```

I use [dockerfile-maven-plugin from Spotify](https://github.com/spotify/dockerfile-maven) to add the
docker image build during the maven build, so that `mvn package` build the JAR and the docker image,
which reduce the number of command lines to execute. So in my `pom.xml`, I add this dependency:

```xml
<build>
  <finalName>heart-beat-producer</finalName>
  <plugins>
    <plugin>
      <groupId>com.spotify</groupId>
      <artifactId>dockerfile-maven-plugin</artifactId>
      <executions>
        <execution>
          <id>default</id>
          <goals><goal>build</goal></goals>
        </execution>
      </executions>
      <configuration>
        <repository>linlouis/heart-beat-producer</repository>
      </configuration>
    </plugin>
  </plugins>
</build>
```

Then I declare the service in the `docker-compose.yml` file like this:

```yaml
version: '3'
services:
  heart-beat-producer:
    image: linlouis/heart-beat-producer
    depends_on:
      - schema-registry
    ports:
      - "8180-8199:8180"
    command: [
      "--spring.kafka.bootstrap-servers=kafka1:9092,kafka2:9092,kafka3:9092",
      "--spring.kafka.properties.schema.registry.url=http://schema-registry:8081",
      "--topic.partitions=3",
      "--topic.replicas=3"
    ]
```

As I want to simulate a "real world case", I need to be able to scale the services, that's why I set
a range of ports to use `"8180-8199:8180"`. I also need a load balancer to redirect the requests to
a heart-beat-producer app. I use [Nginx](https://www.nginx.com/) to do that. The configuration in
`nginx.conf` quite straightforward:

```conf
http {
  upstream heart-beat-producer {
    server heart-beat-producer:8180;
  }

  server {
    listen 80;

    location /heart-beat-producer {
      proxy_pass http://heart-beat-producer;
    }
  }
}
```

Then the declaration in the `docker-compose.yml` file:

```yaml
version: '3'
services:
  web:
    image: nginx:1.17.9-alpine
    depends_on:
      - heart-beat-producer
    ports:
      - 80:80
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

Now, using [docker-compose](https://docs.docker.com/compose/):

```bash
docker-compose up web --scale heart-beat-producer=3
```

This will fire up 3 zookeepers, 3 Kafkas, the schema registry, 3 heart-beat-producer apps and a
load balancer.

Using [HTTPie](https://httpie.org), register a heartbeat:

```bash
$ http :80/heart-beat-producer/heart-beats userId=1 hri=70 qrs=A
HTTP/1.1 204
Connection: keep-alive
Date: Mon, 13 Apr 2020 10:19:45 GMT
Keep-Alive: timeout=60
```

And observe the records in Kafka:

```bash
$ docker exec -it "${PWD##*/}_schema-registry_1" \
    /usr/bin/kafka-avro-console-consumer \
    --bootstrap-server kafka1:9092,kafka2:9092,kafka3:9092 \
    --topic heart-beats \
    --from-beginning
# Lots of logs...
{"userId":1,"hri":70,"qrs":"A","timestamp":1586773185132}
```

Excellent, we now have an endpoint that registers heartbeats in a Kafka topic.

## Heart smart-watch simulator

The idea of this project is to learn and play with Kafka. So I did not implement a smart-watch.
However, I need to have something in order to inject some data to the system.

Let's create a `heart-smartwatch-simulator` that will send random data to `heart-beat-producer` at a
random interval.

I use Golang as it's easy to spawn lots of goroutines that will send HTTP requests.

```go
for i := 0; i < nbUsers; i++ {
  go func(userID int) {
    for {
      // send HTTP request
      // sleep for a random amount of time
    }
  }(i+1)
}
```

We can go further by adding the possibility to simulate invalid heartbeats.

You can check out the
[project](https://github.com/l-lin/poc-kafka/tree/master/heart-smartwatch-simulator) if you are
interested on the implementation.

## Heart beat validator

{{< figure class="center" src="/images/2020-04-13/heart-beat-validator.svg" alt="heart-beat-validator" title="heart-beat-validator" >}}

We can now plug-in another service that will read that stream of heartbeats and apply a predicate to
figure out if the heartbeat is valid or not. We can even plug-in a Machine learning model to
identify the false positive heartbeats and handle them accordingly.

For this service, we will just use [Kafka Streams](https://kafka.apache.org/documentation/streams/).
It is made for real-time applications and micro-services that get data from Kafka, manipulate and
send them back to Kafka. The heart-beat-validator is a simple Java application that uses Kafka
Streams to filter out the valid heartbeats and register the invalid ones into another Kafka topic, in
case we want to study them in the future to perform other types of action.

For this project, I will need new libraries, especially ones that can manipulate Kafka Streams:

```xml
<dependency>
  <groupId>org.apache.kafka</groupId>
  <artifactId>kafka-streams</artifactId>
</dependency>
<dependency>
  <groupId>io.confluent</groupId>
  <artifactId>kafka-streams-avro-serde</artifactId>
</dependency>
```

### Kafka streams topology

To use Kafka streams, we need to define a Kafka Streams topology, which is basically a sequence of
actions.

First, I need to create the topics `heart-beats-valid` and `heart-beats-invalid`. So I use Spring
Kafka again to create them when the application starts up:

```java
@Bean
NewTopic topicHeartBeatsValid(TopicsProperties topicsProperties) {
  TopicsProperties.Topic t = topicsProperties.getTo().getValid();
  return TopicBuilder.name(t.getName())
             .partitions(t.getPartitions())
             .replicas(t.getReplicas())
             .build();
}

@Bean
NewTopic topicHeartBeatsInvalid(TopicsProperties topicsProperties) {
  TopicsProperties.Topic t = topicsProperties.getTo().getInvalid();
  return TopicBuilder.name(t.getName())
             .partitions(t.getPartitions())
             .replicas(t.getReplicas())
             .build();
}
```

My configuration looks like this (using Spring properties file):

```yaml
spring:
  kafka:
    bootstrap-servers:
      - localhost:9092
    properties:
      # using a schema registry to fetch the Avro schemas
      # see https://docs.confluent.io/current/schema-registry/index.html
      schema.registry.url: http://localhost:8081
    streams:
      application-id: heart-beat-validator
      replication-factor: 1
      # streams properties can be found in org.apache.kafka.clients.streams.StreamsConfig
      properties:
        default.key.serde: org.apache.kafka.common.serialization.Serdes$LongSerde
        # since my HeartBeat Avro schema is specific (I'm using a specific timestamp), I need to use SpecificAvroSerde, not GenericAvroSerde
        default.value.serde: io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde
```

Not sure if there is documentation to show a list of exhaustive serdes (I did not find it), I found
those serdes directly from the source code.

I use the
[KafkaStreamBrancher](https://docs.spring.io/spring-kafka/docs/2.3.7.RELEASE/reference/html/#using-kafkastreamsbrancher)
from Spring to build in a convenient way conditional branches on top of `KStream`:

```java
public KStream<Long, HeartBeat> buildKStream() {
  var from = streamsBuilder.<Long, HeartBeat>stream(topicFrom)
      // we can peek on the stream, to log or do other stuffs
      .peek((key, heartBeat) -> logger.debug("reading heart beat with key {}: {}", key, heartBeat));
  // just showing we can print in System.out for debug purpose
  from.print(Printed.toSysOut());
  return new KafkaStreamBrancher<Long, HeartBeat>()
      .branch(predicate, kStream -> kStream.to(topicValidTo))
      .defaultBranch(kStream -> kStream.to(topicInvalidTo))
      .onTopOf(from);
}
```

This code is quite straightforward: if the `predicate` returns `true`, then the record will be sent
to the `heart-beats-valid` topic, other to the `heart-beats-invalid`.

### Unit tests

I use [Bakdata fluent-kafka-streams-tests](https://github.com/bakdata/fluent-kafka-streams-tests) to
write the Kafka Streams tests:

```xml
<dependency>
  <groupId>com.bakdata.fluent-kafka-streams-tests</groupId>
  <artifactId>schema-registry-mock-junit5</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>com.bakdata.fluent-kafka-streams-tests</groupId>
  <artifactId>fluent-kafka-streams-tests-junit5</artifactId>
  <scope>test</scope>
</dependency>
```

It offers a JUnit5 extension `TestTopologyExtension`. However, it needs the Kafka properties, which
I do not have before the execution of the tests since I'm using
[spring-kafka-test](https://docs.spring.io/spring-kafka/docs/2.3.7.RELEASE/reference/html/#testing)
that provides an `@EmbeddedKafka` and `EmbeddedKafkaBroker` that start up a Kafka for the tests.
Thus, I have to initialize the `TestTopologyExtension` on my own, which gives something like this:

```java
@EmbeddedKafka(
    partitions = 1,
    topics = { "heart-beats", "heart-beats-valid", "heart-beats-invalid" }
)
@ExtendWith(SpringExtension.class)
class HBValidatorStreamBuilderTest {

  private static final String TOPIC_FROM = "heart-beats";

  private static final String TOPIC_TO_VALID = "heart-beats-valid";

  private static final String TOPIC_TO_INVALID = "heart-beats-invalid";

  @Autowired
  private EmbeddedKafkaBroker embeddedKafka;

  private TestTopologyExtension<Long, HeartBeat> testTopology;

  @BeforeEach
  void setUp() {
    // not registering the TestTopology as a JUnit extension because Kafka is instanciated by Spring Test in runtime
    testTopology = new TestTopologyExtension<>(topology, buildKafkaProperties(embeddedKafka));
    testTopology.start();
  }

  @AfterEach
  void tearDown() {
    if (testTopology != null) {
      testTopology.stop();
    }
  }

  private Properties buildKafkaProperties(EmbeddedKafkaBroker embeddedKafka) {
    var properties = new Properties();
    properties.put(StreamsConfig.APPLICATION_ID_CONFIG, "heart-beat-validator");
    properties.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, embeddedKafka.getBrokersAsString());
    properties.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.LongSerde.class.getName());
    properties.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, SpecificAvroSerde.class.getName());
    // we need to set this property, even if the URL does not exist, but it still needs to be syntactically valid
    properties.put(AbstractKafkaAvroSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG, "http://dummy");
    return properties;
  }
}
```

I do not need to use the `SchemaRegistryMockExtension` in this test as the `TestTopologyExtension`
does it automatically.

Do not forget to set the property `SCHEMA_REGISTRY_URL_CONFIG`! Even if we are using a mocked schema
registry, it stills needs to have a valid URL.

The test looks like this:

```java
@Test
void shouldSendToCorrespondingTopic() {
  var validHeartBeats = new HeartBeat[] {
      new HeartBeat(101L, 50, HeartBeatQRS.A, Instant.now()),
      new HeartBeat(102L, 80, HeartBeatQRS.V, Instant.now()),
      new HeartBeat(103L, 90, HeartBeatQRS.F, Instant.now()),
      new HeartBeat(104L, 150, HeartBeatQRS.A, Instant.now()),
      new HeartBeat(105L, 5, HeartBeatQRS.P, Instant.now())
  };
  var invalidHeartBeats = new HeartBeat[] {
      new HeartBeat(-201L, 190, HeartBeatQRS.X, Instant.now()),
      new HeartBeat(-202L, 390, HeartBeatQRS.A, Instant.now()),
      new HeartBeat(-203L, -19, HeartBeatQRS.F, Instant.now())
  };
  testTopology.input(TOPIC_FROM)
        .add(validHeartBeats[0].getUserId(), validHeartBeats[0])
        .add(validHeartBeats[1].getUserId(), validHeartBeats[1])
        .add(validHeartBeats[2].getUserId(), validHeartBeats[2])
        .add(invalidHeartBeats[0].getUserId(), invalidHeartBeats[0])
        .add(invalidHeartBeats[1].getUserId(), invalidHeartBeats[1])
        .add(validHeartBeats[3].getUserId(), validHeartBeats[3])
        .add(invalidHeartBeats[2].getUserId(), null)
        .add(validHeartBeats[4].getUserId(), validHeartBeats[4]);

  var testOutputValid = testTopology.streamOutput(TOPIC_TO_VALID);
  Arrays.stream(validHeartBeats)
      .forEach(validHeartBeat -> testOutputValid.expectNextRecord()
                          .hasKey(validHeartBeat.getUserId())
                          .hasValue(validHeartBeat));
  testOutputValid.expectNoMoreRecord();

  testTopology.streamOutput(TOPIC_TO_INVALID)
        .expectNextRecord().hasKey(invalidHeartBeats[0].getUserId()).hasValue(invalidHeartBeats[0])
        .expectNextRecord().hasKey(invalidHeartBeats[1].getUserId()).hasValue(invalidHeartBeats[1])
        // can't check null
        .expectNextRecord().hasKey(invalidHeartBeats[2].getUserId())
        .expectNoMoreRecord();
}
```

### Running heart-beat-validator

Using [docker-compose](https://docs.docker.com/compose/):

```bash
docker-compose up heart-beat-validator
```

This will fire up 3 zookeepers, 3 Kafkas, the schema registry, the heart-beat-producer and the
heart-beat-validator.

Using [HTTPie](https://httpie.org), register a heartbeat:

```bash
$ http :8180/heart-beat-producer/heart-beats userId=1 hri=70 qrs=A
HTTP/1.1 204
Connection: keep-alive
Date: Mon, 13 Apr 2020 10:19:45 GMT
Keep-Alive: timeout=60

$ http :8180/heart-beat-producer/heart-beats userId=1 hri=-70 qrs=A
HTTP/1.1 204
Connection: keep-alive
Date: Mon, 13 Apr 2020 10:19:45 GMT
Keep-Alive: timeout=60

$ http :8180/heart-beat-producer/heart-beats userId=1 hri=-100 qrs=F
HTTP/1.1 204
Connection: keep-alive
Date: Mon, 13 Apr 2020 10:19:45 GMT
Keep-Alive: timeout=60
```

And observe the records in Kafka:

```bash
$ docker exec -it "${PWD##*/}_schema-registry_1" \
    /usr/bin/kafka-avro-console-consumer \
    --bootstrap-server kafka1:9092,kafka2:9092,kafka3:9092 \
    --topic heart-beats-valid \
    --from-beginning
# Lots of logs...
{"userId":1,"hri":70,"qrs":"A","timestamp":1586773185132}

$ docker exec -it "${PWD##*/}_schema-registry_1" \
    /usr/bin/kafka-avro-console-consumer \
    --bootstrap-server kafka1:9092,kafka2:9092,kafka3:9092 \
    --topic heart-beats-invalid \
    --from-beginning
# Lots of logs...
{"userId":1,"hri":-70,"qrs":"A","timestamp":1586773186132}
{"userId":1,"hri":-100,"qrs":"F","timestamp":1586773286132}
```

## Heart rate computor

{{< figure class="center" src="/images/2020-04-13/heart-rate-computor.svg" alt="heart-rate-computor" title="heart-rate-computor" >}}

Everything we have done previously is just moving data across the network. It's nice but it's not
the heart of the whole project. Now we are tackling the service that reads heartbeats and compute
the heart rates.

This application is also a Kafka Streams application, however, it's different from the previous
services as it needs some sort of "state" to aggregate the heartbeats.

A heart rate is computed as following:

- its value is the median of the last 8 heartbeat HRI
- if it's less than 8 heartbeats, then its value is NaN

I use the same dependencies as the ones from [`heart-beat-validator`](#heart-beat-validator).

### Kafka Streams topology

The Kafka Streams configuration is the same as the previous Kafka Streams application
[`heart-beat-validator`](#kafka-streams-topology).

First, let's read the Kafka topic `heart-beats-valid`:

```java
KStream<Long, HeartBeat> kStream = streamsBuilder.<Long, HeartBeat>stream(topicFrom)
    .peek((userId, heartBeat) -> logger.debug("reading heart beat of user {}: {}", userId, heartBeat));
```

We will use a
[KTable](https://kafka.apache.org/24/documentation/streams/core-concepts#streams_concepts_aggregations)
to aggregate the heartbeats by user IDs:

```java
KTable<Long, HeartBeats> kTable = kStream
    .groupByKey()
    .aggregate(HeartBeats::new, HBAggregator.INSTANCE, Materialized.as("aggregated-heart-beats"));
```

You may have notice that I used a `HeartBeats` class, and not a `Collection<HeartBeat>`. I will
explain later why.

Now we have the KTable, we can perform the heart rate computation:

```java
KStream<Long, HeartRate> outKStream = kTable
    .toStream()
    .flatMapValues(new HRValueMapper(hrFactory, nbHeartBeats))
    .peek((userId, heartRate) -> logger.debug("heart rate computed for user {}: {}", userId, heartRate));
// then we write the heart rate into a kafka topic "heart-rates"
outKStream.to(topicTo);
```

### HeartBeats avro schema

It seems that when aggregating, Kafka perform some serialization. Since `HeartBeat` is a Avro object,
it will use the Avro serializer, and using a `Collection` will not work and we might get a `Caused
by: java.lang.ClassCastException`.

Just having a simple POJO is not enough, otherwise, we will still get the same error:

```
Caused by: java.lang.ClassCastException: class lin.louis.poc.hrc.model.HeartBeats cannot be cast to class org.apache.avro.specific.SpecificRecord (lin.louis.poc.hrc.model.HeartBeats and org.apache.avro.specific.SpecificRecord are in unnamed module of loader 'app')
```

So I had to add a new Avro schema. However, the [Avro
specification](https://avro.apache.org/docs/1.8.1/spec.html#schemas) is not clear on how to declare
an array... This does not work:

```json
{"name": "foo",
  "type": "array",
  "items": "string"
}
```

Neither does this work:

```json
{"name": "foo",
  "type": "record",
  "fields": [
  {"name": "list", "type": "array", "items": "string"}
  ]
}
```

It's not until I sawy this [blog
post](http://apache-avro.679487.n3.nabble.com/record-containing-array-of-records-in-python-avro-td2470711.html)
that I have to wrap a `type` inside of the `type`: `{"type": {"type": "array", "items": "string"}}`.
If you start learning Avro, Kafka and stuff... There are so many gotchas and implicit knowledge,
it's quite frustrating for beginners...

So my Avro schema for the array of heartbeats comes down to this:

```json
{"namespace": "lin.louis.poc.models",
  "name": "HeartBeats",
  "type": "record",
  "fields": [
    {"name": "userId", "type": "long", "doc": "User ID of the heart beats"},
    {"name": "heartBeats", "type": {"type": "array", "items": "lin.louis.poc.models.HeartBeat"}, "doc": "The representation of multiple heart beats of a user"}
  ]
}
```

### Heart rate value mapper

I map the `HeartBeats` into an `Iterable<HeartRate>` using the `HRValueMapper`:

```java
public class HRValueMapper implements ValueMapperWithKey<Long, HeartBeats, Iterable<HeartRate>> {
  @Override
  public Iterable<HeartRate> apply(Long userId, HeartBeats value) {
    var heartRates = new ArrayList<HeartRate>();
    // compute and transform the HeartBeats into Iterable<HeartRate>
    return heartRates;
  }
}
```

If you are interested in the implementation, check out the [source
code](https://github.com/l-lin/poc-kafka/blob/master/heart-rate-computor/src/main/java/lin/louis/poc/hrc/stream/HRValueMapper.java).

:warning: this will only work with kafka in cluster as it needs the property
`processing.guarantee=exactly_once` to ensure we have the expected behavior, i.e. fetching the
values from the KTable and computing directly in "real time". When the property
"processing.guarantee" is set to "at_least_once", the mapping will not be performed directly, and
there is a small time buffer before it performs the mapping, hence having weird behavior, like
having too many heartbeats for a single heart rate, or having heart beats with offset timestamps...

### Unit tests

No secret now, it's the same as the [unit tests from heart-beat-validator](#unit-tests-1).

The test will look like this:

```java
@Test
void shouldSendToCorrespondingTopic() {
  // GIVEN
  var heartBeats = Arrays.asList(
      new HeartBeat(USER_ID, 80, HeartBeatQRS.N, newInstant(1)),
      new HeartBeat(USER_ID, 100, HeartBeatQRS.V, newInstant(2)),
      new HeartBeat(USER_ID, 83, HeartBeatQRS.N, newInstant(3)),
      new HeartBeat(USER_ID, 80, HeartBeatQRS.P, newInstant(4)),
      new HeartBeat(USER_ID, 91, HeartBeatQRS.A, newInstant(5)),
      new HeartBeat(USER_ID, 88, HeartBeatQRS.N, newInstant(7)),
      new HeartBeat(USER_ID, 70, HeartBeatQRS.N, newInstant(8)),
      new HeartBeat(USER_ID, 10, HeartBeatQRS.F, newInstant(10)), // 8
      new HeartBeat(USER_ID, 90, HeartBeatQRS.F, newInstant(11)),
      new HeartBeat(USER_ID, 201, HeartBeatQRS.A, newInstant(12)),
      new HeartBeat(USER_ID, 88, HeartBeatQRS.A, newInstant(15)),
      new HeartBeat(USER_ID, 222, HeartBeatQRS.V, newInstant(17)),
      new HeartBeat(USER_ID, 89, HeartBeatQRS.P, newInstant(18)),
      new HeartBeat(USER_ID, 100, HeartBeatQRS.F, newInstant(19)),
      new HeartBeat(USER_ID, 101, HeartBeatQRS.F, newInstant(20))
  );

  // WHEN
  var heartBeatSerde = new SpecificAvroSerde<HeartBeat>(testTopology.getSchemaRegistry());
  heartBeatSerde.configure(testTopology.getStreamsConfig().originals(), false);
  TestInput<Long, HeartBeat> testInput = testTopology.input(TOPIC_FROM)
                             .withKeySerde(new Serdes.LongSerde())
                             .withValueSerde(heartBeatSerde);
  heartBeats.forEach(heartBeat -> testInput.add(heartBeat.getUserId(), heartBeat));

  // THEN
  TestOutput<Long, HeartRate> testOutput = testTopology.streamOutput(TOPIC_TO);
  var heartRates = Arrays.asList(
      new HeartRate(USER_ID, Double.NaN, heartBeats.get(0).getTimestamp(), false),
      new HeartRate(USER_ID, Double.NaN, heartBeats.get(1).getTimestamp(), false),
      new HeartRate(USER_ID, Double.NaN, heartBeats.get(2).getTimestamp(), false),
      new HeartRate(USER_ID, Double.NaN, heartBeats.get(3).getTimestamp(), false),
      new HeartRate(USER_ID, Double.NaN, heartBeats.get(4).getTimestamp(), false),
      new HeartRate(USER_ID, Double.NaN, heartBeats.get(5).getTimestamp(), false),
      new HeartRate(USER_ID, Double.NaN, heartBeats.get(6).getTimestamp(), false),
      new HeartRate(USER_ID, 81.5, heartBeats.get(7).getTimestamp(), false),
      new HeartRate(USER_ID, 85.5, heartBeats.get(8).getTimestamp(), false),
      new HeartRate(USER_ID, 85.5, heartBeats.get(9).getTimestamp(), false),
      new HeartRate(USER_ID, 88d, heartBeats.get(10).getTimestamp(), false),
      new HeartRate(USER_ID, 89d, heartBeats.get(11).getTimestamp(), false),
      new HeartRate(USER_ID, 88.5, heartBeats.get(12).getTimestamp(), false),
      new HeartRate(USER_ID, 89.5, heartBeats.get(13).getTimestamp(), false),
      new HeartRate(USER_ID, 95d, heartBeats.get(14).getTimestamp(), false)
  );
  heartRates.forEach(heartRate -> testOutput.expectNextRecord()
                        .hasKey(heartRate.getUserId())
                        .hasValue(heartRate));
  testOutput.expectNoMoreRecord();
}
```

### Running heart-rate-computor

Using [docker-compose](https://docs.docker.com/compose/):

```bash
docker-compose up heart-rate-computor
```

This will fire up 3 zookeepers, 3 Kafkas, the schema registry, the heart-beat-producer, the
heart-beat-validator and the heart-rate-computor

Using [HTTPie](https://httpie.org), register heartbeats every second:

```bash
$ while true; do http :8180/heart-beat-producer/heart-beats userId=1 hri=70 qrs=A; sleep 1; done
```

And observe the records in Kafka:

```bash
$ docker exec -it "${PWD##*/}_schema-registry_1" \
    /usr/bin/kafka-avro-console-consumer \
    --bootstrap-server kafka1:9092,kafka2:9092,kafka3:9092 \
    --topic heart-rates \
    --from-beginning
# Lots of logs...
{"userId":1,"value":70,"timestamp":1586788974000, "isReset": false}
{"userId":1,"value":71,"timestamp":1586788975000, "isReset": false}
{"userId":1,"value":71.5,"timestamp":1586788976000, "isReset": false}
# ...
```

## Heart rate connector

{{< figure class="center" src="/images/2020-04-13/heart-rate-connector.svg" alt="heart-rate-connector" title="heart-rate-connector" >}}

Most modern backend services use a database to store and read data. So I choose PostgreSQL because
that's the kind a database I'm most familiar with. However, it's totally possible to use another
type of database, like a NoSQL one (choose this type if you are dealing with really large amount of
data, like [ScyllaDB](https://www.scylladb.com/)), or a search index such as Elasticsearch.

There are [lots of connectors supported](https://docs.confluent.io/current/connect/managing/connectors.html).

### Configuring Kafka connect

There is [lots of documentation on Confluent
website](https://docs.confluent.io/current/installation/docker/config-reference.html#kafka-connect-configuration),
however, it's more like a reference documentation, not a tutorial. I honestly struggled to understand
what properties I needed to use.

My final configuration looks like this on my `docker-compose.yml` file:

```yaml
version: '3'
services:
  heart-rate-connector:
    image: confluentinc/cp-kafka-connect:${CONFLUENT_TAG}
    depends_on:
      - kafka1
      - kafka2
      - kafka3
      - db
      - schema-registry
    ports:
      - 8082:8082
    # https://docs.confluent.io/current/installation/docker/config-reference.html#kafka-connect-configuration
    environment:
      CONNECT_REST_PORT: 8082
      CONNECT_REST_ADVERTISED_HOST_NAME: heart-rate-connector
      CONNECT_TOPICS: heart-rates
      # kafka configuration
      CONNECT_BOOTSTRAP_SERVERS: kafka1:9092,kafka2:9092,kafka3:9092
      CONNECT_GROUP_ID: heart-rate-connector
      CONNECT_CONFIG_STORAGE_TOPIC: _heart-rate-connector-config
      CONNECT_OFFSET_STORAGE_TOPIC: _heart-rate-connector-offset
      CONNECT_STATUS_STORAGE_TOPIC: _heart-rate-connector-status
      CONNECT_KEY_CONVERTER: org.apache.kafka.connect.storage.StringConverter
      CONNECT_VALUE_CONVERTER: io.confluent.connect.avro.AvroConverter
      CONNECT_VALUE_CONVERTER_SCHEMA_REGISTRY_URL: http://schema-registry:8081
      CONNECT_SCHEMA_REGISTRY_URL: http://schema-registry:8081
      # log
      CONNECT_LOG4J_ROOT_LOGLEVEL: "INFO"
      CONNECT_LOG4J_LOGGERS: "org.apache.kafka.connect.runtime.rest=WARN,org.reflections=ERROR"
      CONNECT_PLUGIN_PATH: '/usr/share/java'
      # level of parallelism: increase that number up to the number of partitions it's reading
      CONNECT_TASKS_MAX: 3
    volumes:
      - $PWD/scripts:/scripts
```

I set every properties described in the documentation:

- https://docs.confluent.io/current/connect/managing/configuring.html
- https://docs.confluent.io/current/installation/docker/config-reference.html#kafka-connect-configuration
- https://docs.confluent.io/current/connect/kafka-connect-jdbc/sink-connector/sink_config_options.html

But it does not create the table, nor does it insert data...

When I call `http :8082/connectors`, it always returns an empty array `[]`...

It's until I saw this
[example](https://github.com/confluentinc/examples/blob/5.4.1-post/postgres-debezium-ksql-elasticsearch/postgres-debezium-ksql-elasticsearch-docker-short.adoc#pre-flight-setup)
that I knew I need to add the connector manually. The docker image does not initialize the connector
itself (like for example the PostgreSQL docker image where it's possible to initialize the database
with some dump).

Thus, I created a small script to initialize the connector:

```bash
curl -X "POST" "http://localhost:8082/connectors/" \
     -H "Content-Type: application/json" \
     -d '{
          "name": "heart-rate-connector-sink",
          "config": {
            "connector.class": "io.confluent.connect.jdbc.JdbcSinkConnector",
            "connection.url": "jdbc:postgresql://db:5432/heart_monitor?applicationName=heart-rate-connector",
            "connection.user": "postgres",
            "connection.password": "postgres",
            "auto.create":"true",
            "auto.evolve":"true",
            "pk.mode": "kafka",
            "topics": "heart-rates",
            "key.converter": "org.apache.kafka.connect.storage.StringConverter",
            "transforms": "ExtractTimestamp,RenameField",
            "transforms.ExtractTimestamp.type": "org.apache.kafka.connect.transforms.InsertField$Value",
            "transforms.ExtractTimestamp.timestamp.field" : "extract_ts",
            "transforms.RenameField.type": "org.apache.kafka.connect.transforms.ReplaceField$Value",
            "transforms.RenameField.renames" : "userId:user_id,isReset:is_reset"
          }
     }'
```

Some properties to highlight:

- `key.converter`: the default converter provided by the connected workers being Avro, it would
  throw an error as the key type is a `Long`, so I use the `StringConverter` here instead (there
  are no `LongConverter`, only `StringConverter`, `JsonConverter` and the Avro one).
- `transforms`: by default, Kafka Connect will take the topic and its content as is, and create the
  table and columns with the same name as the one defined in the Kafka, i.e. `userId`, `isReset`.
  However, these field names are not "standard" for PostgreSQL (even if it works, it's not really
  nice to query as we always need to escape the column names when writing a SQL query). It's possible
  to rename using the "transforms" property by using
  [RenameField](https://docs.confluent.io/current/connect/transforms/replacefield.html#rename-a-field).
- `transforms`: I also added a new column that contains the timestamp for which the record has been
  added to Kafka. This was just an example that shows that Kafka Connect can add new fields.

### Running Kafka Connect

Using [docker-compose](https://docs.docker.com/compose/):

```bash
docker-compose up heart-rate-computor heart-rate-connector -d
```

Wait until Kafka connect is fully started, then execute the previous curl command to initialize the
table.

Using [HTTPie](https://httpie.org), register heartbeats every second:

```bash
$ while true; do http :80/heart-beat-producer/heart-beats userId=1 hri=70 qrs=A; sleep 1; done
```

Then you can check the content of the database:

```bash
$ docker exec -it "${PWD##*/}_db_1" \
  psql -U postgres heart_monitor -c "SELECT * FROM \"heart-rates\""
```

Note: I did not find the configuration / a way to rename the table name...

## Heart rate consumer

{{< figure class="center" src="/images/2020-04-13/heart-rate-consumer.svg" alt="heart-rate-consumer" title="heart-rate-consumer" >}}

Now, I need to display the heart rates in a nice graph in two ways:

- in real-time by consuming directly the records in the Kafka topic `heart-rates`
- a time based snapshot of the heart rates graph by reading in the database
  - To avoid the user typing a timestamp, I will just have a functionality to show the N last seconds
    heart rates, where N can be configured by the user (with 60 seconds as the default value).

### Kafka consumer configuration

Using Spring Kafka, I configure the properties directly in my `application.yml` file:

```yaml
spring:
  kafka:
    bootstrap-servers:
      - localhost:9092
    properties:
      schema.registry.url: http://localhost:8081
      # found here: io.confluent.kafka.serializers.AbstractKafkaAvroDeserializer.configure
      # needed if we have Specific Avro object, not Generic Avro object (i.e. containing only simple fields)
      specific.avro.reader: true
    consumer:
      # consumer properties can be found in org.apache.kafka.clients.consumer.ConsumerConfig
      key-deserializer: org.apache.kafka.common.serialization.LongDeserializer
      value-deserializer: io.confluent.kafka.serializers.KafkaAvroDeserializer
      # we do not want to retrace all the heart rate history
      auto-offset-reset: latest
      group-id: heart-rate-consumer
```

Some points to note:

- I need to set the flag `spring.kafka.properties.specific.avro.reader` because, again, I'm using a
  Specficic Avro object (and this is not written in the documentation, had to search for some time
  before I found it somewhere in stackoverflow...)
- since it's real time display, no need to retrace the history, so we will just consume the latest
  records by configuring the property `spring.kafka.consumer.auto-offset-reset` to `latest`.

Now I want the `heart-rate-consumer` to continuously stream the data. However, Kafka does not do it
natively (or maybe we need to tweak the code to make it work), but it's not necessarily as we can
use [Reactor Kafka](https://projectreactor.io/docs/kafka/release/reference/). So let's add the
dependency to the `pom.xml`:

```xml
<dependency>
  <groupId>io.projectreactor.kafka</groupId>
  <artifactId>reactor-kafka</artifactId>
</dependency>
```

Now I can consume a stream of heart rates continuously with the following KafkaReceiver usage:

```java
@Override
public Flux<HeartRate> read(long userId) {
  var consumerProperties = kafkaProperties.buildConsumerProperties();
  consumerProperties.put(
      ConsumerConfig.GROUP_ID_CONFIG,
      // Set a different Kafka group so the consumers are independent and can all read
      consumerProperties.get(ConsumerConfig.GROUP_ID_CONFIG) + "-" + UUID.randomUUID().toString()
  );
  var receiverOptions = ReceiverOptions
      .<Long, HeartRate>create(consumerProperties)
      .subscription(Collections.singletonList("heart-rates"))
      // just for logging purpose
      .addAssignListener(partitions -> logger.debug("onPartitionsAssigned {}", partitions))
      .addRevokeListener(partitions -> logger.debug("onPartitionsRevoked {}", partitions));
  return KafkaReceiver.create(receiverOptions)
            .receive()
            .filter(r -> userId == r.key())
            .map(ConsumerRecord::value);
}
```

Two points:

- no need to implement the use case when the client cancels, it's already handled by
  [`reactor.kafka.receiver.internals.DefaultKafkaReceiver#dispose()`](https://github.com/reactor/reactor-kafka/blob/v1.2.2.RELEASE/src/main/java/reactor/kafka/receiver/internals/DefaultKafkaReceiver.java#L343)
- when I put another kafka consumer, only the first consumer reads the data because they are in
  the same group ("Kafka guarantees that a message is only ever read by a single consumer in the
  group."). However, each time a user will display the real time graph, it should also read in the
  Kafka topic. That's why I "hacked" by generating a random group ID using `UUID.randomUUID()`.

### Unit test Reactor Kafka

To test the Reactor Kafka consumer, I need to use the
[`reactor-tests`](https://projectreactor.io/docs/core/release/reference/index.html#testing), so in
my `pom.xml`:

```xml
<dependency>
  <groupId>io.projectreactor</groupId>
  <artifactId>reactor-test</artifactId>
  <scope>test</scope>
</dependency>
```

I need to initialize the consumer as well as a producer to generate the Kafka records in the topic:

```java
@EmbeddedKafka(
    partitions = 1,
    topics = "heart-rates"
)
@ExtendWith(SpringExtension.class)
class KafkaHRFluxRepositoryTest {

  private final Logger logger = LoggerFactory.getLogger(getClass());

  public static final String TOPIC = "heart-rates";

  @RegisterExtension
  SchemaRegistryMockExtension schemaRegistry = new SchemaRegistryMockExtension();

  @Autowired
  private EmbeddedKafkaBroker embeddedKafka;

  private KafkaTemplate<Long, HeartRate> kafkaTemplate;

  @BeforeEach
  void setUp() {
    // CONSUMER
    var kafkaProperties = new KafkaProperties();
    kafkaProperties.setBootstrapServers(Arrays.stream(embeddedKafka.getBrokerAddresses())
                          .map(BrokerAddress::toString)
                          .collect(Collectors.toList()));
    kafkaProperties.getProperties().put(SCHEMA_REGISTRY_URL_CONFIG, schemaRegistry.getUrl());
    kafkaProperties.getProperties().put(SPECIFIC_AVRO_READER_CONFIG, "true");
    kafkaProperties.getConsumer().setGroupId("heart-rate-consumer");
    kafkaProperties.getConsumer().setKeyDeserializer(LongDeserializer.class);
    kafkaProperties.getConsumer().setValueDeserializer(SpecificAvroDeserializer.class);
    // need to set to earliest, because we send the kafka message first, before reading
    kafkaProperties.getConsumer().setAutoOffsetReset("earliest");
    hrFluxRepository = new KafkaHRFluxRepository(kafkaProperties);

    // PRODUCER
    var producerProps = KafkaTestUtils.producerProps(embeddedKafka);
    producerProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, LongSerializer.class);
    producerProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, SpecificAvroSerializer.class);
    producerProps.put(KafkaAvroSerializerConfig.SCHEMA_REGISTRY_URL_CONFIG, schemaRegistry.getUrl());
    kafkaTemplate = new KafkaTemplate<>(new DefaultKafkaProducerFactory<>(producerProps));
  }
}
```

I have to set the property `auto-offset-reset` to `earliest` because I'm dealing with a single
thread test, so I will first send the record to Kafka, then use my Kafka consumer to read the
record.

```java
@Test
void read_shouldReadKafkaMessages() {
  // GIVEN
  var heartRates = Arrays.asList(
      new HeartRate(USER_ID, 90d, Instant.now(), false),
      new HeartRate(USER_ID, 91d, Instant.now(), false),
      new HeartRate(USER_ID, Double.NaN, Instant.now(), false)
  );
  heartRates.forEach(heartRate -> kafkaTemplate.send(TOPIC, USER_ID, heartRate));

  // WHEN
  var step = StepVerifier.create(hrFluxRepository.read(USER_ID));

  // THEN
  heartRates.forEach(heartRate -> {
    step.assertNext(heartRateRead -> {
      assertNotNull(heartRateRead);
      logger.info("Read heart rate: {}", heartRateRead);
      assertEquals(USER_ID, heartRateRead.getUserId());
      assertEquals(heartRate.getValue(), heartRateRead.getValue());
      assertEquals(heartRate.getTimestamp(), heartRateRead.getTimestamp());
      assertEquals(heartRate.getIsReset(), heartRateRead.getIsReset());
    });
  });
  step.verifyTimeout(Duration.ofSeconds(1));
}
```

I use the
[`StepVerifier`](https://projectreactor.io/docs/core/release/reference/index.html#_testing_a_scenario_with_stepverifier)
to simulate the consumption and to test the record.

Something to remind when dealing with reactive programming:

> Nothing happen until you subscribe

That means until `step.verify*` is called, nothing will happen.

### Endpoint to read in real time

There are lots of possibility to have a frontend client to get a stream of data continuously:

- polling
- server-sent events
- websockets

I read this [excellent blog
post](https://codeburst.io/polling-vs-sse-vs-websocket-how-to-choose-the-right-one-1859e4e13bd9)
which led me into developing the server-sent event approach.

To implement it, I use
[spring-webflux](https://docs.spring.io/spring-framework/docs/5.2.5.RELEASE/spring-framework-reference/web-reactive.html#spring-webflux).
So in my `pom.xml`:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

My controller looks like this:

```java
@RestController
public class HRController {

  private final HRFetcher hrFetcher;

  public HRController(HRFetcher hrFetcher) {
    this.hrFetcher = hrFetcher;
  }

  @GetMapping(path = "/users/{userId}/heart-rates/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public Publisher<HeartRateDTO> heartRateFlux(@PathVariable long userId) {
    return hrFetcher.fetch(userId);
  }
}
```

You may notice I returned a `HeartRateDTO`, not a `HeartRate` because the auto-generated `HeartRate`
contains some getter like `getSchema()` that Jackson does not really like to serialize/deserialize.

### Unit tests HRController

To test the controller, I simply use `WebTestClient`:

```java
@ExtendWith(SpringExtension.class)
@WebFluxTest(controllers = HRController.class)
class HRControllerTest {

  private static final long USER_ID = 123L;

  @MockBean
  private HRFetcher hrFetcher;

  @Autowired
  private WebTestClient webTestClient;

  @Test
  void heartRateFlux() {
    // GIVEN
    var heartRates = new HeartRateDTO[] {
        new HeartRateDTO(USER_ID, 90d, Instant.now(), false),
        new HeartRateDTO(USER_ID, 91d, Instant.now(), false),
        new HeartRateDTO(USER_ID, Double.NaN, Instant.now(), false)
    };
    Mockito.when(hrFetcher.fetch(USER_ID)).thenReturn(Flux.fromArray(heartRates));

    // WHEN
    var heartRateList = webTestClient.get().uri("/users/{userId}/heart-rates/stream", USER_ID)
                     .accept(MediaType.TEXT_EVENT_STREAM)
                     .exchange()
                     .expectStatus().isOk()
                     .returnResult(HeartRateDTO.class)
                     .getResponseBody()
                     .take(heartRates.length)
                     .collectList()
                     .block();

    // THEN
    assertNotNull(heartRateList);
    assertEquals(heartRates.length, heartRateList.size());
    for (int i = 0; i < heartRates.length; i++) {
      assertEquals(heartRates[i].getUserId(), heartRateList.get(i).getUserId());
      assertEquals(heartRates[i].getValue(), heartRateList.get(i).getValue());
      assertEquals(heartRates[i].getTimestamp(), heartRateList.get(i).getTimestamp());
      assertEquals(heartRates[i].isReset(), heartRateList.get(i).isReset());
    }
  }
}
```

### Front to display the heart rates in real time

I use [Flot JS library](https://www.flotcharts.org/) to display a graph. So I configure it like
in this [example](https://www.flotcharts.org/flot/examples/realtime/index.html):

```javascript
let plot = $.plot('.heart-rate-placeholder', [ buildData() ], {
  series: {
    shadowSize: 0  // Drawing is faster without shadows
  },
  yaxis: {
    min: 0,
    max: 250
  },
  xaxis: {
    show: false
  }
});
plot.setupGrid();
plot.draw();
```

I built the data like this:

```javascript
const buildData = () => {
  if (data.length > 0) {
    data = data.slice(1);
  }

  if (heartRate && !isNaN(heartRate.value)) {
      data.push(heartRate.value);
  }
  while (data.length < totalPoints) {
    data.push(0);
  }

  let res = [];
  for (let i = 0; i < data.length; ++i) {
    res.push([i, data[i]])
  }
  return res;
}
```

To use the server-sent events in the front, we have to use the `EventSource` from native JS:

```javascript
let source = new EventSource(buildEventUrl(userId));
source.addEventListener('message', (event) => {
  heartRate = JSON.parse(event.data);
  console.info('read heart rate', heartRate);
});
```

Now, we need to update the data every second, so I use the native JS `setTimeout`:

```javascript
const update = () => {
  plot.setData([buildData()]);
  plot.draw();
  setTimeout(update, updateInterval);
};

update();
```

You can check the [whole file
here](https://github.com/l-lin/poc-kafka/blob/master/heart-rate-consumer/src/main/resources/static/assets/heart-rates.stream.js).

When all up and running, it displays a nice graph that updated in real time:

{{< figure class="center" src="/images/2020-04-13/heart-rates.gif" alt="Heart rates real time display" title="Heart rate real time display" >}}

### Database Access

I use [`spring-boot-data-jpa`](https://spring.io/guides/gs/accessing-data-jpa/) to read in the
database. My configuration looks like this:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/heart_monitor?applicationName=heart-rate-consumer
    username: postgres
    password: postgres
```

I need to create an `@Entity`:

```java
@Entity
// the table name must be escaped because it's not a standard name in Postgres world to have a hyphen in the table name
// which is auto-generated by heart-rate-computor (i.e. kafka connect)
@Table(name = "\"heart-rates\"")
public class HeartRateEntity {
  @Id
  @EmbeddedId
  private HeartRateId heartRateId;
  private long userId;
  private double value;
  private Instant timestamp;
  private boolean isReset;

  // getters & setters
}
```

Since I configured Kafka Connect to auto-generate the primary key, it has created 3 columns that
serve as the primary key:

- `__connect_topic`
- `__connect_partition`
- `__connect_offset`

We do not use the primary key, but it's necessarily to have a primary key when using Spring data
JPA. So I implemented the `HeartRateId` like this:

```java
public class HeartRateId implements Serializable {
  @Column(name = "__connect_topic")
  private String connectTopic;

  @Column(name = "__connect_partition")
  private int connectPartition;

  @Column(name = "__connect_offset")
  private long connectOffset;

  // getters & setters
```

Then, the repository looks like this:

```java
public interface HRRepository extends CrudRepository<HeartRateEntity, Void> {
  @Query(value = "SELECT DISTINCT user_id FROM \"heart-rates\" ORDER BY user_id", nativeQuery = true)
  List<Long> findUserIds();

  List<HeartRateEntity> findByUserIdAndTimestampIsAfterOrderByTimestampDesc(long userId, Instant timestampRef);
}
```

I need to fetch the list of user IDs so the user can select which heart rate graph (s)he wants to
see.

The other method is used to fetch the last N seconds heart rates.

### Router

Now, let's implement the router that will serve the last N seconds heart rates:

```java
@Component
public class HRRouter {

  @Bean
  RouterFunction<ServerResponse> hrRoute(HRRepository hrRepository) {
    return route(
        GET("/users/{userId}/heart-rates").and(accept(MediaType.APPLICATION_JSON)),
        request -> heartRateHandler(request, hrRepository)
    );
  }

  private Mono<ServerResponse> heartRateHandler(ServerRequest request, HRRepository hrRepository) {
    var userId = Long.parseLong(request.pathVariable("userId"));
    var seconds = Integer.parseInt(request.queryParam("lastNSeconds").orElse("60"));
    var lastNSeconds = Instant.now().minus(seconds, ChronoUnit.SECONDS);

    var hearRates = hrRepository.findByUserIdAndTimestampIsAfterOrderByTimestampDesc(userId, lastNSeconds);
    var hearRatesDTO = hearRates.stream()
                  .map(hr -> new HeartRateDTO(
                      hr.getUserId(),
                      hr.getValue(),
                      hr.getTimestamp(),
                      hr.isReset()
                  ))
                  .collect(Collectors.toList());
    return ServerResponse.ok().contentType(MediaType.APPLICATION_JSON)
               .body(BodyInserters.fromValue(hearRatesDTO));
  }
}
```

This is quite straightforward.

### Front to display the last N seconds

I simply use the native `XMLHttpRequest` to fetch the heart rates, then use the JS library Flot to
render the graph:

```javascript
const oReq = new XMLHttpRequest();
oReq.addEventListener('load', function() {
  if (this.status !== 200) {
    console.error('Server did not return the user id. Response status was', this.status);
    return;
  }
  const heartRates = JSON.parse(this.responseText);
  if (heartRates.length === 0) {
    $('.heart-rate-placeholder').text('No heart rate registered during this period');
  } else {
    const data = heartRatesToFlotData(heartRates);
    $.plot('.heart-rate-placeholder', [heartRatesToFlotData(heartRates)], {
      xaxis: {
        autoScale: 'none',
        mode: 'time',
        minTickSize: [1, 'second'],
        min: data[0][0],
        max: data[data.length - 1][0],
        timeBase: 'milliseconds'
      }
    });
  }
});
oReq.open('GET', buildUrl(userId, lastNSeconds));
oReq.send();
```

Mapping the received heart rates into data understandable by Flot is performed by this function:

```javascript
const heartRatesToFlotData = (heartRates) => {
  let data = [];
  for (let i = 0; i < heartRates.length; i++) {
    let hr = heartRates[i];
    data.push([new Date(hr.timestamp).getTime(), hr.value]);
  }
  return data;
};
```

Flot accept an array of array, for which the first element of the second array is the X axis, and
the second element of the second array is the heart rate value.

So it will display something like this:

{{< figure class="center" src="/images/2020-04-13/heart-rates.png" alt="Last 60 seconds heart rates" title="Last 60 seconds heart rates" >}}

### Running heart-rate-consumer

Using [docker-compose](https://docs.docker.com/compose/):

```bash
docker-compose up -d
```

Wait until Kafka connect is fully started, then execute the script to initialize the environment:

```bash
./scripts/setup.sh
```

Then use the `heart-rate-consumer` webapp:

```bash
firefox http://localhost
```

## Final notes

- The `heart-beat-validator` could completely be replaced by a
  [KSQL](https://www.confluent.io/product/ksql/) query.
- Using a [Time
  window](https://kafka.apache.org/24/documentation/streams/core-concepts#streams_concepts_windowing)
  in the `heart-rate-computor` could be another way to perform the aggregation and heart rate
  computation.

You can run the whole system, scale the application to check out how it behaves when under heavy
load:

- change the value of
  [`nb-users`](https://github.com/l-lin/poc-kafka/blob/master/docker-compose.yml#L186) of the
  heart-smartwatch-simulator to perform more requests / seconds
- you can use [docker-compose scale flag](https://docs.docker.com/compose/reference/up/) to mount
  multiple instances of the services

```bash
docker-compose up -d \
  --scale heart-beat-producer=3 \
  --scale heart-beat-validator=3 \
  --scale heart-rate-computor=3
```

:warning: you will need lots of resources. In my laptop with 4 CPU and 16Go RAM:

{{< figure class="center" src="/images/2020-04-13/resources_usage.png" alt="Resources usage" title="Resource usages" >}}

{{< figure class="center" src="/images/2020-04-13/docker-compose_consumption.png" alt="Consumption by containers" title="Consumption by containers" >}}

## Resources

__Kafka__

- [How to transform a batch pipeline into real time one](https://medium.com/@stephane.maarek/how-to-use-apache-kafka-to-transform-a-batch-pipeline-into-a-real-time-one-831b48a6ad85)
- [Confluent on testing streaming application](https://www.confluent.io/blog/stream-processing-part-2-testing-your-streaming-application/)
- [The internal of Kafka Gitbook](https://jaceklaskowski.gitbooks.io/apache-kafka/)
- [The internal of Kafka Streams Gitbook](https://jaceklaskowski.gitbooks.io/mastering-kafka-streams/)
- [Example of using Kafka Streams API](https://github.com/abhirockzz/kafka-streams-apis)
- [Exploring Kafka Streams](https://dev.to/itnext/learn-stream-processing-with-kafka-streams-stateless-operations-1k4h)
- [Reactor Kafka](https://projectreactor.io/docs/kafka/release/reference/)
- [Introduction to reactor Kafka](https://www.reactiveprogramming.be/an-introduction-to-reactor-kafka/)
- [How to choose number of topic partition](https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/)
- [Kafka replication explained](https://www.confluent.io/blog/hands-free-kafka-replication-a-lesson-in-operational-simplicity/)

__Avro__

- [Avro and the schema registry](https://aseigneurin.github.io/2018/08/02/kafka-tutorial-4-avro-and-schema-registry.html)
- [Avro specifications](https://avro.apache.org/docs/1.8.1/spec.html#schemas)
- [CodeNotFound Spring Kafka - Apache Avro serializer / deserializer example](https://codenotfound.com/spring-kafka-apache-avro-serializer-deserializer-example.html)
- [Confluent documentation on schema registry](https://docs.confluent.io/current/schema-registry/schema_registry_tutorial.html)
- [Stackoverflow question on testing Kafka consumer with Avro schema](https://stackoverflow.com/questions/57575067/kafka-consumer-unit-test-with-avro-schema-registry-failing)
- [Bakdata fluent-kafka-streams-test to test Kafka streams](https://github.com/bakdata/fluent-kafka-streams-tests)

__Spring__

- [Spring Kafka](https://docs.spring.io/spring-kafka/docs/2.3.7.RELEASE/reference/html/#kafka)
- [Using Apache Kafka and Spring platform to build event-driven micro-services](https://gamov.io/workshop/cnfl-pivotal-ord-2020.html#adding-avro-and-confluent-schema-registry-dependencies)
- [Spring Kafka Avro without registry for unit tests](https://github.com/ivlahek/kafka-avro-without-registry)
- [Spring Kafka Avro Streams example](https://github.com/gAmUssA/springboot-kafka-avro/blob/master/src/main/java/io/confluent/developer/kafkaworkshop/streams/KafkaStreamsApp.java)
- [Spring official documentation on Kafka Streams brancher](https://docs.spring.io/spring-kafka/docs/2.3.7.RELEASE/reference/html/#using-kafkastreamsbrancher)
- [Spring example to use KafkaStreamBrancher](https://github.com/spring-projects/spring-kafka/blob/v2.3.7.RELEASE/spring-kafka/src/test/java/org/springframework/kafka/streams/KafkaStreamsBranchTests.java#L158-L166)
- [Spring tutorial for building interactive web app using websocket](https://spring.io/guides/gs/messaging-stomp-websocket/)
- [Spring tutorial for accessing data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)
- [Serialize `Instant` in epoch milliseconds](https://www.codesd.com/item/effective-way-to-have-jackson-serialize-java-8-instant-as-epoch-milliseconds.html)

__Reactor__

- [Spring Webflux and SSE](https://josdem.io/techtalk/spring/spring_boot_sse/)
- [Yong Mook Kim Spring Webflux and SSE tutorial](https://mkyong.com/spring-boot/spring-boot-webflux-server-sent-events-example/)
- [Okta tutorial on getting started with Reactive programming in Spring](https://developer.okta.com/blog/2018/09/21/reactive-programming-with-spring)
- [Stream realtime data the reactive way with Angular+Spring boot+Kafka](https://medium.com/swlh/angular-spring-boot-kafka-how-to-stream-realtime-data-the-reactive-way-510a0f1e5881)
- [Sample reactive app in Spring](https://github.com/CollaborationInEncapsulation/get-reactive-with-spring5-demo)
- [Samples from official Reactor Kafka project](https://github.com/reactor/reactor-kafka/tree/master/reactor-kafka-samples)
- [Another sample using Reactor Kafka](https://github.com/davemaier/reactivekafkaserver)
- [WebFluxTest with WebTestClient](https://howtodoinjava.com/spring-webflux/webfluxtest-with-webtestclient/)
- [Testing with reactor-test in JUnit](https://projectreactor.io/docs/core/release/reference/index.html#testing)

__KSQL__

- [KSQL workshop](https://github.com/confluentinc/demo-scene/blob/master/ksql-workshop/ksql-workshop.adoc)
- [ksqDB reference doc](https://docs.ksqldb.io/en/latest/developer-guide/ksqldb-reference/select-pull-query/)

__Front__

- [Bulma - CSS framework](https://bulma.io/)
- [Flot - JS plotting library](https://www.flotcharts.org/)

