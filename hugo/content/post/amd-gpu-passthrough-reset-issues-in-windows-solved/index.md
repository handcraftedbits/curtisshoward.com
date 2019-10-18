---
date: 2017-01-30T15:44:10-05:00
tags: [ amd, esxi, virtualization, windows ]
title: AMD GPU Passthrough Reset Issues in Windows -- Solved!
---

In a [previous post]({{< ref "/post/fixing-amd-gpu-passthrough-reset-issues-in-windows" >}}) I explored a method to
pass through an [AMD](http://www.amd.com) GPU to an [ESXi](http://www.vmware.com/products/vsphere-hypervisor.html)
Windows guest that involves running batch scripts to enable and disable the GPU automatically.<!--more-->

After purchasing an [RX 480](http://www.amd.com/en-us/products/graphics/radeon-rx-series/radeon-rx-480), I'm happy to
report that the [PCIe bus reset issue plaguing AMD GPUs](http://lists.nongnu.org/archive/html/qemu-devel/2014-12/msg00192.html)
has been fixed in the [Polaris architecture](http://www.amd.com/en-gb/innovations/software-technologies/radeon-polaris)
that the RX 480 belongs to.

Even though buying a new GPU to fix this issue seems a bit extreme, it's honestly the best way to go.  At its best, the
method I outlined in the previous post can be flaky, resulting in an unresponsive VM due to inadvertent resets not
being followed with the shutdown scripts being run.
