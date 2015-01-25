---
layout: post
title: "Changing the Caps Lock key to Ctrl"
date: 2015-01-25
tags: [Random]
images: [xubuntu.png, windows.png]
---

How many times have you used the `caps lock` key compare to the `ctrl` button?
Once a year maybe? You must have experienced at least once a situation where you
must enter your password, but your caps lock is on, thus you entered your password wrong.

So instead of having an "useless" button on your keyboad, how about changing to a button that you use
everyday?

In my opinion, I feel that the `left ctrl` key is way too low on the keyboard.
My pinky finger has to make one heck of an effort to press that key! So at the end of the day,
after hundred of "copy/paste", this little finger has hurt his back and won't work anymore...
Jokes aside, it has been like a year I change it to `left ctrl`, and I feel that typing has been
smoother now.

Anyway, here are the steps to change on XUbuntu (best OS I found so far) and Windows:

On Xubuntu:
-----------
* Xubuntu → Settings Manager → Session and Startup
* Then in the Sessions and Startup configurator go
* Application Autostart (tab at the top) → Add (bottom button)

Now on the Add Application screen

```
Name: Control and CapsLk swap
Description: Swap the two keys
Command: /usr/bin/setxkbmap -option "ctrl:swapcaps"
```

On Windows:
-----------

* Open `regedit.exe`
* Look for `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Keyboard Layout`
* Now change the binary values to look like this:

![Windows Caps lock to Ctrl]({{ site.url }}/images/2015-01-25/windows_capslock_to_ctrl.png)

More information on [howtogeek](http://www.howtogeek.com/howto/windows-vista/disable-caps-lock-key-in-windows-vista/).
