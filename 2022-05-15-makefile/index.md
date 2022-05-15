# Makefile



<!--more-->

```make
# command to execute if no argument
default: help

# set default variable
# can be override by setting in argument: make app_name=popo
app_name=foobar
# set a variable from command
project_name=$(shell basename "$(PWD)")
# only set variable if env variable is not already defined
JAVA_HOME?=/opt/java
# stops commandline arguments from changing this variable
override username=admin

# avoid phony rules breaking when a real file has the same name as the command
.PHONY: help
# command example that read the Makefile and print all lines with prefix ##
help: Makefile
	@echo
	@echo " Choose a command run in "$(project_name)":"
	@echo
	@sed -n 's/^##//p' $< | column -t -s ':' |  sed -e 's/^/ /'
	@echo

foobar:
	cat foo > foo.txt
	# @ stops the command from being echoed to stdout
	@cat foo > foo.txt
	# - means that make will keep going even if there is an error
	-@cat foo > foo.txt


file0.txt:
	echo "foo" > file0.txt

# this rule will only run if the file0.txt is newer than file1.txt
file1.txt: file0.txt
	cat file0.txt > file1.txt

# a rule can have multiple targets and multiple prerequisites
all: file0.txt file1.txt

process: file*.txt  #using a wildcard to match filenames
	@echo $^    # $^ is a variable containing the list of prerequisites
	@echo $@    # prints the target name
	@echo $<    # the first prerequisite listed
	@echo $?    # only the dependencies that are out of date
	@echo $+    # all dependencies including duplicates (unlike normal)
```


