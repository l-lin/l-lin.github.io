---
title: "Back to basics"
date: 2018-10-14T12:27:51+02:00
imageUrl: "https://dorothydalton.files.wordpress.com/2013/05/back-to-basics.jpg"
tags: ["java"]
categories: ["concepts"]
comment: true
toc: true
autoCollapseToc: true
contentCopyright: false
---

I learned programming concepts mostly during my school years. Unfortunately, during my professional career, when
coding, I no longer used those words and I feel like I sportsman that demonstrates what's the "way" to code
instead of explaining using common concepts to my peers.

For example, I hear myself say "This feels more right doing this way because I feel that way should bring us less
trouble in the future", even after several years of development... That's kinda sad as I'm no longer some new
guy freshly coming out of school.

The purpose of this article is to remind myself the fundamental concepts and patterns.

<!--more-->

Note: My primary language is Java, so all my examples will be in this language.

# Fundamental OOP concepts

One of the main advantage of the Object Oriented Programing is to allow us to visualize and easily conceptualize
our code by using real world objects. Moreover, OOPs makes development and maintenance easier, especially when
the code grows as the project size increases.

## Inheritance

Inheritance provides objects to acquire the behaviors and fields from another (its parent object).

We can considerate that the object `IS A` when talking about inheritance.

Example:

```java
public class Cat {
    private final String furColor;

    public Cat(String furColor) {
        this.furColor = furColor;
    }

    public void shout() {
        System.out.println("Meow");
    }

    public String getFurColor() {
        return furColor;
    }
}

// Ragdoll possesses the methods and fields from its parent class "Cat"
public class Ragdoll extends Cat {
    public Ragdoll() {
        super("Blue");
    }
}

public class Sandbox {
    public static void main(String[] args) {
        Cat cat = new Ragdoll();
        System.out.println(cat.shout());
        System.out.println("The fur color of the cat is: " + cat.getFurColor());
    }
}
```

:warning: Multiple inheritances is dangerous if not implemented carefully, as it can lead to the diamond issue:

```txt
   A
  / \
 B   C
  \ /
   D
```

`B` and `C` inherit `A`. `D` inherit both `B` and `C`.

Thus, if there is a method that `A` that `B` and `C` have overridden and `D` have not, then we have an ambiguity
on which method `D` will use: `B`'s or `C`'s?

## Polymorphism

Polymorphism is the ability for an object to have multiple forms.

Example:

```java
public interface Animal {
    void shout();
}

public class Dog implements Animal {
    @Override
    public void shout() {
        System.out.println("Woof");
    }
}

public class Cat implements Animal {
    @Override
    public void shout() {
        System.out.println("Meow");
    }
}
```

## Abstraction

Abstraction is the process of hiding the internal details and only showing the behaviors. It is mainly aimed to specify what an object can do and let you focus on what the object does instead of how it does it.

```java
public abstract class Shape {
    abstract void draw();
}

public class Square extends Shape {
    @Override
    public void draw() {
        System.out.println("Drawing a square");
    }
}

public class Circle extends Shape {
    @Override
    public void draw() {
        System.out.println("Drawing a circle");
    }
}

public class Sandbox {
    public static void main(String[] args) {
        Shape shape = new Circle();
        s.draw();
    }
}
```

## Encapsulation

Encapsulation is the way of binding data and code into a single unit. Hence, the attributes of the class
are hidden from other classes and can only be accessed through the methods provided by the class.

The methods are often the getters and setters of the class.

Example:

```java
public class Cat {
    private String name;
    private String furColor;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFurColor() {
        return furColor;
    }

    public void setFurColor(String furColor) {
        this.furColor = furColor;
    }
}
```

### Advantages of using encapsulation

The encapsulation mechanism prevents the code and the data to be randomly accessed by external codes.

- Encapsulated code is more flexible to changes, thus easier to maintain
- Encapsulation can make classes to be read-only
- The encapsulated class has total control over its fields
- Encapsulation hides the implementation of the details of the object

### Encapsulation vs Abstraction

Abstraction is more about "WHAT" the class can do, whereas encapsulation is more about "HOW" to achieve the
functionality.

# Associations in OOP

One object may use the methods provided by another object. This relationship between those two objects can
be defined as "Association".

We can considerate that the object `HAS A` when talking about Association.

Association relationship can be defined by two types: Aggregation and Composition.

## Aggregation

In Aggregation, each object have their own life cycle, meaning when the life of the child object is not dependent
of the parent object.

Example:

```java
public class Table {
    private final String color;

    public Table(String color) {
        this.color = color;
    }
    
    public String getColor() {
        return color;
    }

    @Override
    public String toString() {
        return "Table with color " + color;
    }
}

public class Room {
    private Table table;

    public Room(Table table) {
        this.table = table;
    }

    public Table getTable() {
        return table;
    }
}

public class Sandbox {
    public static void main(String[] args) {
        Table table = new Table("black");
        describeRoom(table);
        // Here "room" no longer exists, but "table" still exists
        System.out.println(table);
    }

    private static void describeRoom(Table table) {
        Room room = new Room(table);
        System.out.println(room.getTable());
    }
}
```

## Composition

Composition is about the same as Aggregation, except that the relationship of the two objects is
intrinsically linked to the parent object, i.e. the child cannot exist without its parent.

Example:

```java
public class Identity {
    private final String firstName;
    private final String lastName;

    public Identity(String firstName, String lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }
}

public class Person {
    // The "final" keyword will make sure the "leg" property is initialized
    private final Identity identity;

    public Person(String firstName, String lastName) {
        // When "person" is destroyed, so is its property "identity"
        identity = new Identity(firstName, lastName);
    }

    public Identity getIdentity() {
        return identity;
    }
}

public class Sandbox {
    public static void main(String[] args) {
        Person person = new Person("Louis", "Lin");
        Identity identity = person.getIdentity();
        System.out.println("My name is " + identity.getFullName());
    }
}
```

### Composition over inheritance

Composition offers higher flexibility then inheritance. It is better and easier to conceptualize what an object
can do (`HAS A`) than extend what it is (`IS A`).

Moreover, it is easier to change/add the behavior on one class than on all implementations that inherit the interface.

```java
public abstract class Person {
    abstract String getRole();
}

public class Developer extends Person {
    public String getRole() {
        return "developer";
    }
}

public class Manager extends Person {
    public String getRole() {
        return "manager";
    }
}
```

In this example, if we add a new method on the `Person` class, we will have to change all its implementations, i.e.
`Developer` and `Manager`.

Using composition:

```java
public class Role {
    private final String name;

    public Role(String name) {
        this.name = name;
    }
}

public class Developer {
    private final Role role = new Role("developer");
}

public class Manager() {
    private final Role role = new Role("manager");
}
```

If we want to add new methods on `Role`, we don't have to change the classes that have a relationship with `Role`,
thus only changing one class. In other words, inheritance brings tight coupling between the sub class and its
super class: any change on the super class will force the sub class to change.

Another negative points on inheritance are:

- implementation inherited from super class cannot be changed at runtime
- subclass details are exposed to super class, which means it breaks the encapsulation rule
  - in composition, the objects will never reach each other's protected data and will be forced to respect each other's interface

However, that does not mean we must never use inheritance. It also has its uses, like for example, if we want
to re-use methods on each implementation.

## Dependency

Dependency is also a form of "Association", albeit weaker than "Aggregation" and "Composition".

We talk about dependency when changing one object may affect another.

Example:

```java
public class Cat {
    private String status = "bored";

    public void play() {
        System.out.println("The cat is playing");
        status = "happy";
    }
}

public class CatCoffee {
    private List<Cat> cats;

    public CatCoffee(List<Cat> cats) {
        this.cats = cats;
    }

    public void play() {
        cats.forEach(cat -> cat.play);
    }
}
```
