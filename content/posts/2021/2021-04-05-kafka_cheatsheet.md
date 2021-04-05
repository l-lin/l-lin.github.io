---
title: "Kafka cheatsheet"
date: 2021-04-05T09:35:31+02:00
featuredImage: "https://24b4dt1v60e526bo2p349l4c-wpengine.netdna-ssl.com/wp-content/uploads/2018/08/apache_kafka-card-tm.png"
tags: []
categories: ["post"]
toc:
  enable: true
---



<!--more-->

## Concepts

Kafka is a distributed, replicated commit log:

- __Distributed__: Kafka is deployed as a cluster of nodes, for both fault tolerance and scale
- __Replicated__: messages are usually replicated across multiple nodes
- __Commit Log__: messages are stored in partitioned, append only logs which are called Topics

Kafka components:

- A Kafka cluster stores categories called __Topics__
- A cluster consist of one or more servers called __Brokers__
- Each Topic maintains a __partitioned__ log
- A Topic may have __many__ partitions which all act as the unit of parallelism
- __Replicas__ is the list of Brokers that replicate the log for this partition

### Producers and consumers

__Producers__ are client applications that publish events to Kafka.

__Consumers__ are those that subscribe to these events.

In Kafka, producers and consumers are fully decoupled and agnostic of each other, which is a key
design element to achieve the high scalability (producers never need to wait for consumers).

### Topics

Events are organized and durably stored in __Topics__.

__Topics__ are split into multiple __Partitions__. In a cluster, there a is only one leader
partition, the rest are replicas.

```
+---------+   +---------+
| Topic A |   | Topic B |
|         |   |         |
|+-------+|   |+-------+|
||Part 0 ||   ||Part 0 ||
|+-------+|   |+-------+|
|         |   |         |
|+-------+|   |+-------+|
||Part 1 ||   ||Part 1 ||
|+-------+|   |+-------+|
|         |   |         |
|+-------+|   +---------+
||Part 2 ||
|+-------+|
|         |
+---------+
```

Each partition is a separate data structure which guarantee message ordering, i.e. message ordering
is only guarantee within a single partition.

The producer just appends the message at the end of the partition.

Consumers can consume from the same partition but they can read from different offsets.

```
 +--------+    writes
 |producer|-----------+
 +--------+           |
       partition 1    v
       +-+-+-+-+-+-+-+-+
       | | | | | | | | |
       +-+-+-+-+-+-+-+-+
          ^     ^
          |     |          +----------+
          |     +----------|consumer 1|
          |        reads   +----------+
          |           +----------+
          +-----------|consumer 2|
            reads     +----------+
```

### Consumer groups

__Consumer groups__ may contains multiple consumers where each one in the group will process a
subset of all the messages in the topic.

1 producer, 3 partitions and 1 consumer group with 3 consumers:

```
            +--------+
            |producer|
            +--------+
                |
          +-----+-----+
          |     |     |
          v     v     v
        +----------------+
        |+--+  +--+  +--+|
Topic A ||P0|  |P1|  |P2||
        |+--+  +--+  +--+|
        +----------------+
          |     |     |
          v     v     v
        +----------------+
        |+--+  +--+  +--+|
        ||C0|  |C1|  |C2||
        |+--+  +--+  +--+|
        +----------------+
          consumer group
```

1 producer, 5 partitions and 1 consumer group with 3 consumers:

```
                        +--------+
                        |producer|
                        +--------+
                            |
            +-------+-------+-------+-------+
            |       |       |       |       |
            v       v       v       v       v
        +--------------------------------------+
        |+----+  +----+  +----+  +----+  +----+|
Topic A || P0 |  | P1 |  | P2 |  | P3 |  | P4 ||
        |+----+  +----+  +----+  +----+  +----+|
        +--------------------------------------+
           |       |       |       |       |
           +---+---+       |       +---+---+
               |           |           |
               v           v           v
            +------------------------------+
            | +--+        +--+        +--+ |
            | |C0|        |C1|        |C2| |
            | +--+        +--+        +--+ |
            +------------------------------+
                     consumer group
```

One idle consumer:

```
                +--------+
                |producer|
                +--------+
                    |
            +-------+-------+
            |       |       |
            v       v       v
        +----------------------+
        |+----+  +----+  +----+|
Topic A || P0 |  | P1 |  | P2 ||
        |+----+  +----+  +----+|
        +----------------------+
           |       |       |
           v       v       v
         +---------------------------+
         |+--+    +--+    +--+   +--+|
         ||C0|    |C1|    |C2|   |C3||
         |+--+    +--+    +--+   +--+|
         +---------------------------+
                consumer group
```

### Rebalancing / Repartition

Rebalancing is automatically triggered after:

- a consumer joins a consumer group
- a consumer leaves a consumer group
- new partitions are added

Rebalancing will cause a short period of extra latency while consumers stop reading batches of
messages and get assigned to different partitions.

:warning: Upon rebalancing, any memory data will be useless unless the consumer get assigned back to
the same partition. Therefore consumers needs to implement a re-partitioning logic to either
maintain the data state by persisting externally or to remove it from its memory.

Consumer can implement the interface `org.apache.kafka.clients.consumer.ConsumerRebalanceListener`,
which is a listener that will be called when a rebalancing occurs.

### Partition assignment strategies

Kafka clients provides 3 build-in strategies: __RangeAssignor, RoundRobinAssignor and StickyAssignor__.

#### RangeAssignor

RangeAssignor is the default strategy.

> Strategy useful to join records from two topics which have the same number of partitions and the
> same key-partitioning logic.

```
        Topic A       Topic B
     +-----------+ +-----------+
     |  P0   P1  | |  P0   P1  |
     | +--+ +--+ | | +--+ +--+ |
     | |  | |  | | | |  | |  | |
     | |  | |  | | | |  | |  | |
     | +--+ +--+ | | +--+ +--+ |
     +-----------+ +-----------+
        |     |       |    |
        +++-----------+    |
         ||   |+-----------+
         ||   ||
         vv   vv
      +----------------+
      | +--+ +--+ +--+ |
      | |C1| |C2| |C3| |
      | +--+ +--+ +--+ |
      +----------------+
        consumer group

```

Assignments:

- `C1 = {A0, B0}`
- `C2 = {A1, B1}`
- `C3 = {}`

#### RoundRobinAssignor

> Maximize the number of consumers used but does not attempt to reduce partition movements the
> number of consumers changes.

```
        Topic A       Topic B
     +-----------+ +-----------+
     |  P0   P1  | |  P0   P1  |
     | +--+ +--+ | | +--+ +--+ |
     | |  | |  | | | |  | |  | |
     | |  | |  | | | |  | |  | |
     | +--+ +--+ | | +--+ +--+ |
     +-----------+ +-----------+
        |     |       |    |
        +-+----------------+
          |   |       |
          |   |       |
          |   |    +--+
          |   |    |
          v   v    v
      +----------------+
      | +--+ +--+ +--+ |
      | |C1| |C2| |C3| |
      | +--+ +--+ +--+ |
      +----------------+
        consumer group

```

Assignments:

- `C1 = {A0, B1}`
- `C2 = {A1}`
- `C3 = {B0}`

```
        Topic A       Topic B
     +-----------+ +-----------+
     |  P0   P1  | |  P0   P1  |
     | +--+ +--+ | | +--+ +--+ |
     | |  | |  | | | |  | |  | |
     | |  | |  | | | |  | |  | |
     | +--+ +--+ | | +--+ +--+ |
     +-----------+ +-----------+
        |     |       |    |
        +-+-----------+    |
          |   |            |
          |   |            |
          |   +----+-------+
          |        |
          v        v
      +----------------+
      | +--+ +--+ +--+ |
      | |C1| |XX| |C3| |
      | +--+ +--+ +--+ |
      +----------------+
        consumer group

```

The C2 dies, new assignments:

- `C1 = {A0, B0}`
- `C2 = {}`
- `C3 = {A1, B1}`

=> unnecessary partition movement may have an impact on consumer performance.

#### StickyAssignor

> Same as RoundRobinAssignor, but tries to minimize partition movements between two assignments.

Same scenario as RoundRobinAssignor, and if C2 dies / leaves:

```
        Topic A       Topic B
     +-----------+ +-----------+
     |  P0   P1  | |  P0   P1  |
     | +--+ +--+ | | +--+ +--+ |
     | |  | |  | | | |  | |  | |
     | |  | |  | | | |  | |  | |
     | +--+ +--+ | | +--+ +--+ |
     +-----------+ +-----------+
        |     |       |    |
        +-+----------------+
          |   |       |
          |   |       |
          |   +----+--+
          |        |
          v        v
      +----------------+
      | +--+ +--+ +--+ |
      | |C1| |XX| |C3| |
      | +--+ +--+ +--+ |
      +----------------+
        consumer group

```

The C2 dies, new assignments:

- `C1 = {A0, B1}`
- `C2 = {}`
- `C3 = {A1, B0}`

C1 keeps assigned to the same partitions.

#### Resources

- https://medium.com/streamthoughts/understanding-kafka-partition-assignment-strategies-and-how-to-write-your-own-custom-assignor-ebeda1fc06f3

## Useful commands
### Using Kafka client scripts

```bash
# create topic
bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --partitions 1 --replication-factor 1 --topic my-topic
docker run -it --rm --network host 
# list topics
bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
# modifying topics
bin/kafka-topics.sh --bootstrap-server localhost:9092 --alter --topic my-topic --partitions 40

# producers
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic my-topic

# consumers
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic my-topic
```

### Using Docker

Same as using Kafka client scripts, but using the docker image:

```bash
# e.g. list topics
docker run -it --rm --network host confluentinc/cp-kafka:5.4.1 \
  /usr/bin/kafka-topics --bootstrap-server localhost:9092 -list
```

### Using [kafkactl](https://github.com/deviceinsight/kafkactl)

```bash
# topics
kafkactl get topics
kafkactl create topic my-topic --partitions=2
kafkactl alter topic my-topic -c retention.ms=99999
kafkactl describe topic my-topic
kafkactl delete topic my-topic

# produce
echo "key##value" | kafkactl produce my-topic --separator=##
# consume starting from the oldest offset
kafkactl consume my-topic --from-beginning
# print message key and timestamp as well as partition and offset in yaml format
kafkactl consume my-topic --print-keys --print-timestamp -o yaml
# print headers
kafkactl consume my-topic --print-headers -o yaml

# reset offset to my-group consumer group to oldest
kafkactl reset consumer-group-offset my-group --topic my-topic --oldest --execute
# show info on my-group consumer group, only on topics with lags
kafkactl describe consumer-group my-group --only-with-lag
```

### In Java

Add kafka-clients dependency:

```xml
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-clients</artifactId>
</dependency>
```

Producer:

```java
package lin.louis.demo;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.serialization.StringSerializer;

import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

public class DemoKafkaProducer {

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ProducerConfig.CLIENT_ID_CONFIG, UUID.randomUUID().toString());
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.ACKS_CONFIG, "all");
        try (KafkaProducer<String, String> kafkaProducer = new KafkaProducer<>(props)) {
            ProducerRecord<String, String> producerRecord =
                    new ProducerRecord<>("my-topic", "key", "value");
            RecordMetadata recordMetadata = kafkaProducer.send(producerRecord).get();
            System.out.println("offset:" + recordMetadata.offset());
        }
    }
}
```

Consumer:

```java
package lin.louis.demo;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.consumer.StickyAssignor;
import org.apache.kafka.common.serialization.StringDeserializer;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.List;
import java.util.Properties;

public class DemoKafkaConsumer {

    private static final Duration TIMEOUT = Duration.ofSeconds(1);

    public static void main(String[] args) throws UnknownHostException {
        Properties props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "message-consumer");
        props.put(ConsumerConfig.CLIENT_ID_CONFIG, InetAddress.getLocalHost().getHostName());
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG, StickyAssignor.class.getName());
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 1);
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        try (KafkaConsumer<Object, Object> kafkaConsumer = new KafkaConsumer<>(props)) {
            kafkaConsumer.subscribe(List.of("my-topic"));
            while (!Thread.currentThread().isInterrupted()) {
                kafkaConsumer.poll(TIMEOUT)
                        .forEach(consumerRecord -> System.out.println(
                                "key: " + consumerRecord.key() + " - value: " + consumerRecord.value()));
            }
        }
    }
}

```

## docker-compose
### Single node

```yaml
version: '3'
services:
  # ZOOKEEPER ------------------------------------------------------------------------------------
  zk:
    image: confluentinc/cp-zookeeper:5.4.1
    container_name: zk
    ports:
      - 2181:2181
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
  # KAFKA ----------------------------------------------------------------------------------------
  kafka:
    image: confluentinc/cp-kafka:5.4.1
    container_name: kafka
    depends_on:
      - zk
    ports:
      - 9092:9092
      - 29092:29092
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zk:2181
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
```

### Cluster of 3 nodes

```yaml
version: '3'
services:
  # ZOOKEEPERS ------------------------------------------------------------------------------------
  zk1:
    image: confluentinc/cp-zookeeper:5.4.1
    environment:
      ZOOKEEPER_SERVER_ID: 1
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
      ZOOKEEPER_INIT_LIMIT: 5
      ZOOKEEPER_SYNC_LIMIT: 2
      ZOOKEEPER_SERVERS: zk1:2888:3888;zk2:2888:3888;zk3:2888:3888
  zk2:
    image: confluentinc/cp-zookeeper:5.4.1
    environment:
      ZOOKEEPER_SERVER_ID: 2
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
      ZOOKEEPER_INIT_LIMIT: 5
      ZOOKEEPER_SYNC_LIMIT: 2
      ZOOKEEPER_SERVERS: zk1:2888:3888;zk2:2888:3888;zk3:2888:3888
  zk3:
    image: confluentinc/cp-zookeeper:5.4.1
    environment:
      ZOOKEEPER_SERVER_ID: 3
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
      ZOOKEEPER_INIT_LIMIT: 5
      ZOOKEEPER_SYNC_LIMIT: 2
      ZOOKEEPER_SERVERS: zk1:2888:3888;zk2:2888:3888;zk3:2888:3888
  # KAFKAS ----------------------------------------------------------------------------------------
  kafka1:
    image: confluentinc/cp-kafka:5.4.1
    depends_on:
      - zk1
      - zk2
      - zk3
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zk1:2181,zk2:2181,zk3:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka1:9092
  kafka2:
    image: confluentinc/cp-kafka:5.4.1
    depends_on:
      - zk1
      - zk2
      - zk3
    environment:
      KAFKA_BROKER_ID: 2
      KAFKA_ZOOKEEPER_CONNECT: zk1:2181,zk2:2181,zk3:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka2:9092
  kafka3:
    image: confluentinc/cp-kafka:5.4.1
    depends_on:
      - zk1
      - zk2
      - zk3
    environment:
      KAFKA_BROKER_ID: 3
      KAFKA_ZOOKEEPER_CONNECT: zk1:2181,zk2:2181,zk3:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka3:9092
```

Note: we cannot exploit the docker-compose `--scale` feature as we need to configure the Kafka
advertised listeners and Kafka Zookeeper connects.

### Web UI

Using [Kowl](https://github.com/cloudhut/kowl) as a web UI for exploring messages, consumers,
configurations:

Create a `config.yml` with the following content:

```yaml
# See: https://github.com/cloudhut/kowl/tree/master/docs/config for reference config files.
kafka:
  brokers:
    - kafka:29092
```

Add the service in the docker-compose.yml:

```yaml
version: '3'
services:
  kowl:
    image: quay.io/cloudhut/kowl:v1.2.1
    restart: on-failure
    volumes:
      - config.yml:/etc/kowl/config.yml
    ports:
      - 9080:8080
    entrypoint: ./kowl --config.filepath=/etc/kowl/config.yml
    depends_on:
      - kafka
```

## Partitions
### How to choose the number of partitions for a topic

__Simple formula__

```
#Partitions = max(Np, Nc)
```

- `Np` is the number of required producers determined by calculating `Tt/Tp`
- `Nc` is the number of required consumers determined by calculating `Tt/Tc`
- `Tt` is the total expected throughput for the system
- `Tp` is the max throughput of a single producer to a single partition
- `Tc` is the max throughput of a single consumer from a single partition

__Considerations__

- more partitions lead to higher throughput
- more partitions requires more open file handles
- more partitions may increase unavailability
- more partitions may increase end-to-end latency
- more partitions may require more memory in the client

__Sources__

- https://docs.cloudera.com/runtime/7.2.0/kafka-performance-tuning/topics/kafka-tune-sizing-partition-number.html
- https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/
- https://engineering.linkedin.com/kafka/benchmarking-apache-kafka-2-million-writes-second-three-cheap-machines

### Add partitions to an existing topic

```bash
# kafka client script
bin/kafka-topics.sh --bootstrap-server localhost:9092 --alter --topic my-topic --partitions 40
# with docker
docker run -it --rm --network host confluentinc/cp-kafka:5.4.1 \
  /usr/bin/kafka-topics --bootstrap-server localhost:9092 -alter --topic my-topic --partitions 40
# with kafkactl
kafkactl alter topic my-topic --partitions 40
```

However, be aware of re-partitioning when using key:

> Be aware that one use case for partitions is to semantically partition data, and adding partitions doesn't change the partitioning of existing data so this may disturb consumers if they rely on that partition. That is if data is partitioned by hash(key) % number_of_partitions then this partitioning will potentially be shuffled by adding partitions but Kafka will not attempt to automatically redistribute data in any way.

## Checking consumer lags

```bash
# kafka client script
bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group my-group --new-consumer
# with docker
docker run -it --rm --network host confluentinc/cp-kafka:5.4.1 \
  /usr/bin/kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group my-group --new-consumer
# with kafkactl
kafkactl describe consumer-group my-group --only-with-lag
```

