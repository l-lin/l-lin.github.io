---
layout: post
title:  "Deploying a MeteorJS apps to Heroku"
date:   2014-05-03
tags: [MeteorJS, Heroku]
images: [meteorjs.png, heroku.png]
---

I thought deploying a [MeteorJS](http://www.meteor.com) to [Heroku](https://www.heroku.com) would be a difficult task, but it turns out to be quite easy after all.
You just need to execute those commands:

```bash
$ cd /path/to/meteor/app
$ heroku config:add BUILDPACK_URL=https://github.com/oortcloud/heroku-buildpack-meteorite.git
$ git push heroku master
```
