default: help

PROJECTNAME=$(shell basename "$(PWD)")

## serve: serve website locally
serve:
	@hugo serve

## new-post: create new post
new-post:
	@if [ -z ${NAME} ]; then \
		echo 'Missing `NAME` argument, usage: `make new-post NAME=<name>`' >/dev/stderr && exit 1; \
	fi
	@hugo new content/posts/$(shell date +%Y)/$(shell date +%Y-%m-%d)-${NAME}.md

# --------------------------------------------------------------------------

.PHONY: help
all: help
help: Makefile
	@echo
	@echo " Choose a command run in "$(PROJECTNAME)":"
	@echo
	@sed -n 's/^##//p' $< | column -t -s ':' |  sed -e 's/^/ /'
	@echo
