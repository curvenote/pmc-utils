#!/bin/sh

gcloud builds submit \
  --project hhmi-staging-1 \
  --tag gcr.io/hhmi-staging-1/pmc-ftp-service:$(git rev-parse --short HEAD) \
  --timeout 30m \
  .