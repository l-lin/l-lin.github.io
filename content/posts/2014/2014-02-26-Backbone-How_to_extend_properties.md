---
title: "How to extend properties of parent class"
date: 2014-02-26
tags: ["backbonejs"]
categories: ["post"]
---

<!--more-->

A simple example is better than a long speech:

```js
var Tab = Backbone.Model.extend({
    defaults: {
        i18nName: '',
        isCloseable: true,
        isActive: false,
        isNeverActive: false,
        buttonGlyphicon: '',
        hasGlyphicon: false,
        className: ''
    }
});

var PlusTab = Tab.extend({
    defaults: function() {
        var tmp = _.clone(this.constructor.__super__.defaults);
        return _.extend(tmp, {
            i18nName: 'plus',
            buttonGlyphicon: 'glyphicon glyphicon-plus',
            isCloseable: false,
            isNeverActive: true,
            hasGlyphicon: true,
            className: 'plus-tab'
        });
    }
});
```
