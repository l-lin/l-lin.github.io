---
layout: post
title: "Authentication using certificates, Tomcat and Spring security"
date: 2014-08-03
tags: [Tomcat]
images: [tomcat.png, java.png, spring.png]
---

Instead of the classic `login/password` way to access to a secured application, it's possible to authenticate through a certificate.
What's more, you can also link a `ROLE` to each certificate.

*TLDR*: Check the sample project on my [Github](https://github.com/l-lin/dev-cheat-sheet/sample-cert-auth).

This tutorial will show you:

* how to activate the SSL secured by a certificate for our Tomcat
* how to secure the URL pattern with Spring Security
* how to access with a browser
* how to access with a third party application

In order to fully comprehend the tutorial, I will demonstrate it with a concrete example.

# The specifications of the application

You have to build an internal application (let's call it `foobar`) that needs to be a bit secured.
This application will mainly be used as a web service application where other web applications will be able to plug in `foobar`. Let's be crazy and say that Paypal and Amazon are the web applications that will communicate with our great app.

![Logical architecture]({{ site.url }}/images/logical_archi.png)

Simple right?

Now, you want to enable access to `foobar` only to Paypal and Amazon.
There are several solutions to do that (same network, OAuth, Basic Auth, and so on...), but you came for certificate authenticate, arent't you?


# The basics

The principle is quite simple. It's a mutual verification:
The client check if the certificate given by the server is valid or not (through a certification authority that signs certificates).
The server also check the certificate given by the client.

![Certificate workflow]({{ site.url }}/images/certificate_workflow.png)
Credits to [http://blog.netapsys.fr/](http://blog.netapsys.fr/).

* The `keystores` store the private keys destinated to encrypt the data before emitting
* The `trustores` store the public keys destinated to identify the transmitter and then to decrypt their message

# SSL activation

## Generating the certificate

* Let's generate the keystore that will be used by Tomcat by executing the following commands:

```bash
# Adapt the parameters to your liking.
keytool -genkey -v -alias tomcat -keyalg RSA -validity 3650 -keystore foobar.jks -dname "CN=foobar.local.fr, OU=Integration, O=foobar, L=Paris, ST=IDF, C=FR" -storepass foobarpwd -keypass foobarpwd

# Then, generate the CSR to sign:
keytool -certreq -alias tomcat -file foobar.csr -keystore foobar.jks -storepass foobarpwd

# Since we do not have any certification authority, we will generate our own.
openssl genrsa -out rootCA.key 1024
openssl req -new -x509 -days 3650 -key rootCA.key -out rootCA.crt -subj "/C=FR/ST=IDF/L=Paris/O=foobar/OU=Integration/CN=local.fr"
mkdir -p demoCA/newcerts
touch demoCA/index.txt
echo '01' > demoCA/serial

# Sign the certificate to the CA:
openssl ca -batch -keyfile rootCA.key -cert rootCA.crt -policy policy_anything -out localhost.crt -infiles foobar.csr

# Add the root certificate tot the keystores
keytool -importcert -alias foobarrootca -file rootCA.crt -keystore foobar.jks -storepass foobarpwd -noprompt

# Add signed certificate to the keystores
keytool -importcert -alias tomcat -file demoCA/newcerts/01.pem -keystore foobar.jks -storepass foobarpwd -noprompt

# Adding the root certificate to cacerts of your JVM
keytool -import -noprompt -trustcacerts -alias foobar -file rootCA.crt -keystore ${JAVA_HOME}/jre/lib/security/cacerts -storepass changeit

# Create the trustore with the root certificate in it
keytool -import -keystore cacerts.jks -storepass cacertspassword -alias rootca -file rootCA.crt -noprompt
```

## Configuring with Tomcat

* Edit the `server.xml` of your Tomcat and add the following connector (change the path to your jks file):

```xml
<Connector
        protocol="HTTP/1.1"
        port="8443" maxThreads="200"
        scheme="https" secure="true" SSLEnabled="true"
        keystoreFile="/path/to/foobar.jks" keystorePass="foobarpassword"
        truststoreFile="/path/to/cacerts.jks" truststorePass="cacertspassword"
        clientAuth="false" sslProtocol="TLS"/>
```

## Securing the application

Ok, now we finished configuring our Tomcat. Let's start implementing the security in our application.

* So first, add dependency to Spring security with Maven:

```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-web</artifactId>
	<version>4.0.3.RELEASE</version>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-config</artifactId>
	<version>4.0.3.RELEASE</version>
</dependency>
```

* Edit the `web.xml` with the following:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns="http://java.sun.com/xml/ns/javaee"
         xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/web-app_3_0.xsd"
         version="3.0">
    <display-name>Foobar Application</display-name>

    <context-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>
            WEB-INF/foobar-web-app-context.xml
        </param-value>
    </context-param>

    <!-- Filter to ensure spring gets to handle requests and enforce security -->
    <filter>
        <filter-name>springSecurityFilterChain</filter-name>
        <filter-class>org.springframework.web.filter.DelegatingFilterProxy</filter-class>
    </filter>
    <filter-mapping>
        <filter-name>springSecurityFilterChain</filter-name>
        <url-pattern>/*</url-pattern>
    </filter-mapping>

    <listener>
        <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
    </listener>

    <servlet>
        <servlet-name>foobarSpringDispatchServlet</servlet-name>
        <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
        <init-param>
            <param-name>contextConfigLocation</param-name>
            <param-value>WEB-INF/epayment-web-app-context.xml</param-value>
        </init-param>
        <load-on-startup>1</load-on-startup>
    </servlet>

    <servlet-mapping>
        <servlet-name>foobarSpringDispatchServlet</servlet-name>
        <url-pattern>/api/*</url-pattern>
    </servlet-mapping>

    <welcome-file-list>
        <welcome-file>index.html</welcome-file>
        <welcome-file>index.htm</welcome-file>
        <welcome-file>index.jsp</welcome-file>
        <welcome-file>default.html</welcome-file>
        <welcome-file>default.htm</welcome-file>
        <welcome-file>default.jsp</welcome-file>
    </welcome-file-list>

    <security-constraint>
        <web-resource-collection>
            <web-resource-name>All users</web-resource-name>
            <url-pattern>/favicon.ico</url-pattern>
        </web-resource-collection>
    </security-constraint>

    <security-constraint>
        <web-resource-collection>
            <web-resource-name>AuthUser</web-resource-name>
            <url-pattern>/*</url-pattern>
        </web-resource-collection>
        <auth-constraint>
            <role-name>AUTH_USER</role-name>
        </auth-constraint>
        <user-data-constraint>
            <transport-guarantee>CONFIDENTIAL</transport-guarantee>
        </user-data-constraint>
    </security-constraint>

    <login-config>
        <auth-method>CLIENT-CERT</auth-method>
    </login-config>

    <security-role>
        <role-name>AUTH_USER</role-name>
    </security-role>
</web-app>
```

* Edit the `foobar-web-app-context.xml` with the following:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans:beans xmlns="http://www.springframework.org/schema/security"
             xmlns:security="http://www.springframework.org/schema/security"
             xmlns:beans="http://www.springframework.org/schema/beans" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://www.springframework.org/schema/beans
           http://www.springframework.org/schema/beans/spring-beans-3.1.xsd
           http://www.springframework.org/schema/security
           http://www.springframework.org/schema/security/spring-security-3.1.xsd">

    <security:http pattern="/favicon.ico" security='none' />

    <security:http -point-ref="delegatingAEP">
        <security:intercept-url pattern="/META-INF" access="IS_AUTHENTICATED_FULLY" />
        <security:custom-filter position="PRE_AUTH_FILTER" ref="customFilter"/>
    </security:http>

    <beans:bean id="customAuthenticationProvider" class="foo.bar.security.X509CustomAuthenticationProvider"/>
    <beans:bean id="delegatingAEP" class="foo.bar.security.X509CustomEntryPoint"/>

    <security:authentication-manager alias="authenticationManager">
        <security:authentication-provider ref="customAuthenticationProvider" />
    </security:authentication-manager>

    <beans:bean id="customFilter" class="foo.bar.security.X509CustomFilter">
        <beans:property name="authenticationManager" ref="authenticationManager"/>
    </beans:bean>
</beans:beans>
```

* First, let's implements the ̀`X509AuthenticationToken` class that will be used as the token to authenticate the user:

```java
public class X509AuthenticationToken extends UsernamePasswordAuthenticationToken {

    public X509AuthenticationToken(Object principal, Object credentials) {
        super(principal, credentials);
    }

    public X509AuthenticationToken(Object principal, Object credentials, Collection<? extends GrantedAuthority> authorities) {
        super(principal, credentials, authorities);
    }
}
```

* Implements the `X509CustomEntryPoint` class:

```java
public class X509CustomEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
    }
}
```

* Implements the `X509CustomAuthenticationProvider` class:

```java
@Component
public class X509CustomAuthenticationProvider extends AbstractUserDetailsAuthenticationProvider {

    @Inject
    CertificateUserService certificateUserService;

    @Override
    protected void additionalAuthenticationChecks(UserDetails userDetails, UsernamePasswordAuthenticationToken authentication) throws AuthenticationException {
        //Do nothing
    }

    @Override
    protected X509CustomUser retrieveUser(String username, UsernamePasswordAuthenticationToken authentication) throws AuthenticationException {
        List<GrantedAuthority> grantedAuths = new ArrayList<>();

        X509Certificate certificate = (X509Certificate) authentication.getPrincipal();

        // Use your service to fetch the certificate user from your DB, or LDAP or anywhere you like
        CertificateUser certificateUser = certificateUserService.findByCertificateId(certificate.getSubjectDN().getName());

        // Convert in a DTO that can be exploited
        X509CustomUser user = new X509CustomUser(certificateUser.getCertificateId(), "", grantedAuths);
        BeanUtils.copyProperties(certificateUser, user);

        return user;
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return (X509AuthenticationToken.class.isAssignableFrom(authentication));
    }
}
```

* Finally, implements the `X509CustomFilter` class:

```java
public class X509CustomFilter extends GenericFilterBean {
    public static final String X509 = "javax.servlet.request.X509Certificate";

    private AuthenticationManager authenticationManager;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        if (!(request instanceof HttpServletRequest && response instanceof HttpServletResponse)) {
            chain.doFilter(request, response);
            return;
        }

        if (request.getAttribute(X509) == null) {
            chain.doFilter(request, response);
            return;
        }

        X509Certificate[] certificates = (X509Certificate[]) request.getAttribute(X509);
        if (certificates.length > 0) {
            //Using the first certificate, we don't know how to identify several at once
            doAuthenticate((HttpServletRequest) request, (HttpServletResponse) response, certificates[0]);
        }

        chain.doFilter(request, response);
    }

    private void doAuthenticate(HttpServletRequest request, HttpServletResponse response, X509Certificate certificate) {
        Authentication authResult;

        if (certificate == null) {
            if (logger.isDebugEnabled()) {
                logger.debug("No certificate found in request");
            }

            return;
        }

        if (logger.isDebugEnabled()) {
            logger.debug("preAuthenticatedPrincipal = " + certificate + ", trying to authenticate");
        }

        try {
            X509AuthenticationToken authRequest = new X509AuthenticationToken(certificate, getPreAuthenticatedCredentials(request));
            authResult = authenticationManager.authenticate(authRequest);
            successfulAuthentication(request, response, authResult);
        } catch (AuthenticationException failed) {
            unsuccessfulAuthentication(request, response, failed);
            throw failed;
        }
    }

    /**
     * Sets authentication manager.
     *
     * @param authenticationManager the authentication manager
     */
    public void setAuthenticationManager(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    /**
     * Gets pre authenticated credentials.
     *
     * @param request the request
     * @return the pre authenticated credentials
     * @see org.springframework.security.web.authentication.preauth.AbstractPreAuthenticatedProcessingFilter#getPreAuthenticatedPrincipal(javax.servlet.http.HttpServletRequest)
     */

    protected Object getPreAuthenticatedCredentials(HttpServletRequest request) {
        return "N/A";
    }

    /**
     * Unsuccessful authentication.
     *
     * @param request the request
     * @param response the response
     * @param failed the failed
     */
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response, AuthenticationException failed) {
        SecurityContextHolder.clearContext();

        if (logger.isDebugEnabled()) {
            logger.debug("Cleared security context due to exception", failed);
        }

        request.setAttribute(WebAttributes.AUTHENTICATION_EXCEPTION, failed);
    }

    /**
     * Puts the <code>Authentication</code> instance returned by the authentication manager into the secure context.
     * @param request the request
     * @param response the response
     * @param authResult the auth result
     */
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, Authentication authResult) {
        if (logger.isDebugEnabled()) {
            logger.debug("Authentication success: " + authResult);
        }
        SecurityContextHolder.getContext().setAuthentication(authResult);
    }
}
```

Annnnnnd, we're done with the server. It's now 

# Accessing with a browser

* Let's generate the keystore that will be used to authenticate to the application:

```bash
# Adapt the parameters to your liking.
keytool -genkey -v -alias tomcat -keyalg RSA -validity 3650 -keystore dev.jks -dname "CN=dev.local.fr, OU=Integration, O=dev, L=Paris, ST=IDF, C=FR" -storepass devpwd -keypass devpwd

# CSR to sign
keytool -certreq -alias tomcat -file dev.csr -keystore dev.jks -storepass devpwd

# "Master" CA generation for signing CSR requests
openssl ca -batch -keyfile rootCA.key -cert rootCA.crt -policy policy_anything -out dev.crt -infiles dev.csr

# Signing
keytool -importcert -alias foobarootca -file rootCA.crt -keystore dev.jks -storepass devpwd -noprompt

# Add the root certificate to the keystories
keytool -importcert -alias foobarrootca -file rootCA.crt -keystore dev.jks -storepass devpwd -noprompt

# Add signed certificate to the keystories
keytool -importcert -alias tomcat -file demoCA/newcerts/02.pem -keystore dev.jks -storepass devpwd -noprompt

# Adding the root certificate to cacerts of your JVM
keytool -delete -noprompt -trustcacerts -alias foobar -keystore ${JAVA_HOME}/jre/lib/security/cacerts -storepass changeit
keytool -import -noprompt -trustcacerts -alias foobar -file rootCA.crt -keystore ${JAVA_HOME}/jre/lib/security/cacerts -storepass changeit

# Export certificates in PKCS12 format for test use (in browser) 
keytool -importkeystore -srckeystore dev.jks -destkeystore dev.p12 -srcstoretype JKS -deststoretype PKCS12 -srcstorepass devpwd -deststorepass devpwd -srcalias tomcat -destalias devKey -srckeypass devpwd -destkeypass devpwd -noprompt
```

## Generating the certificate and allow access

## Import certificate

# Accessing with an another web application

## Generating the certificate and allow access
