---
title: "How to extract folders with history with git"
date: 2018-02-08T10:42:13+01:00
featuredImage: "https://images.pexels.com/photos/51191/stack-letters-letter-handwriting-family-letters-51191.jpeg?w=1260&h=750&auto=compress&cs=tinysrgb"
tags: ["git"]
categories: ["post"]
---

Sometimes at the end of life of a project, one of its sub-project will fly on its own and will have its own lifecycle.

Thus, you will need to extract the folder of the sub-project.

Will a simple copy/paste work? Not so fast, because we will lose the git history of the sub-project.

Git is an awesome tool which has a "magical" command.

<!--more-->

For example, we have a projet called `foobar` with the following tree:

```text
foobar
  |_ foo
  |_ bar
  |_ someotherfolder
```

If I want to extract the 2 sub-folders `foo` and `bar` with their history, we just need to execute the following command:

```bash
git filter-branch --tag-name-filter cat --index-filter 'git rm --cached -qr --ignore-unmatch -- . && git reset -q $GIT_COMMIT -- foo bar' --prune-empty -- --all
```

- `--tag-name-filter cat`: option to fetch the history for their tags
- `--`: separate the `filter-branch` options from the revision options
- `--all`: re-write all branches and tags

