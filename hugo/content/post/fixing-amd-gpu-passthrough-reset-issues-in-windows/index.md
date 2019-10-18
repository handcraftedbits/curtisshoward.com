---
date: 2016-12-18T18:24:02-04:00
tags: [ amd, esxi, virtualization, windows ]
title: Fixing AMD GPU Passthrough Reset Issues in Windows
---

If you've managed to pass through an [AMD](http://www.amd.com) GPU to a Windows guest in
[ESXi](http://www.vmware.com/products/vsphere-hypervisor.html) you may notice that the VM will fail to start after
performing a reset.  This is because AMD GPUs [have issues with the kind of PCIe bus reset that hypervisors
perform](http://lists.nongnu.org/archive/html/qemu-devel/2014-12/msg00192.html), which in turn causes issues with the
AMD GPU driver.  <!--more-->There are two things you can do in this situation:

* Restart the host (i.e., your ESXi server).
* Disable your GPU before restarting your Windows VM.

Since the first option isn't really appealing, we'll cover an automated method to disable your GPU prior to restarting
the VM and (for the sake of convenience) enabling the GPU immediately after it boots.

# Introducing DevCon

[Windows Device Console](https://msdn.microsoft.com/en-us/library/windows/hardware/ff544707(v=vs.85).aspx), or DevCon,
allows you to perform various operations on your devices from the Windows command line, which makes it just the tool we
need to automate enabling and disabling our GPU.

To get DevCon you need to download the [Windows Driver
Kit](https://developer.microsoft.com/en-us/windows/hardware/windows-driver-kit), which means you have to download and
install a fairly large development kit just to get your hands on `devcon.exe`.  An alternate method involves
installing DevCon via [Chocolatey](https://chocolatey.org):

```batch
choco install devcon.portable
```

This method will install `devcon32.exe` and `devcon64.exe` binaries which should be used on 32-bit and 64-bit Windows
installations, respectively.  To keep things simple we'll refer to the binary as `devcon.exe` for the remainder of this
article.

# Using DevCon to Enable and Disable Devices

Disabling and Enabling devices is as simple as running the following from an **administrative** command prompt:

```batch
devcon.exe enable|disable "<device_id>"
```

Where `<device_id>` is the device's _hardware ID_, accessible via the Device Manager by

1. Selecting the device
2. Right-clicking and selecting `Properties`
3. Selecting the `Details` tab
4. Selecting `Hardware Ids` from the `Property` dropdown

For example, here's what's listed for my AMD GPU:

{{< image src="image/gpu-hardware-ids.png" caption="AMD GPU Harware IDs" >}}

There's quite a few hardward IDs listed -- which one(s) should be used?  Fortunately, DevCon simplifies things for us
by allowing wildcards.  What I typically do is include enough of the hardware ID to capture the vendor and device ID
and use a wildcard for the rest.  So for the example listed above, I would disable my GPU by running

```batch
devcon.exe disable "PCI\VEN_1002&DEV_6938*"
```

and enable it by running

```batch
devcon.exe enable "PCI\VEN_1002&DEV_6938*"
```

# Enabling and Disabling the GPU Automatically

You probably don't want to run DevCon manually every time you start and shutdown your VM, so let's create batch files
named `enable.bat` and `disable.bat` that contain the "enable" and "disable" commands from the previous section.

Next, open the _Local Group Policy Editor_ by running `gpedit.msc`.  Then, navigate to `Local Computer Policy` >
`Computer Configuration` > `Windows Settings` > `Scripts (Startup/Shutdown)` and select `Startup`.  Click the `Add`
button and select your `enable.bat` script.  Repeat this process for your `disable.bat` script via the `Shutdown` item
in the `Scripts (Startup/Shutdown)` section.

Now, you should be set as far as _user-initiated_ resets of your VM is concerned -- you shouldn't have any issues with
your VM failing to start whenever you explicitly reset your VM.  I have noticed however, that restarts due to Windows
Update still seem to cause issues, perhaps because these scripts aren't run.  You'll probably want to [disable
automatic updates]({{< ref "/post/disabling-automatic-updates-in-windows-10" >}}) in order to prevent these unwanted
reboots from happening.
