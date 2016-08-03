---
layout: post
title:  "Avoiding Null Pointers"
date:   2014-02-27
tags: [Java]
images: [java.png]
---

```
Exception in thread "main" java.lang.NullPointerException
	at ...
	at ...
	at ...
```

The most common exception that pulls you hair a thousands of times. 
I don't know how many time I see this exception every day. The worst of it is when it happens in production. 
There are no real cure for this curse. Every application cannot escape this issue.

However, there are many ways to avoid and reduce such `NullPointerException`.

Let's say the following piece of code throws the exception:

```java
Foo foo = fooFactory.getFoo(fooId);
foo.getName(); // => Throws NPE
```

The fix could be the following:

```java
Foo foo = fooFactory.getFoo(fooId);
if (foo != null) {
	foo.getName();
}
```

This patch, although correct, is not the best fix.
Indeed, correcting every `NullPointerException` with such fix will degrade your code, losing readibilty and such.

Using the JSR305/JSR308
=======================

Tools like [Findbugs](http://findbugs.sourceforge.net/) are able to detect potential `NullPointerException`.
It works well using annotation like `@NotNull` or `@Nullable`.
Indeed, thanks to those latters, the compilator will give you a warning that a potential `NullPointerException` might occur. 
So the error is caught upstream. The client does not see the bugs, all is well.

Installation
------------

Using Maven, you can add the dependecy:

```xml
<dependency>
	<groupId>com.google.code.findbugs</groupId>
    <artifactId>jsr305</artifactId>
    <version>1.3.9</version>
</dependency>
```

Usage
-----

You can use those annotations in method parameters:

```java
private void foo(@NotNull String param) {
	param.toString();
}

public static void main(String[] args) {
	foo(null); // Findbugs will not be happy here!
}
```

Or as a return value:

```java
@NotNull
private String foo() {
	return "foo";
}
```

I prefer the annotation `@Nullable` over `@NotNull` because in most case, parameters or return values are not `null`.
So why bother putting `@NotNull` everywhere? With the annotation `@Nullable`, you tell findbugs that the parameters might be null and a null check is needed:

```java
private void foo(@Nullable String param) {
	param.toString(); // Findbugs will not be happy here!
}
```

However, you need to specify that every parameters and return values are not `null`.
To do so, you need to create a `package-info.java` at the root of your package folder:

```
src
|
|--java
|----com.lin.louis
|------Main.java
|------package-info.java
```

with the following content:

```
@ParametersAreNonnullByDefault package com.lin.louis;

import javax.annotation.ParametersAreNonnullByDefault;
```

Using the NullPointerPattern
============================

Another way to avoid `NullPointerException` is to use the [NullPointerPatter](http://en.wikipedia.org/wiki/Null_Object_pattern).

For example:

```java
public class User {
	private String name;
	private List<String> permissions;
	public String getName() { ... }
	public List<String> getPermissions() { ... }
}

public final class UserNull {
	@Override
	public String getName() { return ""; }
	@Override
	public List<String> getPermissions() { return Collections.emptyList(); }
}
```

So instead of returning `null`, you return the `null` value of `User` => `UserNull`.

This pattern has a huge downside: you have to write for each POJO an empty class that represents the `null` value of your class.

So much boilerplate for avoiding `NullPointerExceptions`.

That is not my favorite solution.

Throw exception as soon as you can
==================================

I prefer throwing an exception if the value of my parameter does not meet my expectation. You often want to have those check when you are working with external APIs:

```java
public void foo(String param) {
	if (StringUtils.isBlank(param)) {
		throw new IllegalArgumentException("Param must not be blank.");
	}
}
```

Or with [Guava](https://code.google.com/p/guava-libraries/):

```java
public void foo(String param) {
	checkArgument(StringUtils.isBlank(param), "Param must not be blank.");
}
```

Using Optionals
===============

This pattern comes from functional programming background. The main goal is to use a wrapper of the object. 
This wrapper either returns the not `null` value or `absent`.

The library [Guava](https://code.google.com/p/guava-libraries/wiki/UsingAndAvoidingNullExplained#Optional) or [FunctionalJava](https://github.com/functionaljava/functionaljava) has some interesting classes.

For example:

```java
public void foo(String param) {
	Optional<String> optionalParam = Optional.fromNullable(param);
	if (optionalParam.isPresent()) {
		System.out.println(optionalParam.get());
	} else {
		System.out.println("optionalParam is absent");
	}
}
```

From guava explanation: 

> Many of the cases where programmers use null is to indicate some sort of absence: perhaps where there might have been a value, there is none, or one could not be found. For example, Map.get returns null when no value is found for a key.

> Optional<T> is a way of replacing a nullable T reference with a non-null value. An Optional may either contain a non-null T reference (in which case we say the reference is "present"), or it may contain nothing (in which case we say the reference is "absent"). It is never said to "contain null."

> What's the point?

> Besides the increase in readability that comes from giving null a name, the biggest advantage of Optional is its idiot-proof-ness. It forces you to actively think about the absent case if you want your program to compile at all, since you have to actively unwrap the Optional and address that case. Null makes it disturbingly easy to simply forget things, and though FindBugs helps, we don't think it addresses the issue nearly as well.

> This is especially relevant when you're returning values that may or may not be "present." You (and others) are far more likely to forget that other.method(a, b) could return a null value than you're likely to forget that a could be null when you're implementing other.method. Returning Optional makes it impossible for callers to forget that case, since they have to unwrap the object themselves for their code to compile.

