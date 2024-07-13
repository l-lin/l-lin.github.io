set quiet

# display help
help:
  just --list

# start local web server
serve:
  just info "Start local web server."
  npm i
  npx quartz build --serve

# update quartz
update:
  npx quartz update

# ----------------------------------------------------------------------

BLUE := '\033[1;30;44m'
YELLOW := '\033[1;30;43m'
RED := '\033[1;30;41m'
NC := '\033[0m'

[private]
info msg:
  echo -e "{{BLUE}} I {{NC}} {{msg}}"

