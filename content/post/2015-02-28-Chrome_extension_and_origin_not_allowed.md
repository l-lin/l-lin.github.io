---
title: "Chrome extension and 'Access-Control-Allow-Origin'"
date: 2015-02-28
imageUrl: "/images/chrome.png"
tags: ["chrome"]
categories: ["tips-and-tricks"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

<!--more-->

When developing chrome extensions, I wanted to use the `XMLHttpRequest` like this:

```js
var xhr = (function() {
    var xhr = new XMLHttpRequest();
    return function(method, url, callback) {
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                callback(xhr.responseText, xhr.status);
            }
        };
        xhr.open(method, url);
        xhr.send();
    };
})();

xhr('GET', 'https://foobar.com', function(data, status) {
    // Some stuff
});
```

However, just doing that does not work. You will receive the following error:

```text
XMLHttpRequest cannot load https://foobar.com. The 'Access-Control-Allow-Origin' header has a value 'https://foobar.com' that is not equal to the supplied origin. Origin 'chrome-extension://azertyuiopqsdfghjklm' is therefore not allowed access.
```

The only thing you need to do is to modify your `manifest.json` and add the correct permissions:

```json
{
    "permissions": [
        "https://foobar.com/**/*",
    ]
}
```
