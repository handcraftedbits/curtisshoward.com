---
date: 2019-10-18T21:38:40-04:00
tags: [ ansible, kubernetes ]
title: Multi-document YAML Files and the Ansible k8s Module
---

I've been using [Ansible](https://www.ansible.com) to provision a [Kubernetes](https://kubernetes.io) cluster and I've
found one major problem with the
[`k8s` module](https://docs.ansible.com/ansible/latest/modules/k8s_module.html): it has, until recently, had a complete
inability to handle the sort of multi-document YAML files that are typical of how lots of Kubernetes software is
distributed (the other being [Helm](https://helm.sh) charts).<!--more-->

In the past I've had to resort to using the
[`command` module](https://docs.ansible.com/ansible/latest/modules/command_module.html) to invoke `kubectl` after having
first downloaded the manifest file.  So when I saw that Ansible 2.7 would add a
[`from_yaml_all` filter](https://github.com/ansible/ansible/issues/40684#issuecomment-418584283) to handle these
documents, I was excited to update my roles to use the `k8s` module.

# Not Quite as Advertised

Based on the [GitHub](https://github.com) comment I had seen, I figured it would be rather easy to update my existing
role to install [cert-manager](https://github.com/jetstack/cert-manager)'s
[custom resource definitions](https://github.com/jetstack/cert-manager/blob/release-0.11/deploy/manifests/00-crds.yaml)
via the `k8s` module:

```yaml
- name: install cert-manager custom resource definitions
  k8s:
    definition: "{{lookup('url','<CRD URL>') | from_yaml_all | list}}"
  delegate_to: localhost
```

Ansible didn't care much for this approach:

```sh
fatal: [XXX -> localhost]: FAILED! => {<SNIP...> "module_stderr": "<SNIP...> yaml.parser.ParserError: while parsing a block node\nexpected the node content, but found ','\n  in \"<unicode string>\", line 1, column 1:\n    ,---,apiVersion: apiextensions.k ... \n    ^\n"}
```

It took a bit of searching to figure out what Ansible was complaining about, and it turns out that by default the
[`url` plugin](https://docs.ansible.com/ansible/latest/plugins/lookup/url.html) will return the data fetched from the
URL as one giant, comma-separated string.  Fine, it should be simple enough to fix this by setting the `split_lines`
parameter to `false`:

```yaml
- name: install cert-manager custom resource definitions
  k8s:
    definition: "{{lookup('url','<CRD URL>', split_lines=false) | from_yaml_all | list}}"
  delegate_to: localhost
```

Getting a little further now -- this fails in the `k8s` module instead of the YAML parser:

```sh
fatal: [XXX -> localhost]: FAILED! => {<SNIP...> "module_stderr": "<SNIP...> in execute_module\nAttributeError: 'NoneType' object has no attribute 'get'\n"}
```

After some debugging, it turned out that the list of YAML documents that had been parsed contained some `None` and
`null` values.  But why?  The file seemed perfectly well-formed.  After a couple rounds of "take things out of the file
until it stops failing," I narrowed it down to (as an example)
[this part](https://github.com/jetstack/cert-manager/blob/release-0.11/deploy/manifests/00-crds.yaml#L1780) of the
file:

```
---

---
```

That's two YAML document separators with a blank line in between.  I'm sure the author intended this as a simple way
to more clearly break up the documents in the file and by all accounts a sane YAML parser (like the one `kubectl` uses)
would treat this as a single document separator.  As far as I can tell though, the Python YAML parser interprets the
content between the two separators as an _empty document_, assigning it a `None` value (and sometimes `null`, for
reasons I can't explain).

That explains why the `k8s` module was being fed bad values, so how can we get rid of them?  Fortunately, Ansible has
a [`difference` filter](https://docs.ansible.com/ansible/latest/user_guide/playbooks_filters.html#set-theory-filters)
that can be used to take the difference of two lists.  I created a simple list containing `None` and `null`:

```yaml
empty_list:
  - None
  - null
```

...and then I tacked the `difference` filter onto the end of my `lookup`, in turn filtering out all the `None` and
`null` values:

```yaml
- name: install cert-manager custom resource definitions
  k8s:
    definition: "{{lookup('url','<CRD URL>', split_lines=false) | from_yaml_all | list | difference(empty_list)}}"
  delegate_to: localhost
```

At last, I finally had something that worked, and indeed this seems like the magic incantation you need if you want to
use the `k8s` module with the kind of YAML files that are found in the wild.
