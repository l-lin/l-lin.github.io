---
title: "(Rock) SOLID"
date: 2018-10-21T14:08:39+02:00
featuredImage: "https://images.unsplash.com/photo-1532502413135-cea634d4b044?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=17af51dc9352b24342aeaf1995008570&auto=format&fit=crop&w=500&q=60"
tags: ["java", "concept"]
categories: ["post"]
toc:
  enable: true
---

This article is the follow-up of the previous article on the basics of software development, to remind myself of what I learned in the beginning of my software developer career.

This one will deal with the famous **SOLID** design principles:

- **S**ingle responsibility principle
- **O**pen/closed principle
- **L**iskov substitution principle
- **I**nterface segregation principle
- **D**ependecy inversion principle

<!--more-->

## Single responsibility principle

> One class should have one and one responsibility.

One of the few principles that is easy to understand but not simple to explain why it's important to respect this principle.
We are often told to only have one responsibility for each class, or at a medium level, each component must do their part, or at a global level, each micro-service must perform one task in mind.

Why is it so important? Why can't we have something that performs everything?

A real life example: in a start-up, the CEO must perform multiple roles: the CEO, the accounting, the marketing, HR, ...
And it works... until the company reaches a certain scale when the CEO cannot perform every roles, otherwise, the CEO will be overwhelmed by the amount of work the CEO has to do.
By delegating the roles to other people, the CEO can focus on what the CEO must do: giving the direction/vision of the company to its crew (IMHO).

### Bad example

In this example, we have a cat that can save itself.

```java
public class Cat {
    private final CatDAO dao;
    private final String name;

    public Cat(String name, CatDAO dao) {
        this.name = name;
        this.repo = repo;
    }

    public String getName() {
        return name;
    }

    public void save() {
        dao.save(this);
    }
}
```

Sure it works, but whenever we want to change the persistence, we will need to change this class.
In small classes, there is no real impact, but when your class is starting to look like a [Blob](https://sourcemaking.com/antipatterns/the-blob) or a God class that does everything, the cost to change its behavior will be huge, enough to make you throw up and have a hangover for years.

### One solution

One solution is to create another class `CatRepository` that deals with the persistence.

```java
public class Cat {
    private final String name;

    public Cat(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}

public class CatRepository {
    private final CatDAO dao;

    public CatRepository(CatDAO dao) {
        this.dao = dao;
    }

    public void save(Cat cat) {
        dao.save(cat);
    }
}
```

Thus, moving the persistence to another class will clearly separate the responsibility and we are free to update the persistent methods without touching the `Cat` class.
Hence, we will only touch the persistence functionalities without modifying the business logic.

## Open/Closed principle

> Software components should be open for extension, but closed for modification.

It means to have a class that can be extensible in its functionalities, but prevent the users to change its core logic.

### Bad example

In this example, we have a `Cat` class that has a `meow` method that is different from each cat types.

```java
public class Meower {
    private final String catType;

    public Meower(String catType) {
        this.catType = catType;
    }

    public String getCatType() {
        return catType;
    }

    public final String meow() {
        if ("Ragdoll".equals(catType)) {
            return "Miaou";
        } else if ("Tadar sauce".equals(catType)) {
            return "Grumph"
        } else if ("Nyan cat".equals(catType)) {
            return "Nyan nyan";
        }
        return "Meow";
    }
}

public class Sandbox {
    public static void main(String[] args) {
        System.out.println(new Meower("Ragdoll").meow());
        System.out.println(new Meower("Tadar sauce").meow());
        System.out.println(new Meower("Nyan cat").meow());
        System.out.println(new Meower("Dragon Li").meow());
    }
}
```

If we want to add a new type of cat, we will have to change the `Meower` class.

One concrete example is that the `Meower` class is in a library you are using in your project.
So, if you want to add a new type of cat, you will either have to copy/paste the `meow` method, or override it.

```java
public class CustomMeower extends Meower {
    public CustomMeower(String catType) {
        super(catType);
    }

    @Override
    public String meow() {
        // We are overriding the default behavior. If Cat change its method by adding some logic,
        // we won't be able to benefit the new changes.
        if ("Dragon Li".equals(getCatType())) {
            return "Rawr";
        }
        return super.meow();
    }
}

public class Sandbox {
    public static void main(String[] args) {
        System.out.println(new Meower("Ragdoll").meow());
        System.out.println(new Meower("Tadar sauce").meow());
        System.out.println(new Meower("Nyan cat").meow());
        System.out.println(new Meower("Dragon Li").meow()); // Will print "Meow"
        System.out.println(new CustomMeower("Nyan cat").meow()); // Will print "Rawr"
    }
}
```

### One solution

One solution is to simply use polymorphism and composition (or strategy design pattern) that helps the developer to extends the class without modifying the core logic.

```java
public interface Cat {
    String meow();
}

public class Ragdoll implements Cat {
    @Override
    public String meow() {
        return "Miaou";
    }
}

public class TadarSauce implements Cat {
    @Override
    public String meow() {
        return "Grumph";
    }
}

public class NyanCat implements Cat {
    @Override
    public String meow() {
        return "Nyan nyan";
    }
}

// We can add without modifying the other forms of cat
public class DragonLi implements Cat {
    @Override
    public String meow() {
        return "Rawr";
    }
}

public class Meower {
    private final Cat cat;

    public class Meower(Cat cat) {
        this.cat = cat;
    }

    // We don't have to change the method, only the way of instanciating the Meower class 
    // can we define what cat is meowing
    public String meow() {
        return cat.meow();
    }
}

public class Sandbox {
    public static void main(String[] args) {
        System.out.println(new Meower(new Ragdoll()).meow());
        System.out.println(new Meower(new TadarSauce()).meow());
        System.out.println(new Meower(new NyanCat()).meow());
        System.out.println(new Meower(new DragonLi()).meow());
    }
}
```

As we can see, if we want to add a new type of cat, we only have to create a new class that implements the `Cat` interface. We don't have to change the content of the class `Meower`.

## Liskov substitution principle

> Derived types must be completely substitutable for their base types.

One of the principles that is really easy to forget, because, first of all, the name itself is not really helpful, but more importantly, it's quite "hard" (again, IMHO) to picture what the principle is all about.

This principle is about extended classes that fit in the application without failure, i.e. you should design your classes so that client dependencies can be substituted with subclasses without the client knowing about the change.

Often, if we have a class type detection/condition to perform some logic, we have a code smell that violates this principle.

Violations of the LSP cause undefined behaviors, which is difficult to find during development (the project compiles and the application runs like intended) but will fail on production (unexpected behaviors).

### Bad example

```java
public abstract class Cat {
    private final String name;

    public Cat(String name) {
        this.name = name;
    }
}

public Ragdoll extends Cat {
    public Ragdoll(String name) {
        super(name);
    }
}

public NyanCat extends Cat {
    public NyanCat(String name) {
        super(name);
    }
}

public class PetStore {
    public void sell(Cat cat) {
        if (NyanCat.class.equals(cat.getClass())) {
            throw new UnsellableCatException("This cat is too rare, I can't sell it to you!");
        }
        System.out.println("I'm selling " + cat.getName() + " to you");
    }
}

public class Sandbox {
    public static void main(String[] args) {
        PetStore petStore = new PetStore();
        // Printing: "I'm selling Mimi to you
        petStore.sell(new Ragdoll("Mimi"));
        // This will throw the UnsellableCatException and the program will fails if we are not careful
        petStore.sell(new NyanCat("nyan"));
    }
}
```

The `PetStore` is tightly coupled to `NyanCat` class. In this example, we can easily see the code smell and we will get the exception during run time, which will be easy to debug.

However, if we have another examples, where the behavior is more complex (e.g. in accounting), debugging/fixing will be more difficult.

### One solution

In the example above, we can add an attribute `isSellable`:

```java
public abstract class Cat {
    private final String name;
    private final boolean isSellable;

    public Cat(String name, boolean isSellable) {
        this.name = name;
        this.isSellable = isSellable;
    }

    public boolean isSellable() {
        return isSellable;
    }
}

public Ragdoll extends Cat {
    public Ragdoll(String name) {
        super(name, true);
    }
}

public NyanCat extends Cat {
    public NyanCat(String name) {
        super(name, false);
    }
}

public class PetStore {
    public void sell(Cat cat) {
        if (!cat.isSellable()) {
            System.out.println("This cat is too rare, I can't sell it to you!");
        }
        System.out.println("I'm selling " + cat.getName() + " to you");
    }
}

public class Sandbox {
    public static void main(String[] args) {
        PetStore petStore = new PetStore();
        // Printing: "I'm selling Mimi to you
        petStore.sell(new Ragdoll("Mimi"));
        // Printing: "This cat is too rare, I can't sell it to you!"
        petStore.sell(new NyanCat("nyan"));
    }
}
```

## Interface segregation principle

> Clients should not be forced to implement unnecessary methods which they will not use.

This principle favors multiple, smaller, cohesive interfaces overs larger, monolithic interfaces.

By reducing classes dependencies, unused members, we reduce coupling accordingly.
Moreover, smaller interfaces are easier to implement, improve flexibility and reuse.

### Bad example

```java
public interface Animal {
    void fly();
    void walk();
}

public class Cat implements Animal {
    @Override
    public void fly() {
        throw new UnsupportedOperationException("Cats can't fly");
    }

    @Override
    public void walk() {
        System.out.println("The cat is walking");
    }
}

public class Eagle implements Animal {
    @Override
    public void fly() {
        System.out.println("The eagle is flying");
    }

    @Override
    public void walk() {
        System.out.println("The eagle is walking");
    }
}

public class Sandbox {
    public static void main(String[] args) {
        Animal eagle = new Eagle();
        eagle.walk();
        eagle.fly();

        Animal cat = new Cat();
        cat.walk();
        cat.fly(); // throws UnsupportedOperationException
    }
}
```

In this example, `Cat` implements the interface `Animal`, thus it must implements every methods of `Animal`, even the `fly` method which is not logical.

### One solution

Make interfaces more abstract so that the classes only implement the functionalities they need.

```java
public interface Animal {
    void walk();
}

public interface Bird {
    void fly();
}

public class Cat implements Animal {
    @Override
    public void walk() {
        System.out.println("The cat is walking");
    }
}

public class Eagle implements Animal, Bird {
    @Override
    public void fly() {
        System.out.println("The eagle is flying");
    }

    @Override
    public void walk() {
        System.out.println("The eagle is walking");
    }
}

public class Sandbox {
    public static void main(String[] args) {
        Animal eagle = new Eagle();
        eagle.walk();
        eagle.fly();

        Animal cat = new Cat();
        cat.walk();
    }
}
```

## Dependency inversion principle

> Depend on abstractions, not on concretions.

This principles encourages to write code that depends on abstractions rather than concrete details.
Its concern is mainly re-usability. The idea is that we isolate our class behind a boundary formed by the abstractions it depends on. 
If all the details behind those abstractions change, then our class is still safe. This helps keep coupling low and makes our design easier to change.

Moreover, this principle can help test easily in isolation, for example, the database is a concrete detail in our application (we can use to store our data in a file system, or a database, or something else).

### Bad example

```java
public class DragonLi {
    public String meow() {
        return "Rawr";
    }
}

public class NyanCat {
    public String meow() {
        return "Nyan nyan";
    }
}

public class Meower {
    private DragonLi dragonLi = new DragonLi();
    private NyanCat nyanCat = new NyanCat();

    public void meow(String type) {
        if ("Dragon Li".equals(type)) {
            System.out.println(dragonLi.meow());
        } else if ("Nyan cat".equals(type)) {
            System.out.println(nyanCat.meow());
        }
    }
}

public class Sandbox {
    public static void main(String[] args) {
        Meower meower = new Meower();
        meower.meow("Dragon Li"); // Prints "Rawr"
        meower.meow("Nyan cat"); // Prints "Nyan nyan"
        meower.meow("Ragdoll"); // Prints nothing
    }
}
```

If we want to add the ragdoll cat, we will have to create a `Ragdoll` and add to `Meower` attributes.

### One solution

```java
public interface Cat {
    String meow();
}

public class DragonLi implements Cat {
    @Override
    public String meow() {
        return "Rawr";
    }
}

public class NyanCat implements Cat {
    @Override
    public String meow() {
        return "Nyan nyan";
    }
}

public class Ragdoll implements Cat {
    @Override
    public String meow() {
        return "Miaou";
    }
}

public class Meower {
    private final Cat cat;

    public Meower(Cat cat) {
        this.cat = cat;
    }

    public void meow() {
        System.out.println(cat.meow());
    }
}

public class Sandbox {
    public static void main(String[] args) {
        Meower meower = new Meower(new DragonLi());
        meower.meow(); // Prints "Rawr"
        meower = new Meower(new NyanCat());
        meower.meow(); // Prints "Nyan nyan"
        meower = new Meower(new Ragdoll());
        meower.meow(); // Prints "Miaou"
    }
}
```

If we want to add a new type of cats (e.g. tadar sauce), we just have to add a new class that implements the `Cat` interface. Thus, we don't have to change the `Meower` class as it uses the abstract `Cat` and not the concrete details, i.e. `DragonLi`, `NyanCat` and `Ragdoll`.
