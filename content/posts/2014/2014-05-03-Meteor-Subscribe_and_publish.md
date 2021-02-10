---
title: "Publishing, subscribing... The magic and the mystery"
date: 2014-05-03
featuredImage: "https://images.pexels.com/photos/6727/wood-lighting-creativity-paper.jpg?w=940&h=650&auto=compress&cs=tinysrgb"
tags: ["meteorjs", "experimenting"]
categories: ["post"]
---

[MeteorJS][] comes with an interesting concept: Publishing and subscribing record sets.
But what the **** are those? My thought exactly!
It's a new way of fetching data from the server.

<!--more-->

With classic asynchronous callbacks, you may write something like this:

```js
var dataFromServer;
fetchDataFromServer(id, function(result) {
    dataFromServer = result;
});
```

With promises:

```js
var dataFromServer;
fetchDataFromServer(id).then(function(result) {
    dataFromServer = result;
});
```

With Meteor:

```js
var result = fetchDataFromServer(id);
```

{{< figure class="center" src="http://i0.kym-cdn.com/photos/images/facebook/000/112/480/OpoQQ.jpg" alt="Are you serious?" title="Are you serious?" >}}

HUH? No callbacks, no promises, like it's synchronous call!

Hold your horses! It's not magic. Calm down. It's just using [Fibers](https://github.com/laverdet/node-fibers) that allows to write
asynchronous code without callbacks.

> What it's like to develop server calls with MeteorJS

Let me tell you my story on how I *finally* understand the concept between subscribing and publishing (or maybe I still don't understand...
If so please just tell me I'm wrong so I can go hang myself).

Let's take a really simple example:

* I have a list of groups stored in my MongoDB
* I want to display all groups
* I want to display a list of filtered groups

So looking at the examples provided by the official site [MeteorJS][], I write this:

`Shared code` (maybe in lib folder or another place I don't even know because the documentation does not mention it):

```js
Groups = new Meteor.Collection('groups');
```

`Server code`:

```js
Meteor.publish('groups', function() {
    return Groups.find();
});
```

`Client code`:

```js
Meteor.subscribe('groups');
```

Ok... so now what? How do I fetch those groups? Still looking in the examples... They are fetching in the helpers:

```js
Template.groups.helpers({
    groups: function() {
        return Groups.find();
    }
});
```

Annnddd it perfectly retrieves the list of groups and perfectly displays the list in the template.
Mmmhh...Ok... I don't quite understand what's the connection between publishing/subscribing and calling directly `Groups.find()` in the helper.
Maybe some magic?

Ok, so let me try to fetch a filtered list of groups that contains "foo":

```js
Template.groups.helpers({
    ... // other helpers
    filteredGroups: function() {
        return Groups.find({name: /foo/});
    }
});
```

Still works! Oh great! I still don't understand, but who cares! It works!

Ok, so now I want to manipulate the filtered list client side:

```js
Template.groups.helpers({
    ... // other helpers
    doingSomethingNastyToDatGroups: function() {
        var filteredGroups = Groups.find({name: /foo/}).fetch();
        // fitleredGroups = [] !!!
        ...
    }
});
```

Now, I am lost... `filteredGroups` is just an empty array...whereas previously it perfectly displays the list of filtered groups... Why?

So after countless hours of trying to understand the concept ([in the official documentation](http://docs.meteor.com/#publishandsubscribe),
[Stackoverflow](http://stackoverflow.com/questions/19826804/understanding-meteor-publish-subscribe),...), the reason why it's an empty array
is the fact that the server has not returned the data yet.

However, if I try to manipulate the whole list of groups, the list is not empty:

```js
Template.groups.helpers({
    ... // other helpers
    doingSomethingNastyToDatGroups: function() {
        var groups = Groups.find().fetch();
        // groups = [{Object: Object}, {Object: Object]
        ...
    }
});
```

And that strikes me (well... in fact, searching around gave me some clues, but whatever), I need to subscribe with specific parameters:

`Server code`:

```js
Meteor.publish('filteredGroups', function(filter) {
    return Groups.find({name: filter});
});
```

`Client code`:

```js
Meteor.subscribe('filteredGroups');
```

Now my `var filteredGroups = Groups.find({name: /foo/}).fetch();` will not return an empty array, but an array of filtered groups.

Why is that? By subscribing, the client possess some sort of cursor or whatever they call. See the
[post in Stackoverflow](http://stackoverflow.com/questions/19826804/understanding-meteor-publish-subscribe) for more details.

**TLDR**: `RTFM`! Really, you have to read carefully and do not try to jump directly in the code. Otherwise, you will end up
hating developing with [Meteorjs][]. Sadly, I prefer developing directly and get the "feel" of the framework rather than
reading countless lines of documentation. I am more comfortable with a framework that is easy to code with (and developer friendly).

[meteorjs]: http://www.meteor.com
