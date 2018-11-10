---
title: "How to kill inactive ssh sessions" 
date: 2015-07-21
tags: ["ssh"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

<!--more-->

Execute the following command that displays the list of processes:

```bash
pstree -p
```

Look for the `sshd`:

```bash
├─sshd(3102)─┬─sshd(3649)───bash(3656)
│            └─sshd(16680)───bash(16687)───pstree(17073)
```

Kill the session:

```bash
kill 3649
```
