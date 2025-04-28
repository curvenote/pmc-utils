#!/bin/sh

docker run \
  -p 8080:8080 \
  -v ~/.config/gcloud/application_default_credentials.json:/usr/app/application_default_credentials.json \
  -e GOOGLE_APPLICATION_CREDENTIALS=/usr/app/application_default_credentials.json \
  -e FTP_HOST=host.docker.internal \
  -e FTP_PORT=21 \
  pmc-ftp