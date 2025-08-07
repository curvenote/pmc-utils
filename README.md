# pmc-utils

Utilities for PMC (PubMed Central) manuscript submissions. This monorepo contains packages for building, validating, and submitting PMC deposits.

## Packages

- **pmc-utils** (`packages/web/`) - Core utilities for PMC metadata and XML generation
- **pmc-node-utils** (`packages/node/`) - Node.js CLI and deposit building tools  
- **pmc-ftp-service** (`packages/ftp-service/`) - SFTP service for PMC submissions

## Development

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

## Release Management

This project uses [changesets](https://github.com/changesets/changesets) for version management and automated releases.

### Making Changes

When making changes that should be released:

1. **Create a changeset**: Run `npm run changeset:add` and follow the prompts
2. **Select packages**: Choose which packages are affected by your changes
3. **Choose version type**: Select patch, minor, or major version bump
4. **Write description**: Provide a clear description of the changes

### Releasing

Releases are automated via GitHub Actions:

- **Pull Requests**: The CI checks for missing changesets
- **Main Branch**: Automated versioning and publishing when changesets are merged
- **Manual Release**: Run `npm run version` to create a version PR, then `npm run publish` to publish

### Available Scripts

- `npm run changeset:add` - Add a new changeset
- `npm run changeset:status` - Check status of changesets
- `npm run changeset:version` - Create version PR
- `npm run publish` - Publish packages to npm

## SFTP server install on GCP

I followed the instructions here exactly: https://stackoverflow.com/questions/63964361/set-up-ftp-in-google-cloud-platform

The only extra step I had to take was, in `/etc/ssh/sshd_config` change `PasswordAuthentication` from `no` to `yes`. Also, to match the PMC deposit folder structure, create the folder `upload` instead of `uploads`.