---
title: "Unix terminal survival kit"
date: 2018-04-05
imageUrl: "https://images.pexels.com/photos/207580/pexels-photo-207580.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260"
tags: ["terminal"]
categories: ["post"]
comment: true
toc: true
autoCollapseToc: true
contentCopyright: false
---

Do you have to manage a server?

Do you need to perform some actions in bulk?

Do you want impress your peers with a "hacking" skills?

Whatever the reason, it can be much faster to complete some tasks using a Terminal than with graphical applications
and menus. Another benefit is allowing access to many more commands and scripts.

<!--more-->

# Important information

## UNIX representation

In UNIX everything is represented by a process or file. A process is an executing program.
Files are collections of data organized by a directory structure.

Files can be identified by absolute or relative paths. For example:

```bash
/home/user/foobar.txt
./foobar.txt
../foobar.txt
# ~ represents the home directory
~/foobar.txt
# environment variables are represented by a $NAME or ${NAME}
$HOME/foobar.txt
```

## case-sensitive

Everything written in the terminal is case-sensitive. When the command is `ls`, neither `Ls`, `lS` nor `LS` will work.

Files and directories are also case-sensitive, eg `foobar.txt` and `FoObAr.txt` are two different files, even if they are in the same directory.

## Beware of blank spaces

If you want to create/access/delete a file or directory that has a space in its filename, you can either put the whole filename in quotation mark `"`
or escape the space using the backslash `\ `:

```bash
touch "foo bar.txt"
touch foo\ bar.txt
```

## Copy/paste

To copy or paste on the terminal, `ctrl+c` and `ctrl+v` won't work.

Instead, we must use `ctrl+shift+c` and `ctrl+shift+v`.

:warning: `ctrl+c` is used to terminate the program

## Suspending processes

`ctrl+z` will suspend the current process.

Using `fg %1` will resume the job in foreground whereas `bg %1` will resume in background.

To list all suspended jobs, just call `jobs`.

## **man** the hell up

Use `man` whenever you aren't sure about a command or its options...

```bash
# This will display the help page of the command
man ls
```

## Shortcuts

**tab**

Always use the `tab` button to autocomplete your command. It's really useful to prevent any typos. 

**ctrl+r**

"Reverse-i-search" is a shortcut to display a list of commands you have already used. It's based on `history`.

**!!**

Re-execute last command:

```bash
$ echo foobar
foobar
$ !!
foobar
```

**!$**

Execute last command's value:

```bash
$ echo pwd
pwd
$ !$
/home/l-lin
$ !echo
pwd
```

## Navigation

{{< figure class="center" src="https://memegenerator.net/img/instances/81614805/you-know-what-really-grinds-my-gears-when-people-keep-pressing-left-arrow-to-move-the-cursor-back-to.jpg" alt="Please, use keyboard shortcuts" title="Please, use keyboard shortcuts" >}}

{{< figure class="center" src="/images/2018-04-05/keyboard_shortcuts.jpg" alt="Moving efficiently in the CLI" title="Moving efficiently in the CLI" >}}

Credit to [Clément Chastagnol](https://clementc.github.io/blog/2018/01/25/moving_cli/).

Of course, bear in mind these keyboard shortcuts depends on your unix distribution, your shell, your configuration, ...

## Super user VS sudo

There are two ways to run administrative applications:

- run as "super user" (root) with the `su` command
- take advantage of `sudo` (Substitute User DO)

`sudo` allows an user to run a program as another user (most often as the root user).

{{< figure class="center" src="https://imgs.xkcd.com/comics/sandwich.png" alt="Credit to xkcd" title="Credit to xkcd" >}}

```bash
# running apt-get install as root user
sudo apt-get install vim
# starting the nginx service
sudo service nginx start

# connect as nobody user
su - nobody
# connect as nobody user with Bash shell
su - nobody -s /bin/bash
# connect as root user
su
# when you are logged as root user, you don't need to use sudo anymore
apt-get install vim
service nginx start
```

# Basic commands

## File and folder navigation

```bash
# Print Working Directory
pwd

# LiSt directory contents
ls
ls -a
ls folder/
ls $HOME
ls ~

# FIND for files in a directory hierarchy
find -name "*.md"
find ../foobar/ -name "*.md"

# find files by name in the entire filesystem
locate "*.md"
```

## File and directory handling

```bash
# Make Directories
mkdir foo
mkdir -p foo/bar

# change file timestamps
touch foo/bar/foobar.txt

# Change Directory to navigate between directories
cd foo/bar
cd ../..

# CoPy file
cp foo/bar/foobar.txt /tmp
cp /tmp/foobar.txt /tmp/foobar2.txt
cp -r foo/bar /tmp

# Move a file (also used to rename files)
mv foo/bar/foobar.txt /tmp
mv /tmp/foobar.txt /tmp/barfoo.txt

# ReMove file
rm /tmp/barfoo.txt
rm -r foo/bar
rm -rf foo/bar
```

## File content

```bash
# conCATenate files and print on the standard output
cat foo/bar/foobar.txt

# lets you scroll some text
more foo/bar/foobar.txt

# similar to more, but better navigation
less foo/bar/foobar.txt

# SORT lines alphabetically or numerically
sort foo/bar/foobar.txt

# report or omit repeated lines
uniq foo/bar/foobar.txt

# Search for particular text pattern
grep foobar foo/bar/foobar.txt

# Word Count for a text file, printing the number of newlines, words and bytes
wc foo/bar/foobar.txt
```

## Processes handling

```bash
# report a snapshot of the current processes
ps
ps faux # see every process on the system in tree view

# send a signal to a process
kill 12345
kill -9 12345 # force kill
kill -3 12345 # get the java thread dump in the standard output

# display amount of free and used memory in the system
free -h

# display Linux processes
top
```

## Folders definition

```bash
$ # /tmp is a temporary folder where everything is removed when the computer
$ # /tmp can be used as a working directory for programs
$ touch /tmp/this_file_will_be_removed_after_restart

$ # /bin & /sbin contain the binaries usable (e.g. cat, ls, ...) before the /usr partition is mounted
$ ls /bin
chmod grep ls more pwd ....

$ # /usr/bin contains the general system-wide binaries
$ ls /usr/bin
gcc vim vi ruby python ...

$ # /usr/local/bin should be the folder that contains your script/binaries
$ # "local" means it's not managed by the system
$ ls /usr/local/bin
bower node npm tmux ...

$ # $HOME/bin for user-scoped scripts/binaries
$ ls $HOME/bin
img2xterm vault ...

$ # /etc usually contains configuration files for all programs
$ ls /etc
bash.bashrc crontab debconf.version lsb-release os-release

$ # /opt contains third party app package installations which does not complies to the standard Linux file hierarchy
$ ls /opt
google openoffice4

$ # /var contains variable data, e.g. logs, news and so on which is constantly being modified by various programs running in the system
$ ls /var
apt docker log mail ...

$ # /srv contains site-specific data which is served by this system.
$ # This main purpose of specifying this is so that users may find the location of the data files for particular service, and so that 
$ # services which require a single tree for readonly data, writable data and scripts (such as cgi scripts) can be reasonably placed.
$ ls /srv

$ # /home contains the user HOME directories
$ ls /home
l.lin
```

## File and folder permissions

Permissions are managed in three distinct scopes or classes:

- user
- group
- others

### Classes

From [wikipedia](https://en.wikipedia.org/wiki/File_system_permissions#Classes):

> Files and directories are owned by a user. The owner determines the file's user class.
> Distinct permissions apply to the owner.
> 
> Files and directories are assigned a group, which define the file's group class.
> Distinct permissions apply to members of the file's group. The owner may be a member of the file's group.
> 
> Users who are not the owner, nor a member of the group, comprise a file's others class.
> Distinct permissions apply to others.
> 
> The effective permissions are determined based on the first class the user falls within in the order of user,
> group then others. For example, the user who is the owner of the file will have the permissions given to the user
> class regardless of the permissions assigned to the group class or others class.

### Permissions

From [wikipedia](https://en.wikipedia.org/wiki/File_system_permissions#Permissions):

> Unix-like systems implement three specific permissions that apply to each class:
> 
> - The read permission grants the ability to read a file. When set for a directory, this permission grants the 
> ability to read the names of files in the directory, but not to find out any further information about them
> such as contents, file type, size, ownership, permissions.
> - The write permission grants the ability to modify a file. When set for a directory, this permission grants
> the ability to modify entries in the directory. This includes creating files, deleting files, and renaming files.
> - The execute permission grants the ability to execute a file. This permission must be set for executable programs,
> in order to allow the operating system to run them. When set for a directory, the execute permission is interpreted 
> as the search permission: it grants the ability to access file contents and meta-information if its name is known,
> but not list files inside the directory, unless read is set also.

```bash
$ ls -l
-rwxrw-r--  1 foobar l-lin  598 févr. 10 12:07 README.md
# the owner "l-lin" has the permissions "read", "write" and "execute" on the file "README.md"
# the members of the group "foobar" have the permissions "read" and "write" on the file "README.md"
# the other users only have the permission "read" on the file "README.md"
```

From [wikipedia](https://en.wikipedia.org/wiki/File_system_permissions#Numeric_notation):

> Another method for representing Unix permissions is an octal notation. This notation consists of at least 3 digits.
> 
> Each digit represent a different component of the permission: owner, group and others.
> 
> Each digit is the sum of its component bit in the binary numeral system:
> 
> - `read` = 4
> - `write` = 2
> - `execute` = 1
>
> which means:
>
> - 7 = read + write + execute
> - 6 = read + write
> - 5 = read + execute
> - 3 = write + execute

```bash
# change the ownership of the file "README.md" to the group "foobar" and user "l-lin"
chown foobar:l-lin README.md
# change the ownership of the file "README.md" to the group "nobody" but keep the user ownership
chown nobody README.md
# change the ownership of the file "README.md" to the group "nobody" and user "nobody"
# notice the user ownership is set in an implicit way
chown nobody: README.md
# change recursively the ownership of all current files and folders to group "nobody" and user "nobody"
chown -R nobody: ./*

# add the permission "execute" to user, group and other classes
chmod +x README.md
# add the permissions "read" and "write"
chmod +rw README.md
# set the permission to "rwxrw-r--"
chmod 761 README.md
```

:warning: Please, just don't do a `chmod -R 777 *`... for obvious security issues...

## Stdin/Stout

There are three main file descriptors:

- `stdin` is the input from the keyboard
- `stdout` is output 
- `stderr` is the error output

| Type   | Symbol |
| ------ | ------ |
| stdin  | `0<`  |
| stdout | `1>`  |
| stderr | `2>`  |

### stdin

Allows you take standard input from a file:

```bash
cat < README.md
# same as follow:
cat 0< README.md
```

### stdout

```bash
# display the content of the file README.md to the terminal console
cat README.md
# we can redirect the output in a file
cat README.md > foobar.md
# same as follow:
cat README.md 1> foobar.md
```

### stderr

```bash
# display the error "cat: non_existent_file: no file or directory found" to the terminal console
cat non_existent_file
# we can redirect the error output in a file
cat non_existent_file 2> error.log
```

There is a special file on the Linux system called `/dev/null` which can be considered as the "Bin",
but once information has gone to this file, it's gone forever.

```bash
# this will discard all error messages
cat non_existent_file 2> /dev/null
```

### Mixing everything

```bash
# this will print the content of "README.md" to the file "foobar.md" and redirect all error messages to "error.log"
cat < README.md > foobar.md 2> error.log
# this will tell to redirect all error message as the same as stdout, which is "foobar.md" in this case
cat README.md > foobar.md 2>&1
```

### Appending to file

```bash
# append the content of "README.md" to the file "foobar.md"
cat README.md >> foobar.md
```

## Pipes

You can connect two commands together so that the ouput from one program becomes the input of the next program
by using the `|`:

```bash
# print the content of the file "README.md" and filter all lines that contain the word "foobar"
cat README.md | grep foobar
# count the number of lines of the file "README.md"
cat README.md | wc -l
```

## Executing a command within a command

```bash
# this will first find the folders whose name has "foobar" and display its content
ls `find -name foobar`
# same as follow:
ls $(find -name foobar)
```

# Scripting

## VIM

When editing a file in a linux server, you do not have the choice of your favorite GUI notepad or IDE.

You will have to stick with a terminal editor, like vi, vim, nano,...

I have my preference on vim so I will share just a few tips on how to use it without being lost.

First of all, vim has 3 modes:

- `insert` mode: you write text as if in normal text editor
  - use the `i` button to switch to this mode
  - use the `a` button to switch to this mode and move the cursor to the next character
  - use the `o` button to switch to this mode and add a newline
- `normal` mode: provides efficient ways to navigate and manipulate texts
  - use the `Esc` button to switch to this mode
- `visual` mode: select text using movement keys before deciding what to do with it
  - use the `v` button to switch to this mode
  - use the `shift+v` buttons to select lines instead of characters

### VIM movement

In `normal` mode, you can navigate by using the arrow buttons, but vim has been thought for productivity.
So instead of using the arrow buttons, and thus moving your right hand, vim has a set a buttons for which
you won't need to move your palms and be able to reach every functionnalities vim has to offer.

So use the following to navigate in your file:

- `h`: move left
- `j`: move down
- `k`: move up
- `l`: move right

You can also move by words:

- `w`: moves to the start of the next word
- `e`: moves to the end of the word
- `b`: moves to the beginning of the word

If you want to navigate quickly in your file:

- `ctrl+d`: page down
- `ctrl+u`: page up
- `gg`: go to the first line
- `shift+g`: go to the last line
- `<number>g`: go to line <number>
  - `5g`: go to line 5
  - `10g`: go to line 10
- `0`: move cursor to the beginning of the line
- `$`: move cursor to the end of the line
- `*`: find next occurrence of the word under the cursor
- `#`: find previous occurrence of the word under the cursor
- `%`: go to matching parenthesis/brackets

### VIM editing

You don't have to be in `insert` mode to edit text. You can also edit portion of your file in `normal` mode. 

- `x`: delete the character under the cursor
- `X`: delete the character to the left of the cursor
- `r`: replace only one character under the cursor
- `cw`: remove character until the end the word and switch to `insert` mode
- `c$`: remove character until the end of the line and switch to `insert` mode
- `dw`: delete the first word on the right side of the cursor and copies the content
- `dd`: delete the line and copies the content
- `yw`: copy word
- `yy`: copy line
- `p`: paste the copied content
- `.`: repeat the previous command

### Search and replace

Still in `normal` mode:

- `/`: search from top to bottom
- `?`: search from bottom to top

Use `n` and `N` to search next and previous occurrence, respectively.

To replace, you can use the same syntax as `sed` command:

- `:s/wordtoreplace/replacedword/`: only replace the first instance of "wordtoreplace" of the line where the cursor is
- `:%s/wordtoreplace/replacedword/`: apply to the entire file
- `:%s/wordtoreplace/replacedword/g`: apply to all instances

### Other VIM commands

In `normal` mode:

- `:w`: save file
- `:q`: quit file edition
- `:q!`: force quit
- `:wq`: save and quit file edition
- `:x`: save and quit the file edition
- `:set invnumber`: display/hide line numbers
- `:set invpaste`: format/do not format copied content (useful when copy pasting formatted code)

In `insert` mode:

- press the `ctrl+n` for autocompletion

### Undo

You can undo the last action by pressing the `u` button in `normal` mode.

If you want to undo the undo, you can press the `ctrl+r` buttons.

### Going further with VIM

I did not cover everything, only what's needed to be able to perform basic edition on files using VIM.

There are lot of tutorials out there:

- [VIM offial website](http://vimdoc.sourceforge.net/htmldoc/usr_toc.html)
- [VIM wikipedia](http://vim.wikia.com/wiki/Vim_Tips_Wiki)
- [openvim](http://openvim.com/)
- [VIM adventures](https://vim-adventures.com/)
- `:help tutor`: launch VIM own tutorial
- [...](http://bfy.tw/HUUu)

## Writing a SH script

Linux doesn't care about extension. So if your script file name is `foobar.txt`, you can still execute it.

However, it's considered as best practice to have the extension `.sh` for script files.

To run a script file, you cannot just type `script.sh`, you will need to precede the script by the PATH to the script,
ie `/path/to/script.sh`, or if it's in the current directory `./script.sh`.

:warning: Don't forget to add the `execute` permission to your file: `chmod +x /path/to/script.sh`

### Shebang or hashpling #!

We need to tell the script what shell it's going to run under as the user that will execute the script may not use
the shell needed to execute the script.

For example, if we want to force bash, we need to add the following at the first line of the script:

```bash
#!/bin/bash
```

If we want to use another shell, like Korn shell:

```sh
#!/bin/ksh
```

### Exit

The standard way to exit a script file is by returning the number `0`:

```bash
#!/bin/bash
echo "Everything went OK"
exit 0
```

If the script exists with anything other than 0 (a number between 1 and 255), that means there was an error.

### Functions

To declare a function, all you need is to declare like this:

```bash
helloworld() {
    echo "Hello world"
}

# call the function like this:
helloworld
```

### Variables

You can define variables simply like this:

```bash
# use # at the start of the line for comments

# variable name shall be in lower_case (not really mandatory) as to prevent conflicts with environment variables
# which are all in CAPITAL_LETTERS
name=Louis
# call the variable by using "$variable_name" or "${variable_name}"
echo "Hello $name"

# using export will set the environment variable when the script is called
export JAVA_OPTS="-debug"
```

If you want to add a parameter in your function:

```bash
#!/bin/bash

hello() {
    echo "Hello $1"
}

# This will display "Hello "
hello
# This will display "Hello Louis"
hello Louis
```

- `$#`: represents the number of parameters
- `$0`: represents the script filename
- `$1`: represents the first parameter
- `$2`: represents the second parameter
- `$3`: represents the third parameter
- ...

Here a sample script that will display a help message if there are no parameter provided:

```bash
#!/bin/bash
# Simple hello script

# add this to stop the script whenever there is an error
set -e

usage() {
    echo "Usage:   hello [name]"
    echo
    echo "Example: hello Louis"
    echo "         hello Foobar"
}

# check if the content of the first parameter is not empty
if [ -z "$1" ]
then
    usage
    exit 1
fi

# or you can play with the number of parameters
if [ $# -eq 0 ]
then
    usage
    exit 1
fi

echo "Hello $1"

exit 0
```

### Loops

```bash
#!/bin/bash
# simple script to cat every file from current directory

set -e

# loop over sh files
for f in $(ls *.sh)
do
    echo "Display content of $f"
    cat $f
done

exit 0
```

### Unit test

There are tools like [Bash Automated Testing System (or bats)](https://github.com/sstephenson/bats) that can help you test
your scripts.

# Customizing your terminal

You can customize your terminal by editing your `.bashrc`, `.zshrc`, ... to:

- add aliases
- add environment variables
- add plugins
- ...

There are lot of resources out there:

- [oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh) is a good start to customize your terminal
- [dotfiles on github](https://dotfiles.github.io/) list a set of setups you can inspire from for your computer setup
- [my dotfiles](https://github.com/l-lin/dotfiles)

> Your terminal can also feel like $HOME

