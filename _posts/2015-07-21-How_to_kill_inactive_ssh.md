---
layout: post
title:  "Linux - How to kill inactive ssh sessions" 
date:   2015-07-21
tags: [Random]
images: [xubuntu.png]
---

Execute the following command that displays the list of processes:

```
pstree -p
```

Look for the `sshd`:

```
├─sshd(3102)─┬─sshd(3649)───bash(3656)
│            └─sshd(16680)───bash(16687)───pstree(17073)
```

Kill the session:

```
kill 3649
```

