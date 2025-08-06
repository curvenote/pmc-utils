# PMC FTP Service - Cloud Run Deployment

This directory contains the Cloud Run deployment configuration for the PMC FTP service.

## Environment Configuration

### Setup

1. **Copy the sample environment file:**
   ```bash
   cp .env.sample .env
   ```

2. **Edit `.env` with your actual values:**
   ```bash
   # Required for deployment
   GCP_PROJECT=your-gcp-project-id
   FTP_HOST=your-sftp-host
   FTP_USERNAME=your-username
   FTP_PASSWORD=your-password
   
   # Optional configuration
   FTP_PORT=22
   STREAM_BUFFER_KB=256
   GCP_REGION=us-central1
   PORT=8080
   ```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `FTP_HOST` | SFTP server hostname | - | ✅ |
| `FTP_PORT` | SFTP server port | 22 | ❌ |
| `FTP_USERNAME` | SFTP username | - | ✅ |
| `FTP_PASSWORD` | SFTP password | - | ✅ |
| `STREAM_BUFFER_KB` | Download buffer size (KB) | 256 | ❌ |
| `GCP_PROJECT` | Google Cloud project ID | - | ✅ (for deployment) |
| `GCP_REGION` | Google Cloud region | us-central1 | ❌ |
| `PORT` | Local development port | 8080 | ❌ |

## Scripts

### `./local.sh`
**Local Development & Testing**

Builds the FTP service, copies assets, creates Docker image, and runs locally:

```bash
./local.sh
```

Features:
- Automatically loads environment variables from `.env`
- Builds latest FTP service code
- Creates local Docker image (`pmc-ftp-local`)
- Runs container with proper environment configuration
- Includes helpful setup instructions if `.env` is missing

### `./deploy-env.sh`
**Production Deployment with Environment Variables**

Deploys to Google Cloud Run using environment variables:

```bash
./deploy-env.sh
```

Features:
- Validates required environment variables
- Uses `.env` file for configuration
- Deploys with proper Cloud Run settings
- Error handling for missing configuration

### Legacy Scripts

- `./deploy.sh` - Original deployment script with hardcoded values
- `./build.sh` - Docker image build script
- `./run.sh` - Basic container run script

## Workflow

### Local Development
1. Set up environment: `cp .env.sample .env && edit .env`
2. Build and run: `./local.sh`
3. Test your changes locally
4. Commit your code changes (`.env` is gitignored)

### Deployment
1. Ensure `.env` is configured with production values
2. Deploy: `./deploy-env.sh`

## Security Notes

- ✅ `.env` files are gitignored and never committed
- ✅ Use `.env.sample` to document required variables
- ✅ Environment variables are loaded at runtime
- ✅ Production secrets stay out of the repository

## Buffer Size Configuration

The `STREAM_BUFFER_KB` variable controls memory usage vs performance:

- **64KB**: Memory-constrained environments
- **256KB**: Balanced default (recommended)
- **512KB**: High-performance storage
- **1MB**: Large files, fast network/storage