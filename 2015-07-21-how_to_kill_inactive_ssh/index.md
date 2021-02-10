# How to kill inactive ssh sessions


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

