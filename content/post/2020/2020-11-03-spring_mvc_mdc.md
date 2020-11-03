---
title: "MDC in Spring MVC"
date: 2020-11-03T09:16:28+01:00
imageUrl: ""
tags: ["spring"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

Logging with Mapped Diagnostic Context (MDC) to provide a way to enrich log messages with pieces of
information that can be useful for better tracking program execution.

In this post, we will see how to include basic MDC, such as request information or the authenticated
user id, with Spring MVC.

<!--more-->

Logback provides a useful class [MDCInsertingServletFilter][] which is a filter that will add the
essential HTTP request information.

You can configure a spring-boot to include this filter like this:

```java
package lin.louis.application.config;

import ch.qos.logback.classic.helpers.MDCInsertingServletFilter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MonitoringConfig {

    @Bean
        FilterRegistrationBean<MDCInsertingServletFilter> mdcFilterRegistrationBean() {
        FilterRegistrationBean<MDCInsertingServletFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new MDCInsertingServletFilter());
        registrationBean.addUrlPatterns("/*");
        registrationBean.setOrder(Integer.MIN_VALUE);
        return registrationBean;
    }
}
```

If you are using spring-security, you may also include some context about the user in the MDC:

```java
public class MDCAuthenticationFilter extends OncePerRequestFilter {

    private static final String USER = "user";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof UserDetails) {
            UserDetail user = (UserDetails) authentication.getPrincipal();
            MDC.put(USER, user.getUsername());
            try {
                filterChain.doFilter(request, response);
            } finally {
                MDC.remove(USER);
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }
}
```

And to add this filter in your spring-security configuration, you need to add after your
authentication filter. For example:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private static final RequestMatcher AUTHENTICATED_URLS = new OrRequestMatcher(
            new AntPathRequestMatcher("/api/**"),
    );

    private static final String PUBLIC_URL = "/actuator/**";

    @Override
    protected void configure(final HttpSecurity http) throws Exception {
        //@formatter:off
        http
                .cors()
            .and()
                .sessionManagement().sessionCreationPolicy(STATELESS)
            .and()
                .exceptionHandling()
                .defaultAuthenticationEntryPointFor(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED), AUTHENTICATED_URLS)
            .and()
                .authenticationProvider(this.customAuthenticationProvider())
                .addFilterBefore(this.customAuthenticationFilter(), AnonymousAuthenticationFilter.class)
                .addFilterAfter(new MDCAuthenticationFilter(), CustomAuthenticationFilter.class)
                .authorizeRequests()
                .requestMatchers(AUTHENTICATED_URLS).authenticated()
                .antMatchers(PUBLIC_URL).permitAll()
            .and()
                .csrf().disable()
                .formLogin().disable()
                .logout().disable();
        //@formatter:on
    }

    // replace with your authentication provider
    private CustomAuthenticationProvider customAuthenticationProvider() {
      return new CustomAuthenticationProvider();
    }

    // replace with your authentication filter
    private CustomAuthenticationFilter customAuthenticationFilter() throws Exception {
        final CustomAuthenticationFilter filter = new CustomAuthenticationFilter(AUTHENTICATED_URLS);
        filter.setAuthenticationManager(this.authenticationManager());
        return filter;
    }
}
```

[MDCInsertingServletFilter]: https://logback.qos.ch/xref/ch/qos/logback/classic/helpers/MDCInsertingServletFilter.html

