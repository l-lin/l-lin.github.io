---
title: "TIL: SSH on a newly installed NixOS VM"
date: 2024-06-07T17:47:33+02:00
featuredImage: ""
tags: ["til", "nixos"]
categories: ["post"]
toc:
  enable: true
---



<!--more-->

After installing NixOS on a VM, you can configure SSH like this:

On `/etc/nixos/configuration.nix`:

```nix
import [
  ./ssh.nix
  # ...
];
# Ensure flake is enabled
```

and `/etc/nixos/ssh.nix`:

```nix
{ ... }: {
  services.openssh = {
    enable = true;
    settings = {
      AllowUsers = [ "your-user" ];
      # Add
      PasswordAuthentication = true;
      PermitRootLogin = "yes";
    };
  };
}
```

then apply the change:

```bash
sudo nixos-rebuild switch --flake .
```

Then from home, you can log in as your user, and you should be able to SSH as your user.

It's quite useful, especially if you want to copy/paste some stuff from host to VM.
