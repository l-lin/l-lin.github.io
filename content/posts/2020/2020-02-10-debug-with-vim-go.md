---
title: "Debugging With Vim Go"
date: 2020-02-10T09:39:13+01:00
featuredImage: "/images/golang.png"
tags: ["golang", "vim"]
categories: ["post"]
---

Although learning VIM can be quite painful, I learned it and now I love it so much I can't write or
code without it.
Unfortunately, VIM is not super intuitive and is not as user friendly as modern IDEs. Some
functionalities are not easy to use and / or easy to find. For example, debugging programs using VIM
is not as trivial as clicking on a button like most IDEs.

In this post, I will show some basic commands to use to debug a Go program with
[vim-go](https://github.com/fatih/vim-go).

<!--more-->

Start the debugger by using `:GoDebugStart` in your `main` function. Your VIM
should display the following:

![vim-go debug window default config](/images/2020-02-10/vim-go-debug-default_config.png)

Your buffer will be split with new windows:

- stacktrace
- variables
- goroutine
- output of stdout/stderr

Those windows display interesting information, but for my daily usage, I don't need to have all
those windows. I just keep the variable and stacktrace windows. To do so, I edited my `.vimrc` file
to include the following:

```
let g:go_debug_windows = {
      \ 'vars':       'rightbelow 60vnew',
      \ 'stack':      'rightbelow 10new',
\ }
```

If you want to start with argument or some flag, you can do it by calling `:GoDebugStart . -someflag
value`. In my example, I execute with `:GoDebugStart . -name Louis`

Then, place your cursor under the line you want to break and call `:GoDebugNext`. This will add a
breakpoint, run your program and halt on the breakpoint:

![GoDebugNext](/images/2020-02-10/vim-go-debug-next.png)

You can see the values of the local variables as well as the function argument's values.

You can also print in the stdout with `:GoDebugPrint variable` if the variable is not displayed in
the variable window (e.g. the value of a pointer, one element in a slice, ...):

![GoDebugPrint](/images/2020-02-10/vim-go-debug-print.png)

You can navigate and put a breakpoint anywhere you want. For example, I call `:GoDebugNext` inside
my function `greet`:

![GoDebugNext inside function](/images/2020-02-10/vim-go-debug-next_inside_function.png)

When you have finished, you can call `:GoDebugStop` to stop the debugging.

A GIF to show the entire debugging of a simple Go program:

![vim-go debug](/images/2020-02-10/vim-go-debug.gif)

If you want to go further, you can check the documentation in VIM with `:h vim-go` or directly
[online](https://github.com/fatih/vim-go/blob/master/doc/vim-go.txt).

