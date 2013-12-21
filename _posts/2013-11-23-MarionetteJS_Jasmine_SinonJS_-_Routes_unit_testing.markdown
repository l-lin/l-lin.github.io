---
layout: post
title:  "MarionetteJS / Jasmine / SinonJS - Routes unit testing"
date:   2013-11-23
tags: [Javascript, JasmineJS, MarionetteJS, SinonJS]
images: [marionettejs.png, jasminejs.png, sinonjs.png]
---

To test [MarionetteJS][marionettejs] routes, it is not as obvious as testing Backbone Models.
This is one way to test routers by using [JasmineJS][jasminejs] and [SinonJS][sinonjs] for mocking purpose.

###Defining the routes

We are going to test a simple `Marionette.AppRouter`.
We will name it `FooRouter` :

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

I use [RequireJS][requirejs] to load modules, but you can also use another loader.
The controller structure is really simple. When the user is browsing to :

* `/#foo`: he will execute the function `showFooList` of the controller
* `/#foo/:id`: he will execute the function `showFoo`
* `/#foo/create`: he will execute the function `createFoo`
* `/#foo/:id/modify`: he will execute the function `modifyFoo`

###Testing

Before rushing to test the router, we must first prepare ourselves.
First and foremost, we need a `Backbone.history` before each test in order to simulate the access to the hash routes.
However, we need to launch it with the option `{silent:true}`. Indeed, since we are doing tests, `Backbone.history` is bound to generate some errors and it will fail our tests.
Of course, we also have to stop `Backbone.history` after each test so that the next test will not have any issue with `Backbone.history`.

{% highlight javascript %}
describe('FooRouter', function() {
    // SET UP TEST --------------------------------------------------------
    beforeEach(function() {
        // ...
        // Create a mock version of our controller
        var FooControllerMock = Marionette.Controller.extend({
            showFooList: function() {},
            createFoo: function() {},
            displayFoo: function() {},
            modifyFoo: function() {}
        });
        // Set up a spy and invoke the router
        this.routeSpy = sinon.spy();
        this.router = new FooRouter({
            controller: new FooControllerMock()
        });
    });
    // ...
});
{% endhighlight %}

**Note:** We could have used [SinonJS][sinonjs] to mock the controller.

To simulate the navigation, we just have to call the function `navigate()` from our router and bind a spy on it:

{% highlight javascript %}
it('can navigate to #foo', function() {
    this.router.bind('route:showFooList', this.routeSpy);
    this.router.navigate('foo', true);
    expect(this.routeSpy.calledOnce).toBeTruthy();
});
{% endhighlight %}

We can now do some more complex tests. This is what I have done:

{% highlight javascript %}
define(['sinon', 'underscore', 'backbone', 'marionette', 'router/FooRouter'], function(sinon, _, Backbone, Marionette, FooRouter) {
    'use strict';

    describe('FooRouter', function() {
        // SET UP TEST --------------------------------------------------------
        beforeEach(function() {
            // Prevent history.start from throwing error
            try {
                Backbone.history.start({
                    silent: true,
                    pushState: true
                });
		    } catch (e) {}
            // Create a mock version of our controller
            var FooControllerMock = Marionette.Controller.extend({
                showFooList: function() {},
                createFoo: function() {},
                viewFoo: function() {},
                modifyFoo: function() {}
            });
            // Set up a spy and invoke the router
            this.routeSpy = sinon.spy();
            this.router = new UserRouter({
                controller: new UserControllerMock()
            });
        });
        afterEach(function() {
            'use strict';
            Backbone.history.stop();
		});

        // TESTS --------------------------------------------------------
        it('should be able to create test objects', function() {
            expect(this.router).toBeDefined();
        });

        describe('has appRoutes that', function() {
            it('has the right amount of routes', function() {
                expect(_.size(this.router.appRoutes)).toEqual(4);
            });

            it('has existing routes and that points to the right method', function() {
                expect(this.router.appRoutes.foo).toEqual('showFooList');
            });

            it('can navigate to #foo', function() {
                this.router.bind('route:showFooList', this.routeSpy);
                this.router.navigate('foo', true);
                expect(this.routeSpy.calledOnce).toBeTruthy();
            });

            it('can navigate to #foo/create', function() {
                this.router.bind('route:createFoo', this.routeSpy);
                this.router.navigate('foo/create', true);
                expect(this.routeSpy.calledOnce).toBeTruthy();
            });

            it('can navigate to #foo/:id', function() {
                this.router.bind('route:viewFoo', this.routeSpy);
                this.router.navigate('foo/123', true);
                expect(this.routeSpy.calledOnce).toBeTruthy();
                expect(this.routeSpy.calledWith('123')).toBeTruthy();
            });

            it('can navigate to #foo/:id/modify', function() {
                this.router.bind('route:modifyFoo', this.routeSpy);
                this.router.navigate('foo/123/modify', true);
                expect(this.routeSpy.calledOnce).toBeTruthy();
                expect(this.routeSpy.calledWith('123')).toBeTruthy();
            });
        });
    });
});
{% endhighlight %}

Happy testing! ;)

[marionettejs]: http://marionettejs.com/
[jasminejs]:    http://pivotal.github.io/jasmine/
[sinonjs]:      http://sinonjs.org
[requirejs]:    http://requirejs.org/
