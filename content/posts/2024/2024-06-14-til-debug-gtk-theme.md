---
title: "TIL: how to debug GTK theme"
date: 2024-06-14T19:32:33+02:00
featuredImage: ""
tags: ["til"]
categories: ["post"]
toc:
  enable: false
---

<!--more-->

Add the environment variable `GTK_DEBUG=interactive` to debug a GTK application.

For example, to debug `pavucontrol`, execute from a terminal:

```bash
GTK_DEBUG=interactive pavucontrol
```

In this interface, you will be able to check the list of themes, icons,
cursors, ...
