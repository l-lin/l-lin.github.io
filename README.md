# l-lin.github.io

![The cat house](http://pixeljoint.com/files/icons/full/sapxong2.gif)

## Getting started

```bash
# Clone project.
git clone --recurse-submodules git@github.com:l-lin/l-lin.github.io "${HOME}/perso/l-lin.github.io"
# Check recipes.
just help
```

The content are stored in another repository: https://github.com/l-lin/technical-notes.

## Deployment

The deployment to [https://l-lin.github.io](https://l-lin.github.io) is performed automatically
using the [Github actions](.github/workflows/deploy.yaml) into `main` branch.

## Changes performed on Quartz

In order to be able to easily update [Quartz](https://github.com/jackyzha0/quartz), I should not customize heavily the layout.

However, there are some changes I needed to make to make the website more to my taste and work for my workflow:

- [704674ee](https://github.com/l-lin/l-lin.github.io/commit/704674ee966cbc989f06f37beaafb86edddd594f): add recent notes
- [6d06787e](https://github.com/l-lin/l-lin.github.io/commit/6d06787e66b6d24dda67fbd9e820a3102fd5c7c3): do not display note title
- [8685f45a](https://github.com/l-lin/l-lin.github.io/commit/8685f45a37bbf228b8526e4bc181107db1e0599b): do not add hyphen
- [7860b9f9](https://github.com/l-lin/l-lin.github.io/commit/7860b9f9d5fc2df4f3fd13010647b0f0720b79ab): display [FontAwesome](https://fontawesome.com/) icons in footer links

