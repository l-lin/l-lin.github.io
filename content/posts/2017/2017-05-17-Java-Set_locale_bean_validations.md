---
title: "How to set locale for java bean validations" 
date: 2017-05-17
featuredImage: "https://images.pexels.com/photos/268438/pexels-photo-268438.jpeg?w=1260&h=750&auto=compress&cs=tinysrgb"
tags: ["locale", "bean validation", "java"]
categories: ["post"]
---

Using JSR303 Java bean validations is great! Using with hibernate validation annotations is also great as it provides default validations like `@NotBlank`.

However, the hibernate validation library also provides default validation messages, for several languages (which is great).

<!--more-->

You just need to instanciate a new bean `org.springframework.web.servlet.i18n.FixedLocaleResolver` in your app configuration:

```java
@Configuration
public class OneLocaleValidatorConfig {
    @Bean
    LocaleResolver localeResolver() {
        // Force english for Spring Security error messages
        return new FixedLocaleResolver(Locale.ENGLISH);
    }
}
```

**Update**: The following solution works but it's not the ideal way to force the locale.

One way is to provide our own `MessageSource` and define our own properties files, thus having only one message properties file for only one locale.

* Create a configuration file:

```java
@Configuration
public class OneLocaleValidatorConfig extends WebMvcConfigurerAdapter {
    @Override
    public Validator getValidator() {
        LocalValidatorFactoryBean factory = new LocalValidatorFactoryBean();
        factory.setValidationMessageSource(messageSource());
        return factory;
    }

    private MessageSource messageSource() {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
        // Set our own validation message property so we only have english version
        messageSource.setBasename("classpath:validation/OneLocaleValidationMessages");
        messageSource.setDefaultEncoding(StandardCharsets.UTF_8.displayName());
        return messageSource;
    }
}
```

* Add only one validation messages in the `/path/to/project/src/main/resources/validation/OneLocaleValidationMessages.properties` with the content provided by the hibernate validation library:

```properties
javax.validation.constraints.AssertFalse.message = must be false
javax.validation.constraints.AssertTrue.message  = must be true
javax.validation.constraints.DecimalMax.message  = must be less than ${inclusive == true ? 'or equal to ' : ''}{value}
javax.validation.constraints.DecimalMin.message  = must be greater than ${inclusive == true ? 'or equal to ' : ''}{value}
javax.validation.constraints.Digits.message      = numeric value out of bounds (<{integer} digits>.<{fraction} digits> expected)
javax.validation.constraints.Future.message      = must be in the future
javax.validation.constraints.Max.message         = must be less than or equal to {value}
javax.validation.constraints.Min.message         = must be greater than or equal to {value}
javax.validation.constraints.NotNull.message     = may not be null
javax.validation.constraints.Null.message        = must be null
javax.validation.constraints.Past.message        = must be in the past
javax.validation.constraints.Pattern.message     = must match "{regexp}"
javax.validation.constraints.Size.message        = size must be between {min} and {max}

org.hibernate.validator.constraints.CreditCardNumber.message        = invalid credit card number
org.hibernate.validator.constraints.EAN.message                   = invalid {type} barcode
org.hibernate.validator.constraints.Email.message                   = not a well-formed email address
org.hibernate.validator.constraints.Length.message                  = length must be between {min} and {max}
org.hibernate.validator.constraints.LuhnCheck.message               = The check digit for ${validatedValue} is invalid, Luhn Modulo 10 checksum failed
org.hibernate.validator.constraints.Mod10Check.message              = The check digit for ${validatedValue} is invalid, Modulo 10 checksum failed
org.hibernate.validator.constraints.Mod11Check.message              = The check digit for ${validatedValue} is invalid, Modulo 11 checksum failed
org.hibernate.validator.constraints.ModCheck.message                = The check digit for ${validatedValue} is invalid, ${modType} checksum failed
org.hibernate.validator.constraints.NotBlank.message                = may not be empty
org.hibernate.validator.constraints.NotEmpty.message                = may not be empty
org.hibernate.validator.constraints.ParametersScriptAssert.message  = script expression "{script}" didn't evaluate to true
org.hibernate.validator.constraints.Range.message                   = must be between {min} and {max}
org.hibernate.validator.constraints.SafeHtml.message                = may have unsafe html content
org.hibernate.validator.constraints.ScriptAssert.message            = script expression "{script}" didn't evaluate to true
org.hibernate.validator.constraints.URL.message                     = must be a valid URL

org.hibernate.validator.constraints.br.CNPJ.message                 = invalid Brazilian corporate taxpayer registry number (CNPJ)
org.hibernate.validator.constraints.br.CPF.message                  = invalid Brazilian individual taxpayer registry number (CPF)
org.hibernate.validator.constraints.br.TituloEleitoral.message      = invalid Brazilian Voter ID card number
```
