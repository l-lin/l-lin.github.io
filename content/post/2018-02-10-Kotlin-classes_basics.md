---
title: "Kotlin Basics - Classes "
date: 2018-02-10T12:05:16+01:00
imageUrl: "https://10clouds.com/wp-content/uploads/2017/05/kotlin_spotlight@2x.png"
tags: ["kotlin", "learning"]
categories: ["thoughts"]
comment: true
toc: true
autoCollapseToc: false
contentCopyright: false
---



<!--more-->

# Methods

In Java, when you declare class methods, you need to declare them inside the class:

```java
public class Plane {
    public void fly() {
        System.out.println("I'm flying");
    }
}
```

In Kotlin, you can declare in two different ways:

```kotlin
class Plane() {
    fun fly() {
        println("I'm flying")
    }
}

// or

class Plane

fun Plane.fly() {
    println("I'm flying")
}

// or

class Plane

fun Plane.fly() = println("I'm flying")
```

It's interesting to note that other languages (like Golang) also uses the second form.

# Data classes

In Java, you will need to declare your DTO like this:

```java
public class Person {
    private String firstName;
    private String lastName;

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName() {
        this.lastName = lastName;
    }
}
```

It's really verbose, and there is lot of code lines (~19 lines).

In Kotlin, you can define the above class in one line:

```kotlin
data class Person(val firstName: String, val lastName: String)
```

# Inheritance

Using the [apache common-cli](http://commons.apache.org/proper/commons-cli/) library:

```java
public interface Cmd {
    void execute();
    Option getOption();
    boolean isEnabled(CommandLine line);
}

public abstract AbstractCmd implements Cmd {
    @Override
    public boolean isEnabled(CommandLine line) {
        Option option = getOption();
        String longOpt = option.getLongOpt();
        return line.hasOption(longOpt);
    }
}

public HelpCmd extends AbstractCmd {
    private Option option = new Option("h", "help", false, "display the help and exit");

    @Override
    public void execute() {
        System.out.println("Display help here");
    }

    @Override
    public Option getOption() {
        return option;
    }
}
```

```kotlin
interface Cmd {
    fun execute()
    fun getOption(): Option
    fun isEnabled(line: CommandLine): Boolean
}

// Keyword "implements" not needed
abstract class AbstractCmd: Cmd {
    override fun isEnabled(line: CommandLine): Boolean {
        return line.hasOption(getOption().longOpt)
    }
}

// Keyword "extends" not needed
class HelpCmd: AbstractCmd() {
	// We need to declare as "private" and override the `getOption` method otherwise we have an "accidental override" error
    private val option = Option("h", "help", false, "display the help and exit")
    override fun getOption(): Option = option

    // No need to add the character '@' and by default, the methods are public
    override fun execute() {
        println("Display help here")
    }
}
```


