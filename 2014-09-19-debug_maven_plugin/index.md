# Debugging Maven plugin with IntelliJ


<!--more-->
If you need to debug your Maven plugin, first, run with the command `mvnDebug <goal>`. You will see something like this:

```bash
$ mvnDebug test
Preparing to Execute Maven in Debug Mode
Listening for transport dt_socket at address: 8000
```

Now add a breakpoint with your IntelliJ to your desired line code.

Add a new Remote seettings:

![Add remote settings](/images/2014-09-19/mvn_debug_intellij.png)

Finally, run and the maven command will automatically proceed.

