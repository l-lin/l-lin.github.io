---
title: "Kotlin Basics: syntax"
date: 2018-01-28T17:37:03+01:00
featuredImage: ""
tags: ["kotlin", "learning"]
categories: ["post"]
toc:
  enable: true
---

Kotlin is a great language but it's more like a subset of Java.

In this article, I will deal with Kotlin basics and see what's different with Java in terms of syntax, form and types.

<!--more-->

Before jumping to the subject, let's see how Kotlin syntax differs from Java syntax.

# Packages and imports

Packages and imports are the same in Kotlin and Java. So let's skip those.

# Functions

In Java, declaring a function must follow some directives:

```text
<visibility> <static> <returnType> <functionName>(<argumentType> <argumentName>) {
    // Content of the function
}
```

Moreover, you need to create a class in order to create a function. So it's something like this:

```java
public class Foobar {
    public static void main(String[] args) {
        System.out.println("Hello world");
    }
}
```

Whereas in Kotlin, you do not need to create a class as it's not relevant to any class which is more logical.
When declaring a function, it must follow the following:

```text
fun <functionName>(<argumentName>: <argumentType>): <returnType> {
    // Content of the function
}
```

So for the same example as Java, it will be something like this in Kotlin:

```kotlin
fun main(args: Arrays<String>) {
    println("Hello world")
}
```

You might notice several aspects that differ from Java:

- Functions in Kotlin are declared using the `fun` keyword
- I did not define the return type of the function: it's implicit, meaning if not defined, then it's a `void` or `Unit` in Kotlin
- I noticed that recent languages declare the argument name first before the argument type, so it's a bit like Golang
- You do not need to call `System.out` in order to print a message, just call `print` or `println`
- There are NO `;`!!! No need to waste time looking for missing `;` !

However, it's not the only way to declare a function in Kotlin:

```kotlin
fun sum(a: Int, b: Int) = a + b
// is equivalent to
fun sum(a: Int, b: Int): Int {
    return a + b
}
```

- The return type is not defined, it's also implicit and it will automatically detect the type from the return type (ie: type inference)
- It's declared like assigning a variable, but it's used like a real function:

```kotlin
fun main(args: Array<String> {
    val result = sum(88, 12)
    println("Sum of 88 and 12 is ${result}")
}
```

# Variables

In Java, when you are declaring a variable, you MUST declare its type:

```java
String message = "Hello world!";
```

Whereas in Kotlin, the type inference is really strong:

```kotlin
// Read-only variable declaration
val message = "Hello world" // Kotlin "knows" it's a String
// Mutable variable
var a = 1
a += 2
```

{{< figure class="center" src="https://memegenerator.net/img/instances/500x/67676028/by-reading-between-the-lines-an-inference-you-will-make.jpg" alt="Type inference" >}}

# Comments

Comments are about the same in Java and Kotlin.

```kotlin
// This is an end-of-line comment

/* This is a block comment
   on multiple lines. */
```

# String interpolation

In Java, when building a String, it's a bit messy:

```java
int a = 1;
int b = 2;
int result = a + b;
String message = "Hello world, this is the result of the computation of " + a + " and " + b + " which gives " + result;
```

In kotlin, you can use the `$` along with `{` `}` to fetch its data:

```kotlin
val a = 1
val b = 2
val message = "Hello world, this is the result of the computation of $a and $b which gives ${a + b}"
```

# Classes

Declaring a class in Java is done like this:

```java
public class Foobar {
}
```

In Kotlin, it's about the same:

```kotlin
class Foobar {
}
```

However, when declaring a new instance of the class:

```java
Foobar foobar = new Foobar();
```

Whereas in Kotlin, you don't need the `new` keyword:

```kotlin
var foobar = Foobar()
```

# For loop

```java
for (int i = 0; i < 10; i++) {
    System.out.println(i);
}
for (int j = 0; j < 10; j++) {
    System.out.println(j);
}
```

```kotlin
for (i in 0..9) {
    println(i)
}
for (j in 0..9 step 2) {
    println(j)
}
```

- It's more readable in Kotlin than in Java
- We do not need to specify the `var` or `val` keywords, again, it's implicit

# Conclusion

So far, Kotlin brings a lot of "common sense":

- clever type inference
- removal of the `new` keyword
- better function declarations
- readable String templates
- readable for loops

> Good and maintainable codes are human readable codes
