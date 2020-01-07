---
title: "Change in bulk using sed"
date: 2020-01-07T09:33:51+01:00
imageUrl: "https://images.pexels.com/photos/207580/pexels-photo-207580.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260"
tags: ["terminal"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

[`sed`](https://ss64.com/bash/sed.html) is a powerful terminal tool to perform basic text
transformations on an input stream (file or input from a pipeline).

You run the command in "dry-run" to preview the changes the command will perform. But it's quite
difficult to follow the changes if you are running the command recursively in a folder.

In this post, we will what we can use to run `sed` without worrying and with the ability to rollback
in case something went wrong.

<!--more-->

## Using terminal basic commands

There are other powerful tools that can be used along with `sed` to perform the operation in
"dry-run".

First, we need to fetch all file names that needs to be changed. We will be using `find`:

```bash
find /path/to/folder -type f -not -path ".git/*" -name "*.go"
```

Explanation about the arguments:

- `/path/to/folder`: is the folder path in which I want to perform the changes
- `-type f`: only target files, not folders
- `-not -path ".git/*"`: exclude the git folder
- `-name "*.go"`: only target golang files

We want to change the text `text-to-change` into `new-text`. We will use `sed` to perform the change
without overwriting the files:

```bash
sed 's/text-to-change/new-text/g' /path/to/file
```

As we want to check the difference before and after the change, we will use the `diff` command:

```bash
sed 's/text-to-change/new-text/g' /path/to/file | diff -u /path/to/file
```

Iterate to all the targeted files:

```bash
for f in $(find . -type f -not -path ".git/*" -name "*.go"); do sed 's/text-to-change/new-text/g' $f | diff -u $f -; done
```

However, with the previous command, everything will be displayed in your console output, which can
be enormous if you have lots of files that need to be changed. So we will use `less` to "buffer" the
output so that we can follow the change at our own rhythm:

```bash
for f in $(find . -type f -not -path ".git/*" -name "*.go"); do sed 's/text-to-change/new-text/g' $f | diff -u $f - | less; done
```

As you may have notices, by doing this, it's not really helping as it will open a new buffer to read
the difference for each file, which is not really user-friendly.

So, a way is to concatenate all the diff into a temporary file, then use `less` to view the changes
in a single buffer. We will use `mktemp` to create this temporary file.

```bash
tmp_file=$(mktemp) && for f in $(find . -type f -not -path ".git/*" -name "*.go"); do sed 's/text-to-change/new-text/g' $f | diff -u $f - >> $tmp_file; done && less $tmp_file && rm $tmp_file
```

You can also use `colorDiff` to pretty print your output.

Putting all together:

```bash
tmp_file=$(mktemp) && for f in $(find . -type f -not -path ".git/*" -name "*.go"); do sed 's/text-to-change/new-text/g' $f | diff -u $f - >> $tmp_file; done && cat $tmp_file | colordiff | less && rm $tmp_file
```

If you are now sure to change the content, use `sed` with the `-i` flag:

```bash
for f in $(find . -type f -not -path ".git/*" -name "*.go"); do sed -i 's/text-to-change/new-text/g' $f; done
# or you can use xargs
find . -type f -print0 -not -path ".git/*" -name "*.go" | xargs -0 sed -i 's/text-to-change/new-text/g'
```


## Using GIT

Using git is more straightforward:

```bash
# if your folder is not versionned, initialize it with git:
git init
# commit your files BEFORE the operation
git add -A && git commit -m "before the big bang"
# perform your changes in bulk (avoid the .git folder)
find . -type f -print0 -not -path ".git/*" -name "*.go" | xargs -0 sed -i 's/text-to-change/new-text/g'
# check the changes with the following
git diff
# if the result is not satisfactory for a single file
git checkout path/to/the/incorrect/file
# if the result is not satisfactory for a entire folder
git checkout path/to/the/incorrect/folder
# if everything is not satisfactory
git checkout .
# if it's all good, remove the .git folder if your folder is not versionned
rm -rf .git
```
