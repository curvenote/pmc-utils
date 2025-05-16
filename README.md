# pmc-utils

Run a faux web application using the `pmc-web` client code

```
npm install
npm run dev
```

Given a manifest use the CLI to create a deposit `.tar.gz` file

```
npm install
npm run dev
pmc build-deposit deposits/job/task-1234/manifest.json
```

## SFTP client install on mac

You can connect via CLI on mac with SFTP client:

```
brew install inetutils
```

To connect to your local server:

```
sftp curvenote@34.82.165.84
```

It should prompt for password, then successfully connect.

## SFTP server install on GCP

I followed the instructions here exactly: https://stackoverflow.com/questions/63964361/set-up-ftp-in-google-cloud-platform

The only extra step I had to take was, in `/etc/ssh/sshd_config` change `PasswordAuthentication` from `no` to `yes`. Also, to match the PMC deposit folder structure, create the folder `upload` instead of `uploads`.