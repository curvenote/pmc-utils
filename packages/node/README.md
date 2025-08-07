# PMC Utils Node Package

A Node.js package for building and validating PMC (PubMed Central) manuscript deposits. This package provides tools for creating properly formatted PMC submission packages, including manifest generation, XML validation, and archive creation.

## Features

- Build PMC deposit packages from manifest files
- Generate PMC-compliant manifest text files
- Validate XML against PMC DTD specifications
- Create tar.gz archives for submission
- Support for multiple file types (manuscripts, figures, tables, supplements)
- Local file system integration

## Prerequisites

- Node.js (v16 or higher)
- `xmllint` command-line tool for XML validation
  - On macOS: `brew install libxml2`
  - On Ubuntu/Debian: `apt-get install libxml2-utils`
  - On Windows: Install via [Chocolatey](https://chocolatey.org/) or [MSYS2](https://www.msys2.org/)

## Installation

```bash
npm install pmc-utils
```

## Usage

### Building a PMC Deposit

```typescript
import { buildDeposit } from 'pmc-utils';

const manifest = {
  taskId: 'example-task-123',
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
        grantId: 'R01-123456'
      }
    ]
  },
  files: [
    {
      type: 'manuscript',
      filename: 'manuscript.pdf',
      path: './manuscripts',
      storage: 'local'
    },
    {
      type: 'figure',
      label: 'fig1',
      filename: 'figure1.png',
      path: './figures',
      storage: 'local'
    }
  ]
};

const options = {
  output: './deposits',
  keepFiles: false,
  log: console
};

try {
  const tarFile = await buildDeposit(manifest, options);
  console.log(`Deposit package created at: ${tarFile}`);
} catch (error) {
  console.error('Error creating deposit:', error);
}
```

### Manifest File Format

The package generates a manifest file in the following format:
```
<file_type> <label> <file_name>
```

File types supported:
- `bulksub_meta_xml`: Required metadata file
- `manuscript`: Manuscript text file(s)
- `figure`: Figure file
- `table`: Table file
- `supplement`: Supplementary material file

## Development

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

## API Reference

### `buildDeposit(manifest: AAMDepositManifest, opts: BuildDepositOptions)`

Builds a complete PMC deposit package from a manifest object.

Options:
- `output`: Directory for output files (default: 'deposits')
- `keepFiles`: Whether to keep temporary files (default: false)
- `log`: Logger instance (default: console)

### `preparePMCManifestText(manifest: AAMDepositManifest)`

Generates the manifest text file content for a PMC deposit.

### `validateXml(xml: string)`

Validates XML content against the PMC DTD specification.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Released under the MIT License](./LICENSE)
