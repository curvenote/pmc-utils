#!/bin/sh

gcloud run deploy pmc-ftp-service \
  --project hhmi-staging-1 \
  --image gcr.io/hhmi-staging-1/pmc-ftp-service:$(git rev-parse --short HEAD) \
  --platform managed \
  --ingress internal \
  --memory 2G \
  --concurrency 1 \
  --min-instances 0 \
  --max-instances 10 \
  --region us-central1 \
  --no-allow-unauthenticated \
  --set-env-vars "FTP_HOST=34.82.165.84" \
  --set-env-vars "FTP_USERNAME=curvenote" \
  --set-env-vars "FTP_PASSWORD=curvenote"
