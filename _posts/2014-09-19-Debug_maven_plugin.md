---
layout: post
title: "Debugging Maven plugin with IntelliJ"
date: 2014-09-19
tags: [IntelliJ, Maven]
images: [maven.png, idea.png]
---

If you need to debug your Maven plugin, first, run with the command `mvnDebug <goal>`. You will see something like this:

```
$ mvnDebug test
Preparing to Execute Maven in Debug Mode
Listening for transport dt_socket at address: 8000
```

Now add a breakpoint with your IntelliJ to your desired line code.

Add a new Remote seettings:

![Add remote settings]({{ site.url }}/images/mvn_debug_intellij.png)

Finally, run and the maven command will automatically proceed.
