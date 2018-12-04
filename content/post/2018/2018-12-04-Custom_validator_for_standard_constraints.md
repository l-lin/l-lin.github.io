---
title: "Custom validator for standard constraints"
date: 2018-12-04T09:01:20+01:00
imageUrl: ""
tags: ["bean validation", "java"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

Bean validation provides constraint annotations to check DTO parameters.
However, what if we want to check a parameter type not supported by a standard constraint annotation?

<!--more-->

Let's say, we want to check a `LocalDateTime` is in the future. But, our parameter type is in `String`, a type not supported
by the annotation `@Future`.

Instead of creating a new annotation, we will add configure so that it will support it.

First, let's create our custom validator:

```java
package lin.louis;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import javax.validation.constraints.Future;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class FutureValidatorForString implements ConstraintValidator<Future, String> {
    private static final Logger LOGGER = LoggerFactory.getLogger(FutureValidatorForString.class);

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || "".equals(value.trim())) {
            return true;
        }
        
        try {
            LocalDateTime localDateTime = LocalDateTime.parse(value);
            return LocalDateTime.now().isBefore(localDateTime);
        } catch (DateTimeParseException e) {
            LOGGER.debug("The timestamp is not valid.", e);
            return true;
        }
    }
}
```

Then provide this implementation in `META-INF/services/javax.validation.ConstraintValidator`:

```txt
lin.louis.FutureValidatorForString
```

Now, you can use the annotation for `String` type:

```java
public class Apple {
    @Future
    private String expirationDate;
}
```

Source:

- [in.relation.to](http://in.relation.to/2017/03/02/adding-custom-constraint-definitions-via-the-java-service-loader/)
