![The cat house](http://pixeljoint.com/files/icons/full/sapxong2.gif)

# Getting started

## Installation

```bash
# Clone project.
git clone --recurse-submodules -b blog git@github.com:l-lin/l-lin.github.io "${HOME}/perso/l-lin.github.io"
# Check recipes.
just help
```

## Deployment

The deployment to [https://l-lin.github.io](https://l-lin.github.io) is performed automatically
using the [Github actions](.github/workflows/deploy.yaml) into `main` branch.
