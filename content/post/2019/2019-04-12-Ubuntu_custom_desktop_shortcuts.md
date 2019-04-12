---
title: "Ubuntu custom desktop shortcuts"
date: 2019-04-12T09:27:54+02:00
imageUrl: "https://career.guru99.com/wp-content/uploads/2014/08/Ubuntu.png"
tags: ["ubuntu"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

With Ubuntu, you can create your own desktop shortcuts that will be accessible directly from the launcher.

You can do it by using a GUI, or you can do it using directly a terminal, which is the what we will be covering here.

<!--more-->

There are two applications folders that Ubuntu is looking:

* `/usr/share/applications/`
  * Shared folder to every computer's users
* `~/.local/share/applications/`
  * Folder specific to the users, thus shortcuts only available for current user

If you want to create a custom one, create a `<name>.desktop` file into one of those two folders with the following content:

```
[Desktop Entry]
Type=Application
Name=Name of the app
Icon=/path/to/your/icon.png
Exec="/path/to/your/exec" %f
Comment=Some comment
Categories=Categories;separated;by;semi-commas;
Terminal=false
```

Sources:

* https://askubuntu.com/questions/64222/how-can-i-create-launchers-on-my-desktop
* https://askubuntu.com/questions/1006882/intellij-shortcut-location
