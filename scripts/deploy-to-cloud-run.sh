#!/bin/bash

# Google Cloud Run Deployment Script
# Prerequisites: 
# - Google Cloud SDK installed
# - Authenticated with: gcloud auth login
# - Project selected: gcloud config set project YOUR_PROJECT_ID

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-citypee-london}"
REGION="${GCP_REGION:-europe-west2}"  # London region
SERVICE_NAME="${SERVICE_NAME:-citypee}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 CityPee Cloud Run Deployment${NC}"
echo "======================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install Google Cloud SDK${NC}"
    exit 1
fi

# Check current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    echo -e "${RED}❌ No Google Cloud project configured${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✓${NC} Using project: ${CURRENT_PROJECT}"
echo -e "${GREEN}✓${NC} Region: ${REGION}"
echo -e "${GREEN}✓${NC} Service: ${SERVICE_NAME}"

# Enable required APIs
echo -e "\n${YELLOW}Enabling required APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com

# Build Docker image
echo -e "\n${YELLOW}Building Docker image...${NC}"
gcloud builds submit --tag ${IMAGE_NAME} .

# Deploy to Cloud Run
echo -e "\n${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --port 3000 \
    --set-env-vars="NODE_ENV=production"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --format 'value(status.url)')

echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo "======================================="
echo -e "Service URL: ${GREEN}${SERVICE_URL}${NC}"
echo -e "\nNext steps:"
echo "1. Set Google Maps API key:"
echo "   gcloud run services update ${SERVICE_NAME} --region ${REGION} --set-env-vars=\"NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here\""
echo "2. Test the deployment: curl ${SERVICE_URL}/api/search"
echo "3. Visit ${SERVICE_URL} in your browser"
echo "4. Set up custom domain (optional)"
echo -e "\nView logs: gcloud run services logs ${SERVICE_NAME} --region ${REGION}"
echo -e "Update service: gcloud run services update ${SERVICE_NAME} --region ${REGION}"