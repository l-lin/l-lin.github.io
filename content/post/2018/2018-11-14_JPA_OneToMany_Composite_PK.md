---
title: "JPA @OneToMany and composite primary key"
date: 2018-11-14T16:40:06+01:00
imageUrl: "https://www.codingpedia.org/wp-content/uploads/2014/01/jpa-spring-hibernate.png"
tags: ["jpa", "java"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

To implement an parent object in one-to-many relation with a child object that has a composite primary key (i.e. multiple columns as primary key)
is not quite straightforward.

We need to use a mix of JPA annotations along with creating some embeddable classes.

<!--more-->

Suppose we have the following representation in our database:

```txt
+=======+          +=============+          +=======+
|cat    |          |cat_toy_usage|          |toy    |
|-------|1        N|-------------|N        1|-------|
|cat_id*|----------|cat_id*      |----------|toy_id*|
|name   |          |toy_id*      |          |name   |
+=======+          |usage_status |          +=======+
                   +=============+
```

We have:

- cats
- toys for cats
  - a toy can be shared between cats
- an usage status (either `USED` or `UNUSED`)

Using JPA, we will have the following:

```java
@Entity
public class Cat implements Serializable {
    @Id
    @GeneratedValue
    private Long catId;

    private String name;

    @OneToMany(mappedBy="id.cat", fetched = FechType.LAZY, cascade = CascadeType.ALL)
    private Set<CatToyUsage> toyUsages;

    // Getters + setters
}

@Entity
public class CatToyUsage implements Serializable {
    @Embeddable
    static class Pk implements Serializable {
        @ManyToOne
        @JoinColumn(name = "cat_id")
        private Cat cat;

        @Column(nullable = false, updatable = false)
        private Long toyId;

        // Getters + setters + equals + hashCode
    }

    @EmbeddedId
    private Pk id;

    @Enumerated(EnumType.STRING)
    private UsageStatus usageStatus;

    // Getters + setters
}
```

Sources:

- [Stackoverflow](https://stackoverflow.com/questions/2611619/onetomany-and-composite-primary-keys/20002180#20002180)
- [LogicBig](https://www.logicbig.com/tutorials/java-ee-tutorial/jpa/embedded-element-collection.html)
