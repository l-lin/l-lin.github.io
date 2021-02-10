---
title: "How to migrate SVN projects to Git"
date: 2016-03-07
tags: ["git"]
categories: ["post"]
---

<!--more-->

Create a `users.txt` file. It will be used to map the SVN users to an email.

For example:

```txt
l.lin = Louis LIN <louis.lin@yopmail.com>
foo.bar = Foo BAR <foo.bar@yopmail.com>
```

Execute the following command:

```bash
git svn clone --trunk=/trunk --branches=/branches --tags=/tags --authors-file=users.txt http://<path_to_svn_project> <project_name>
```

It will only create the `master` branch in local.
So you will need to create the tags using the following command:

```bash
git for-each-ref refs/remotes/origin/tags | cut -d / -f 5- | grep -v @ | \
while read tagname; do git tag "$tagname" "origin/tags/$tagname"; git branch -r -d "origin/tags/$tagname"; done
```

You might need to adapt the command a little bit if your branch tags are not called `remotes/origin/tags/<tagname>`.

Then you will need to create the branches using the following command:

```bash
git for-each-ref refs/remotes/origin | cut -d / -f 4- | grep -v @ | \
while read branchname; do git checkout -b "$branchname" "origin/$branchname"; done
```

Finally, add your remote and push all:

```bash
git remote add origin https://<path_to_git_project>
git push --all
git push --tags
```
