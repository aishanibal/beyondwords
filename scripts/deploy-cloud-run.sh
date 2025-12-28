#!/bin/bash
# Deploy Python API to Google Cloud Run
# Usage: ./scripts/deploy-cloud-run.sh

set -e

# Configuration - update these values
PROJECT_ID="${GCP_PROJECT_ID:-heirloom-463918}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="beyondwords-python-api"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Deploying Python API to Cloud Run..."
echo "   Project: ${PROJECT_ID}"
echo "   Region: ${REGION}"
echo "   Service: ${SERVICE_NAME}"

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Build and push container image using Cloud Build
echo "📦 Building container image..."
gcloud builds submit --tag "${IMAGE_NAME}" --project "${PROJECT_ID}"

# Deploy to Cloud Run
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
    --image "${IMAGE_NAME}" \
    --platform managed \
    --region "${REGION}" \
    --project "${PROJECT_ID}" \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --concurrency 80 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
    --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID}" \
    --set-env-vars "GCP_LOCATION=${REGION}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
    --platform managed \
    --region "${REGION}" \
    --project "${PROJECT_ID}" \
    --format 'value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo "   Service URL: ${SERVICE_URL}"
echo "   Admin Dashboard: ${SERVICE_URL}/admin"
echo ""
echo "📝 To set the GOOGLE_API_KEY secret (if using API key auth):"
echo "   gcloud run services update ${SERVICE_NAME} \\"
echo "     --region ${REGION} \\"
echo "     --set-env-vars GOOGLE_API_KEY=your-api-key"

