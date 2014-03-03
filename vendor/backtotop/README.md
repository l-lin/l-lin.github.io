Back to top [![Build Status](https://travis-ci.org/l-lin/backtotop.png?branch=master)](https://travis-ci.org/l-lin/backtotop) [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)
================

> Back to top button shown as you scroll down

Getting started
================
Dependencies
----------------
The required dependencies are:

* [jQuery](http://jquery.com/)
* [Font Awesome](http://fortawesome.github.io/Font-Awesome/)

Download
----------------
### Manually
The files can be downloaded from:

* Minified [JS](https://github.com/l-lin/backtotop/dist/backtotop.min.js) and [CSS](https://github.com/l-lin/backtotop/dist/backtotop.min.css) for production usage
* Un-minified [JS](https://github.com/l-lin/backtotop/dist/backtotop.js) and [CSS](https://github.com/l-lin/backtotop/dist/backtotop.css) for development

Installation
----------------
Include the JS and CSS file in your index.html file: 

```html
<link rel="stylesheet" href="backtotop.min.css">
<script src="backtotop.min.js"></script>
```

Usage
================
You must initialize the module by calling the <code>init</code> function of the module:

```javascript
backToTop.init({
	theme: 'classic', // Available themes: 'classic', 'sky', 'slate'
	animation: 'fade' // Available animations: 'fade', 'slide'
});
```

Demo
================
See [Live Demo](http://l-lin.github.com/backtotop).

License
================
[MIT License](http://en.wikipedia.org/wiki/MIT_License)
