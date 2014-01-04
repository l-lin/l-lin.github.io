---
layout: post
title:  "Configuring git behind a proxy"
date:   2014-01-04
tags: [Git]
images: [git.png]
---

When using [Bower](http://bower.io/), you may encounter some issues, such as for example:
`ECMDERR Failed to execute "git ls-remote --tags --heads git://github.com/...", exit code of #128`

The issue probably come from the fact that you are behind a proxy and your proxy does not allow the **git protocol** (port 9418).

So in order to solve this problem, you have to use the protocols `HTTP` and `HTTPS` instead of `GIT`.

The easy way is to tell GIT to use the protocol `HTTPS` instead of the protocol `GIT` with the following commands line:

{% highlight bash %}
$ git config --global url."https://".insteadOf git://
$ git config --global http.proxy my.proxy:1234 
{% endhighlight %}

Now you can install bower components without problems.