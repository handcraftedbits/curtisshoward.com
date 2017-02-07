---
date: 2016-12-15T13:38:34-04:00
tags: [ windows ]
title: Disabling Automatic Updates in Windows 10
---

Windows 10 has a fairly aggressive automatic update policy and the knobs and levers required to change it are
well-hidden.  While I think this is a good idea for average consumers, it frequently causes problems with my VM that
includes GPU passthrough -- automatic update restarts seem to bypass the scripts that disable the GPU upon shutdown
and problems ensue.<!--more-->

Here's what I've been doing to disable automatic updates and restarts -- but note that these steps only work in Windows
10 Professional or higher editions:

# Changing Automatic Update Behavior

Open the _Local Group Policy Editor_ by running `gpedit.msc`.  Then, navigate to `Local Computer Policy` >
`Computer Configuration` > `Administrative Templates` > `Windows Components` > `Windows Update` and select `Configure 
Automatic Updates`.  Select the `Enabled` radio button and choose the desired behavior from the `Options` dropdown.
I usually select `2 - Notify for download and notify for install`.

# Disabling Automatic Restarts

In the same section of the _Local Group Policy Editor_, select `No auto-restart with logged on users for scheduled
automatic updates installations` and then select the `Enabled` radio button.
