---
title: "MeteorJS, yet another JS framework?"
date: 2014-05-02
imageUrl: "/images/meteorjs.png"
tags: ["meteorjs", "experimenting"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

There are so many JS framework out there, and everyday dozen (maybe more) of JS frameworks are created. So why another framework?

Well I think the strength of [MeteorJS][] come from its powerful real time data synchronization for all connected users.

In other words, any change from one device/user will affect the other devices/users in real time. So they won't need to refresh their page, the data is already fresh!

<!--more-->

So, I went to a Meteor meetup to check out what's inside this baby, and I can say that was bluffing.
I was literally like this after the demo and the live coding:

{{% figure class="center" src="https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif" alt="Wow" title="Wow" %}}

No shit, I was really exited to develop with this stack.

# My journey to the unknown

I wanted to make a new project "[WhatLunchToday](https://github.com/l-lin/whatlunchtoday)" that will help me and my colleagues to choose what to eat for lunch
(yes, we are too indecisive to even make that decision =.=).

So this project was the perfect "guinea pig" to test out this framework, along with testing other framework and tools
([Foundation](http://foundation.zurb.com/), [Stylus](http://learnboost.github.io/stylus/), [Gitflow](https://github.com/nvie/gitflow)).

## The good part

MeteorJS is not all about User Experience. The MeteorJS team also focus with the developer experience!

* Really easy to install new meteor apps: One command line and you are ready to go:

```bash
meteor create your_awesome_project
```

* One command to launch your webapp:

```bash
# Runs on http://localhost:3000 by default
meteor
# Or
meteor run
```

* Live reload: any change on your code will refresh your browser automatically
* No need to include JS, HTML or CSS files, Meteor is smart to include them itself (it's double edge because you might feel like you lost some control over the files...)
* Easy to deploy for demo

```bash
meteor deploy yourawesomeproject.meteor.com
```

* Easy to add new modules with the package manager [Meteorite](https://github.com/oortcloud/meteorite/)
  * On a side note, when including module with meteorite, it does not include the module directly on your project. So when commiting your project, you will not commit the "whole world", which is nice.

```bash
# Example of adding foundation
mrt add foundation
```

To sum up, nothing to configure, everything is ready for you to develop quickly your meteor app.

To compare with developing with other JS framework, you will have to configure your webapp with [GruntJS](http://gruntjs.com/)
or [Gulp](http://gulpjs.com/), which is really time consuming (you have to choose the plugins, to configure them, and so on...).

## The struggle

However, every framework come with some bad side.

I like how my code is strutured (I come from Java world), but Meteor let you code anywhere, literally...

You can code your client side code ALONG with your server side code!!! Outrageous...is what I thought. But maybe the Meteor team
has a vision for this common code.
The documentation does not really specify where you should put your files. It just tells you what folder is run in client/server side
but no convention is set (I am a convention fan, so I was a little sad on that).

Since MeteorJS is quite young, I found its documentation really lacking.
No real and useful example are found in the offical documentation. For newbies like me who just started MongoDB and MeteorJS,
I could not find what I needed, thus I had to search on my own with stackoverflow and Google...
(I think good official documentation can cover 90% of newbie questions).

When developing, I was feeling like "Magic", like I felt when developing with [AngularJS](https://angularjs.org/).
Indeed, I did not make some code and it just works (yes, it did happen with AngularJS, and even a lot!).

With MeteorJS, I was struggling with the code, trying to understand the concepts behind MeteorJS (it does not use promises, but publish/subscribe concept,...).

In other words, developing with MeteorJS was not intuitive.

Finally, after days of struggling, I just decided to fetch a Meteor Boilerplate from Github. And most of my questions was answered (but not all!).
I should have done from the beginning...

# Will I continue to use MeteorJS?

Maybe. I still prefer developing with AngularJS, but the user experience is certainly better with MeteorJS.

For now, developing with MeteorJS depends on the necessity of real time data synchronization.
Otherwise, I would stick with AngularJS.

[meteorjs]: http://www.meteor.com
