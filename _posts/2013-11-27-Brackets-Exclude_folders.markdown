---
layout: post
title:  "Brackets - Exclude folders"
date:   2013-11-27
tags: [brackets]
images: [brackets.png]
---

[Brackets][brackets] (Spring **34**) has a static list of excluded files and folders. The default ignored files and folders are files like `.gitingore`, `DS_Store`, and so on...
Sadly, this list is hard coded in the source...

If you are like me, i.e. you use [Yeoman][yeoman] when creating new web projects, you will be left with two huge folders (`node_modules` and `bower_components` generated respectively by `NPM` and `bower`).
Those folders contains a lot of files (JS, CSS,...) and most of them are not useful for our project.

Brackets is indexing every files of the opened folder, so when quick-editing (`ctr+e`) a JS function or a CSS class, or when auto-completing (`ctr+space`), Brackets will try to search the given search word in every indexed files.
So you can imagine the performance when you are developing with Brackets...

A quick solution is to exclude those folders from the *scope* of the Brackets work.
Currently, in the Spring 34 of Brackets, it is not possible to exclude files and folders like the **IDE Eclipse**.
Moreover, like I said in the beginning, the list of excluded files and folders is **hard coded**...
So we are left with modifying the source.

If you are using Ubuntu, modify the file `/opt/brackets/www/project/ProjectManager.js` (don't forget to save the file!):

{% highlight bash %}
cd /opt/brackets/www/project
sudo cp ProjectManager.js ProjectManager.BAK
sudo vi /opt/brackets/www/project/ProjectManager.js
{% endhighlight %}

Find the variable `_exclusionListRegEx` and add the regex to exclude the wanted files and folders:

{% highlight javascript %}
var _exclusionListRegEx = /\.pyc$|^\.git$|^\.gitignore$|^\.gitmodules$|^\.svn$|^\.DS_Store$|^Thumbs\.db$|^\.hg$|^CVS$|^\.cvsignore$|^\.gitattributes$|^\.hgtags$|^\.c9revisions|^\.SyncArchive|^\.SyncID|^\.SyncIgnore|^\.hgignore$|^node_modules$|^vendor$|^vendor_ext$|^.tmp$|^dist$/;
{% endhighlight %}

Save the file and restart your Brackets and *Voila*:

![brackets_folders](/images/brackets_folders.png)

**Note**: By doing this *little hack*, my brackets editor performance is boosting! Moreover, [Brackets][brackets] is a great tool for TDD development!

Of course, [Brackets][brackets] still has a long way! But I have faith for this editor.

[brackets]: http://brackets.io
[yeoman]:   http://yeoman.io
