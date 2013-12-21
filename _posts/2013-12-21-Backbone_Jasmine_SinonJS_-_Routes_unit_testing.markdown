---
layout: post
title:  "Backone/Jasmine/SinonJS - Routes unit testing"
date:   2013-11-23 13:44:05
categories: javascript
---

To test [MarionetteJS][marionettejs] routes, it is not as obvious as testing Backbone Models.
This is one way to test routers by using [JasmineJS][jasminejs] and [SinonJS][sinonjs] for mocking purpose.

# Defining the routes

We are going to test a simple *Marionette.AppRouter*.
We will name it *FooRouter* :

{% highlight javascript %}
define(['backbone'], function(Backbone) {
    'use strict';

    var FooRouter = Backbone.Marionette.AppRouter.extend({
        appRoutes: {
            'foo': 'showFooList',
            'foo/:id': 'viewFoo',
            'foo/create': 'createFoo',
            'foo/:id/modify': 'modifyFoo'
        }
    });

    return FooRouter;
};
{% endhighlight %}

I am using [RequireJS][requirejs] to load modules, but you can also use another loader.
The controller structure is really simple. When the user is browsing to :
* */#foo*: he is goin to execute the function *showFooList* of the controller

J'utilise RequireJS pour loader mes modules, mais vous pouvez également utiliser d'autre loader comme CommonJS.
La structure du controller est très simple. Lorsque l'utilisateur navigue :
vers /#foo : il va exécuter la méthode showFooList du controller, associé au router, qui va permettre d'afficher la page de la liste des foo
vers /#foo/:id : il va exécuter la méthode showFoo qui va permette d'afficher la page de visualisation d'un foo ayant l'ID id défini dans le hastag route
vers /#foo/create : il va exécuter la méthode createFoo du controller qui va permettre d'afficher la page de création d'un foo
vers /#foo/:id/modify : il va exécuter la méthode modifyFoo qui va permette d'afficher la page de modification d'un foo ayant l'ID id défini dans le hastag route


[marionettejs]: http://marionettejs.com/
[jasminejs]:    http://pivotal.github.io/jasmine/
[sinonjs]:      http://sinonjs.org
[requirejs]:    http://requirejs.org/

Pour tester des Routers de MarionetteJS, c'est moins évident que de tester un Model Backbone.
Voici une façon de faire pour tester les routes en utilisant JasmineJS pour faire les test et SinonJS pour mocker.

You'll find this post in your `_posts` directory - edit this post and re-build (or run with the `-w` switch) to see your changes!
To add new posts, simply add a file in the `_posts` directory that follows the convention: YYYY-MM-DD-name-of-post.ext.

Jekyll also offers powerful support for code snippets:

{% highlight javascript %}
var foo = functin foo() {
    console.log('foo');
};
{% endhighlight %}

azda

{% highlight ruby %}
def print_hi(name)
  puts "Hi, #{name}"
end
print_hi('Tom')
#=> prints 'Hi, Tom' to STDOUT.
{% endhighlight %}

Check out the [Jekyll docs][jekyll] for more info on how to get the most out of Jekyll. File all bugs/feature requests at [Jekyll's GitHub repo][jekyll-gh].

[jekyll-gh]: https://github.com/mojombo/jekyll
[jekyll]:    http://jekyllrb.com
