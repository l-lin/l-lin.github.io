---
title: "Git URL Shortcuts"
date: 2019-04-08T16:02:14+02:00
imageUrl: "https://gitforwindows.org/img/git_logo.png"
tags: ["git"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

You can create shortcuts for git URL paths to clone without typing full URL.

<!--more-->

Add the following to your `.gitconfig` file:

```
[url "https://github.com/"]
    insteadOf = github:
    insteadOf = gh:

[url "git@github.com:"]
    pushInsteadOf = github:
    pushInsteadOf = gh:

[url "https://gitlab.com/"]
    insteadOf = gitlab:
    insteadOf = gb:

[url "git@gitlab.com:"]
    pushInsteadOf = gitlab:
    pushInsteadOf = gb:
```

```bash
# With this configuration, you can clone your repositories using url shortcuts
git clone gh:l-lin/dotfiles
# instead of
git clone git@github.com:l-lin/dotfiles
```
