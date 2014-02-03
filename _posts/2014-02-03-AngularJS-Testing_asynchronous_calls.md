---
layout: post
title:  "Testing asynchronous calls"
date:   2014-02-03
tags: [AngularJS]
images: [angularjs.png]
---

Given the following factory that fetches a `foobar` through a REST call:

{% highlight javascript %}
angular.module('foobarApp').
factory('foobarFactory', function($resource) {
	return {
		getFooBar: function(callback) {
			$resource('/rest/foobar').get(function(foobar) {
				callback(foobar);
			});
		}
	};
});
{% endhighlight %}

I need to test the following controller that depends on `foobarFactory`:

{% highlight javascript %}
angular.module('foobarApp').
controller('foobarCtrl', function($scope, foobarFactory) {
	$scope.foobar = function() {
		foobarFactory.getFooBar(function(foobar) {
			$scope.foobarId = foobar.id;
		});
	};
});
{% endhighlight %}

To do so, I need to:
* Mock the `foobarFactory` and return a fake when calling the method `getFooBar`

{% highlight javascript %}
spyOn(foobarFactory, 'getFooBar').andCallFake(function(fn) {
    fn(foobar);
});
{% endhighlight %}

* Wait for `foobar` returned by the fake `foobarFactory`

{% highlight javascript %}
waitsFor(function() {
    return foobarFactory.getFooBar.callCount > 0;
}, 'Getting foobar timed out', 650);
{% endhighlight %}

* Test

{% highlight javascript %}
runs(function() {
    expect(scope.foobar.id).toBeDefined();
    expect(scope.foobar.id).toEqual(123);
});
{% endhighlight %}

So in the end, it gives the following spec:

{% highlight javascript %}
describe('foobarCtrl', function() {
	beforeEach(inject(function(foobarApp)));

    // Mock
    var foobarMock = {
        	id: 123
        },
        scope, foobarFactory, foobarCtrl;

    beforeEach(inject(function($rootScope, $injector, $controller) {
        foobarFactory = $injector.get('foobarFactory');
        spyOn(foobarFactory, 'getFoobar').andCallFake(function(fn) {
            fn(foobarMock);
        });
        scope = $rootScope.$new();
        foobarCtrl = $controller('foobarCtrl', {
        	$scope: scope,
        	foobarFactory: foobarFactory
    	});
    }));

    it('should fetch the foobarId', function() {
        waitsFor(function() {
            return foobarFactory.getFoobar.callCount > 0;
        }, 'Getting foobar timed out', 650);
        runs(function() {
            expect(scope.foobar.id).toBeDefined();
    		expect(scope.foobar.id).toEqual(123);
        });
    });
});
{% endhighlight %}