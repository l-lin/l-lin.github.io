---
title: "Nested directives"
date: 2013-12-30
tags: ["angularjs"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

Sometimes, you need to have nested directives. For example, you need to display an array of an array of items.
With two levels of nested arrays, it is easy to implement such thing.
However, if you need to have a dynamical level of nested arrays, it is not as obvious as implementing two levels of nested arrays.

There are two ways (in my knowledge) to build nested directives.

1. Using the directive `ng-include` and one custom directive
1. Using two custom directives

<!--more-->

# 1 - Using the directive `ng-include` and one custom directive

Let's say, we want to display the given data in nested bullets list:

```json
[{
  name: 'Hello',
  items: [{
    name: 'World',
    items: []
  }, {
    name: 'I am a sub item',
    items: [{
      name: 'I am a sub sub item',
      items: []
    }]
  }]
}, {
  name: 'Foo',
  items: []
}, {
  name: 'Bar',
  items: []
}];
```

First, let's create our `index.html` with a our custom directive. We will name it `items`:

```html
<!DOCTYPE html>
<html ng-app="nestedDirApp">
<head>
  ...
</head>
<body ng-controller="MainCtrl">
  ...
  <items items="items"></items>
  ...
</body>
</html>
```

Then let's create a `directive.js` that contains the code for the custom directive:

```js
angular.module('nestedDirApp').directive('items', function() {
  return {
    restrict: 'E',
    templateUrl: 'items.html',
    scope: {
      items: '='
    }
  };
});
```

* **restrict**: `'E'` to tell angular to match this directive to any HTML tag matching `items`
* **templateUrl**: the template URL of the directive
* **scope**: the scope of the directive

Our template `items.html` looks like this:

```html
<ul>
  <li ng-repeat="item in items" ng-include="'item.html'"></li>
</ul>
```

We use the `ng-include` to include the other template `item.html`.
Moreover, we use `ng-repeat` on the array of items in order to display the bullets list of the items.

Our template `item.html` looks like this:

```html
{{item.name}}
<ul>
  <li ng-repeat="item in item.items" ng-include="'item.html'"></li>
</ul>
```

Again, in this template, we use the directive `ng-include` that points on the same template.

`ng-include` recursively FTW!

That's it! You have your nested directive.

Complete code on [Plnkr][].

# 2 - Using two custom directives

No need to reinvent the wheel, [someone already has found this solution][sebastianblog].

[plnkr]: http://plnkr.co/edit/ekbbtmaCe03rKjbQmwGP?p=info
[sebastianblog]: http://sporto.github.io/blog/2013/06/24/nested-recursive-directives-in-angular/
