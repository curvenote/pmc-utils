# PMC Utils Web Package

A TypeScript package providing utilities for working with PubMed Central (PMC) metadata and manuscript submissions.

## Features

- DOI metadata lookup via Crossref API
- PMC manuscript submission XML generation
- Type definitions for PMC-related data structures
- Validation utilities for PMC-specific fields (funders, ISSN types)
- Schema definitions for Crossref and PMC manifest formats

## Installation

```bash
npm install pmc-utils
```

## Usage

### Looking up DOI Metadata

```typescript
import { lookupMetadata } from 'pmc-utils';

const metadata = await lookupMetadata('10.1234/example.doi');
console.log(metadata);
```

### Generating PMC Submission XML

```typescript
import { pmcXmlFromManifest } from 'pmc-utils';

const manifest = {
  doi: '10.1234/example.doi',
  agency: 'example-agency',
  metadata: {
    title: 'Example Manuscript',
    authors: [
      {
        fname: 'John',
        lname: 'Doe',
        email: 'john@example.com',
        contactType: 'reviewer'
      }
    ],
    journal: {
      issn: '1234-5678',
      issnType: 'electronic',
      title: 'Example Journal'
    },
          grants: [
      {
        funder: 'NIH',
        id: 'R01-123456'
      }
    ]
  }
};

const xml = pmcXmlFromManifest(manifest);
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### TypeScript

This package is written in TypeScript and includes type definitions. The source code is in the `src` directory, and the compiled JavaScript is output to the `dist` directory.

## API Reference

### `lookupMetadata(doi: string, opts?: { fetch: FetchLike; log: Logger })`

Retrieves metadata for a given DOI from Crossref.

### `pmcXmlFromManifest(manifest: AAMDepositManifest): string`

Generates PMC submission XML from a manifest object.

### Types

- `AAMDepositManifest`: Interface for PMC manuscript submission manifest
- `PMCFunder`: Type for valid PMC funder identifiers
- `PMCISSNType`: Type for valid ISSN types

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Released under the MIT License](./LICENSE)
