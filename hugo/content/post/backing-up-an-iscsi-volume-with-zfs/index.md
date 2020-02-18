---
date: 2020-02-17T21:23:09Z
tags: [ aws, freenas, s3, zfs ]
title: Backing Up an iSCSI Volume with ZFS
---

While setting up an instance of [PostgreSQL](https://www.postgresql.org/) on my home
[Kubernetes](https://kubernetes.io/) cluster, the issue of how to create a proper persistent volume came up.  I wanted
to use network-based storage for the pod primarily because I use [FreeNAS](https://www.freenas.org/) and backing up the
volume to [S3](https://aws.amazon.com/s3/) using a
[Cloud Sync Task](https://www.ixsystems.com/documentation/freenas/11.3-RELEASE/tasks.html#cloud-sync-tasks) would be
trivially easy.  Right away I ruled out using NFS for PostgreSQL storage over reliability and performance concerns, so
that left iSCSI.  But, in order to get the best performance out of an iSCSI volume I had to use a zvol (device) instead
of a file, which meant that Cloud Sync Tasks couldn't be used.<!--more-->

As it turns out, ZFS makes it rather easy to create a file out of a zvol using snapshots and `zfs send`.  The idea here
is to create a `cron` task that:

* Creates a snapshot of the iSCSI zvol
* Compresses the snapshot
* Sends the compressed snapshot to a backup service (in my case, [S3](https://aws.amazon.com/s3)).
* Deletes the snapshot

This was implemented in a fairly simple Bash script:

```sh
#!/bin/sh

bucket_url=s3://$2
snapshot_name=$1@$(date +%Y-%m-%d)

echo "Creating snapshot $snapshot_name..."

zfs snapshot $snapshot_name

echo "Sending to S3 URL ${bucket_url}..."

zfs send -v $snapshot_name | gzip | jexec ioc-backup-s3 aws s3 cp - $bucket_url/${snapshot_name}.gz

echo "Deleting snapshot..."

zfs destroy $snapshot_name
```

Since you can't (easily) install third-party software into your FreeNAS installation (nor should you, really), I had to
create a simple jail with the AWS CLI and my credentials (named `backup-s3`) that I use as a `zfs send` target in order
to push the backup to S3.  The S3 bucket is configured to delete backups after a certain amount of time, ensuring that
the bucket doesn't grow endlessly.
