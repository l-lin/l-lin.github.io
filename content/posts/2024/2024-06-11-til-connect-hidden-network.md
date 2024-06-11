---
title: "TIL: how to connect to hidden network using command line"
date: 2024-06-11T09:45:33+02:00
featuredImage: ""
tags: ["til"]
categories: ["post"]
toc:
  enable: false
---

It's completely possible to connect to the network using only the command line,
by just using the `nmtui` command.

However, how can we connect to a hidden network, as there are a field `device`
that is needed to be filled?

<!--more-->

First, you will need to create a new connection using `nmtui edit`, then choose `Add`.

Fill your hidden network information (Profile name, SSID, Security, ...).

Once you are done, you only need to call `nmcli con up your_network_name`, and voila,
you are now connected to your hidden network!
