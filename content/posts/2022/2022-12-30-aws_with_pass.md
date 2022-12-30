---
title: "AWS CLI with Unix password manager"
date: 2022-12-30T19:18:27+01:00
featuredImage: ""
tags: []
categories: ["post"]
toc:
  enable: false
---

<!--more-->

```bash
$ # first create gpg key
$ gpg --full-generate-key

$ # fetch gpg key id
$ gpg --list-key
/home/foobar/.gnupg/pubring.kbx
------------------------------
pub   rsa3072 2022-12-30 [SC]
      ABC <-- this is the id
uid           [ultimate] Foo <foo@bar.ee>
sub   rsa3072 2022-12-30 [E]

$ # init pass
$ pass init <gpg_id>

$ # insert AWS creds in pass
$ pass -m aws/default
{
  "Version": 1,
  "AccessKeyId": "ABC",
  "SecretAccessKey": "XYZ"
}

$ # configure aws
$ cat <<EOF>> ~/.aws/credentials
[default]
credential_process = /usr/bin/pass aws/default
EOF

$ # use aws cli as usual
$ aws s3 ls
```

## Resources

- https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sourcing-external.html
- https://www.passwordstore.org/
- https://vitalyparnas.com/guides/pass/

