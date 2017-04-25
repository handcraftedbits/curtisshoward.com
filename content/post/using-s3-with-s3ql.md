---
date: 2017-04-21T14:41:42-04:00
tags: [ aws, linux, s3 ]
title: Encrypted Shared Storage with S3 and S3QL
---

Recently, I started looking at using [Amazon S3](https://aws.amazon.com/s3/) as a shared storage service instead of
[Dropbox](https://www.dropbox.com), which I have been using for quite some time.  I found S3 appealing
because:<!--more-->

1. It's cheap.  A free Dropbox account gives you `2GB` of space, but if you want, say, `3GB` of space, you'll need to
   sign up for a `1TB` account which costs $8.25 per month.  By comparison, `3GB` of space would cost about 7 cents per
   month on S3.  If you're looking for a reasonable amount of storage, S3 is very affordable.
2. The ecosystem.  There is a massive number of libraries, utilities, and applications that support S3 natively.
3. Encryption at rest.  While I'm sure you can pull this off with Dropbox, because of point 2 there are multiple ways
   to achieve encryption at rest (storing files on disk in an encrypted format), but I'm going to focus on the best one
   I've found, [S3QL](https://bitbucket.org/nikratio/s3ql/).

# What is S3QL?

S3QL is a userspace file system that allows you to mount an S3 bucket (and the equivalent from various competing
services) as a regular UNIX file system.  While S3QL has probably the best performance of any S3 file system, what
really appealed to me is that it handles encryption automatically.  The old standby
[EncFS](https://github.com/vgough/encfs), by comparison, requires you to mount a special encrypted file system on top
of a regular one (i.e., your S3 bucket).  Furthermore, EncFS has a (depending on your viewpoint) major security flaw in
that the number of files, permissions, sizes, etc. are still visible on disk.

The one disadvantage of S3QL is that it keeps file metadata in a local database and syncs it periodically.  Because of
this, you can't mount an S3QL file system more than once.  We can get around that limitation by re-exporting the S3QL
mount directory as a [Samba](https://www.samba.org/) or [NFS](https://en.wikipedia.org/wiki/Network_File_System) share.
What's nice about this approach is that it eliminates another Dropbox disadvantage: the need for a special,
closed-source client application.

# Getting Started

After [installing S3QL](https://bitbucket.org/nikratio/s3ql/wiki/Installation), you have to initialize your S3 bucket
by running `mkfs.s3ql`:

```shell
mkfs.s3ql s3://bucket
```

Note that you should replace `bucket` with the actual name of your bucket.  Follow the prompts.  You'll be asked for:

* Your **backend login**.  This is your AWS **access key ID**.
* Your **backend passphrase**.  This is your AWS **secret access key**.
* Your **encryption password**.  This is the password you're going to use to encrypt the file system.

Next, you'll want to create an authentication info file so S3QL can reference these values when mounting or performing
other operations.  I usually save this file as `/etc/s3ql.authinfo`:

```ini
[s3]
storage-url: s3://bucket
backend-login: aws_access_key_id
backend-password: aws_secret_access_key
fs-passphrase: encryption_password
```

Be sure to use the values from when you ran `mkfs.s3ql`.  Now, we can mount the bucket to a pre-existing directory
named `/mnt/bucket`:

```shell
sudo mount.s3ql --authfile /etc/s3ql.authinfo --allow-other s3://bucket /mnt/bucket
```

Note the `--allow-other` parameter: this is absolutely required if you want users other than `root` to acccess the file
system!

We can umount the file system with `umount.s3ql`:

```shell
sudo umount.s3ql /mnt/bucket
```

# Automatic Mounting and Unmounting

The S3QL [documentation](http://www.rath.org/s3ql-docs/mount.html#automatic-mounting) makes it clear that you shouldn't
put an entry in `/etc/fstab` in order to automatically mount and unmount the file system but that
[systemd](https://www.freedesktop.org/wiki/Software/systemd/) should be used instead.  Unfortunately, the documentation
leaves the `systemd` configuration as an exercise for the reader.  Here's what I've managed to come up with after
consulting a few sources:

```ini
[Unit]
Description=Mount S3 filesystem
Wants=network-online.target
After=network-online.target
[Service]
ExecStart=/usr/bin/mount.s3ql --fg --authfile /etc/s3ql.authinfo --allow-other --cachedir /var/cache/s3ql s3://bucket /mnt/bucket
ExecStop=/usr/bin/umount.s3ql /mnt/bucket
TimeoutStopSec=600
[Install]
WantedBy=multi-user.target
```

A couple important notes about this configuration:

* The `Wants` and `After` items having the same target is not a typo.  What I found is that, without the `After` item,
  the unmounting process would fail because the network would go offline in the middle of uploading metadata.  Adding an
  `After` item made this a sequential process rather than a parallel one (i.e., the network can't go offline until the
  unmounting finishes).
* `TimeoutStopSec` is set to something "reasonable", in my case, 10 minutes.  In practice this is very quick but I don't
  want to take any chances.  If the metadata upload fails, you're likely to lose data.

As mentioned earlier, you'll want to create a Samba or NFS share from your mount directory so you can access the file
system from multiple systems simultaneously.  Once that's done, you'll have a fairly good Dropbox substitute that is
free or very cheap.