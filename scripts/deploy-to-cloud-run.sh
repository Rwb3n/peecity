# last updated on: 2025-08-28 10:58:28
#!/bin/bash

# CityPee Deployment Script - Firebase + Cloud Run Architecture
# Prerequisites: 
# - Google Cloud SDK installed and authenticated: gcloud auth login
# - Firebase CLI installed and authenticated: firebase login
# - Project selected: gcloud config set project YOUR_PROJECT_ID
# - Firebase project configured: firebase use YOUR_PROJECT_ID

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-peecity}"
REGION="${GCP_REGION:-us-east1}"
API_SERVICE_NAME="${API_SERVICE_NAME:-citypee-api}"
FIREBASE_PROJECT="${FIREBASE_PROJECT:-peecity}"
API_IMAGE_NAME="gcr.io/${PROJECT_ID}/${API_SERVICE_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 CityPee Microservices Deployment${NC}"
echo "Firebase Hosting + Cloud Run Express API"
echo "======================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install Google Cloud SDK${NC}"
    exit 1
fi

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found. Please install: npm install -g firebase-tools${NC}"
    exit 1
fi

# Check current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    echo -e "${RED}❌ No Google Cloud project configured${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✓${NC} Using GCP project: ${CURRENT_PROJECT}"
echo -e "${GREEN}✓${NC} Region: ${REGION}"
echo -e "${GREEN}✓${NC} API Service: ${API_SERVICE_NAME}"

# Enable required APIs
echo -e "\n${YELLOW}Enabling required APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com

# Deploy Backend (Express API)
echo -e "\n${YELLOW}=== DEPLOYING BACKEND (Express API to Cloud Run) ===${NC}"
echo "Building and deploying Express API from api-server directory..."

cd api-server

# Build Docker image for Express API
echo -e "\n${YELLOW}Building Express API Docker image...${NC}"
gcloud builds submit --tag ${API_IMAGE_NAME} .

# Deploy Express API to Cloud Run
echo -e "\n${YELLOW}Deploying Express API to Cloud Run...${NC}"
gcloud run deploy ${API_SERVICE_NAME} \
    --image ${API_IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --port 8080 \
    --set-env-vars="NODE_ENV=production"

cd ..

# Deploy Frontend (Static React App to Firebase Hosting)
echo -e "\n${YELLOW}=== DEPLOYING FRONTEND (Static App to Firebase Hosting) ===${NC}"
echo "Building and deploying React app to Firebase..."

# Build static export
echo -e "\n${YELLOW}Building static React app...${NC}"
npm run build

# Deploy to Firebase Hosting
echo -e "\n${YELLOW}Deploying to Firebase Hosting...${NC}"
firebase deploy --only hosting

# Get deployment URLs
API_SERVICE_URL=$(gcloud run services describe ${API_SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --format 'value(status.url)')

FIREBASE_URL=$(firebase hosting:channel:list --filter="main" --format="get(url)" 2>/dev/null || echo "https://${FIREBASE_PROJECT}.web.app")

echo -e "\n${GREEN}✅ Microservices Deployment Complete!${NC}"
echo "================================================="
echo -e "🌐 Frontend (Firebase): ${GREEN}${FIREBASE_URL}${NC}"
echo -e "🔧 Backend API (Cloud Run): ${GREEN}${API_SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set Google Maps API key in Cloud Run:"
echo "   gcloud run services update ${API_SERVICE_NAME} --region ${REGION} --set-env-vars=\"GOOGLE_MAPS_API_KEY=your_api_key_here\""
echo ""
echo "2. Test the deployment:"
echo "   Frontend: curl ${FIREBASE_URL}"
echo "   API Config: curl ${API_SERVICE_URL}/api/config"
echo "   API Search: curl \"${API_SERVICE_URL}/api/search?lat=51.5&lng=-0.1&limit=5\""
echo ""
echo "3. Verify CORS integration:"
echo "   Visit ${FIREBASE_URL} and check browser console for errors"
echo ""
echo -e "${YELLOW}Monitoring & Management:${NC}"
echo "View API logs: gcloud run services logs ${API_SERVICE_NAME} --region ${REGION}"
echo "Update API: gcloud run services update ${API_SERVICE_NAME} --region ${REGION}"
echo "Firebase console: https://console.firebase.google.com/project/${FIREBASE_PROJECT}"
echo ""
echo -e "${GREEN}🚀 Production URLs:${NC}"
echo -e "Main App: ${GREEN}${FIREBASE_URL}${NC}"
echo -e "API Health: ${GREEN}${API_SERVICE_URL}/api/config${NC}"