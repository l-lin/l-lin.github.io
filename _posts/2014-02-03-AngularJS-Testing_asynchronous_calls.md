---
layout: post
title:  "Testing asynchronous calls"
date:   2014-02-03
tags: [AngularJS]
images: [angularjs.png]
---

###Testing with callback function
Given the following factory that fetches a `foobar` through a REST call:

{% highlight javascript %}
angular.module('foobarApp').
factory('foobarFactory', function($resource) {
	return {
		getFoobar: function(callback) {
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
		foobarFactory.getFoobar(function(foobar) {
			$scope.foobarId = foobar.id;
		});
	};
});
{% endhighlight %}

To do so, I need to:

* Mock the `foobarFactory` and return a fake when calling the method `getFoobar`

{% highlight javascript %}
spyOn(foobarFactory, 'getFoobar').andCallFake(function(fn) {
    fn(foobar);
});
{% endhighlight %}

* Wait for `foobar` returned by the fake `foobarFactory`

{% highlight javascript %}
waitsFor(function() {
    return foobarFactory.getFoobar.callCount > 0;
}, 'Getting foobar timed out', 650);
{% endhighlight %}

* Test

{% highlight javascript %}
runs(function() {
    expect(scope.foobar.id).toBeDefined();
    expect(scope.foobar.id).toEqual(123);
});
{% endhighlight %}

In the end, this is the final spec:

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
            expect(scope.foobarId).toBeDefined();
    		expect(scope.foobarId).toEqual(123);
        });
    });
});
{% endhighlight %}

###Testing promises
Given the following factory that also fetches a `foobar` through a REST call, but returns a promise:
{% highlight javascript %}
angular.module('foobarApp').
factory('foobarFactory', function($q, $resource) {
    return {
        getFoobar: function() {
            var deferred = $q.defer();
            $resource('/rest/foobar').get(function(foobar) {
                deferred.resolve(foobar);
            });
            return deferred.promise;
        }
    };
});
{% endhighlight %}

I need to test the following controller that depends on `foobarFactory`:

{% highlight javascript %}
angular.module('foobarApp').
controller('foobarCtrl', function($scope, foobarFactory) {
    $scope.foobar = function() {
        foobarFactory.getFoobar().then(function(foobar) {
            $scope.foobarId = foobar.id;
        });
    };
});
{% endhighlight %}

To do so, I need to:

* Create a `foobar` mock

{% highlight javascript %}
var foobarMock = {
    id: 123
};
{% endhighlight %}

* Create a promise that return the previous `foobar` mock

{% highlight javascript %}
var deferred = $q.defer();
deferred.resolve(foobarMock);
{% endhighlight %}

* Mock the `foobarFactory` and return the previous promise
{% highlight javascript %}
spyOn(foobarFactory, 'getFoobar').andReturn(deferred.promise);
{% endhighlight %}

* Test

{% highlight javascript %}
var result;
foobarFactory.getFoobar().then(function(foobar) {
    result = foobar;
});
expect(result).toBeUndefined();
$rootScope.$apply();
expect(foobarFactory.getFoobar).toHaveBeenCalled();
expect(result).toBeDefined();
expect(result).toBe(foobarMock);
{% endhighlight %}

In the end, this is the final spec:

{% highlight javascript %}
describe('foobarCtrl', function() {
    beforeEach(inject(function(foobarApp)));

    // Mock
    var foobarMock = {
            id: 123
        },
        $rootScope, scope, foobarFactory, foobarCtrl;

    beforeEach(inject(function(_$rootScope_, $injector, $controller, $q) {
        $rootScope = $rootScope;
        scope = $rootScope.$new();
        foobarFactory = $injector.get('foobarFactory');
        var deferred = $q.defer();
        deferred.resolve(foobarMock);
        spyOn(foobarFactory, 'getFoobar').andReturn(deferred.promise);
        foobarCtrl = $controller('foobarCtrl', {
            $scope: scope,
            foobarFactory: foobarFactory
        });
    }));

    it('should fetch the foobarId', function() {
        var result;
        foobarFactory.getFoobar().then(function(foobar) {
            result = foobar;
        });
        expect(result).toBeUndefined();
        $rootScope.$apply();
        expect(foobarFactory.getFoobar).toHaveBeenCalled();
        expect(result).toBeDefined();
        expect(result).toBe(foobarMock);
    });
});
{% endhighlight %}