---
title: "TIL: Enable SwayLock in NixOS"
date: 2024-06-08T08:35:49+02:00
featuredImage: ""
tags: []
categories: ["post"]
toc:
  enable: true
---

Just enabling [SwayLock](https://github.com/swaywm/swaylock) in home-manager is not enough.
After locking your screen, even if you type your correct password, SwayLock will not unlock your screen and
will display the following error message:

```
[pam.c:101] pam_authenticate failed: invalid credentials
```

<!--more-->

I added SwayLock using home-manager, like this:

```nix
# home-manager/swaylock.nix
{ pkgs, ... }: {
  programs.swaylock = {
    enable = true;
  };
};

# home-manager/home.nix
{ ... }: {
  imports = [
    ./swaylock.nix
  ];

  # other configs
}
```

However, after locking my screen, I could not log in again.

It appears SwayLock is not added to `/etc/pam.d` by default (see https://github.com/NixOS/nixpkgs/issues/143365).

So one workaround is to add the following at NixOS system level:

```nix
# nixos/swaylock.nix
{ ... }: {
  security.pam.services.swaylock = {};
}

# nixos/configuration.nix
{ ... }: {
  imports = [
    ./swaylock.nix
  ];

  # other configs
}
```

