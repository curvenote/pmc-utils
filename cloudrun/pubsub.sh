# Create service account
gcloud iam service-accounts create pmc-ftp-invoker \
  --display-name "PMC FTP Invoker"

# Give it permission to invoke the service
gcloud run services add-iam-policy-binding pmc-ftp-service \
  --member=serviceAccount:pmc-ftp-invoker@curvenote-dev-1.iam.gserviceaccount.com \
  --role=roles/run.invoker \
  --region us-central1

# # Give it permission to publish to pubsub
# gcloud projects add-iam-policy-binding curvenote-dev-1 \
#   --member=serviceAccount:pmc-ftp-invoker@curvenote-dev-1.iam.gserviceaccount.com \
#   --role=roles/pubsub.publisher

# Give it permission to create auth tokens (532105236354 is project number)
gcloud projects add-iam-policy-binding curvenote-dev-1 \
   --member=serviceAccount:service-532105236354@gcp-sa-pubsub.iam.gserviceaccount.com \
   --role=roles/iam.serviceAccountTokenCreator

# Create pub/sub subscription with the account
gcloud pubsub topics create pmcFtpTopic
gcloud pubsub subscriptions create pmcFtpSub --topic pmcFtpTopic \
  --ack-deadline=600 \
  --push-endpoint=https://pmc-ftp-service-v2zyggz2uq-uc.a.run.app \
  --push-auth-service-account=pmc-ftp-invoker@curvenote-dev-1.iam.gserviceaccount.com

# Test it out!
gcloud pubsub topics publish pmcFtpTopic --attribute "id=PMC7320451"

# Add to config:
# depositService:
#   url: https://pmc-ftp-service-v2zyggz2uq-uc.a.run.app
#   topic: pmcFtpTopic
#   projectId: curvenote-dev-1
#   secretKeyfile: { for pmc-ftp-invoker }
