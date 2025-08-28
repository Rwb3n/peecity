# 🚀 CityPee Deployment Guide

**Deploy CityPee to Google Cloud Run in 5 minutes**

---

## Prerequisites (One-Time Setup)

### 1. Google Cloud Setup
```bash
# Install Google Cloud CLI
# Visit: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Create/select project
gcloud projects create peecity --name="CityPee London"
gcloud config set project peecity

# Enable billing (required for Cloud Run)
# Visit: https://console.cloud.google.com/billing

# Enable required APIs
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com

# Enable Google Maps APIs (for app functionality)
gcloud services enable \
    maps-backend.googleapis.com \
    places-backend.googleapis.com
```

### 2. Environment Variables
```bash
# Required for production
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_production_api_key_here
```

---

## Deployment Commands

### GitHub Integration (Recommended)
**Automatic deployment on every push to main branch**

1. **Connect GitHub repo to Cloud Build** (one-time setup):
   - Visit [Cloud Build GitHub App](https://github.com/apps/google-cloud-build)
   - Connect your repository: `Rwb3n/peecity`
   - Grant permissions to the `peecity` Google Cloud project

2. **Push to deploy**:
   ```bash
   git add cloudbuild.yaml
   git commit -m "Add automatic Cloud Build deployment"
   git push origin main
   # 🚀 Automatic build & deploy triggered!
   ```

3. **Monitor deployment**:
   ```bash
   # View build logs
   gcloud builds list --limit=5
   
   # View service status  
   gcloud run services list --region us-east1
   ```

### Manual Deploy Steps (Alternative)
```bash
# Option 1: Use cloudbuild.yaml locally
gcloud builds submit --config cloudbuild.yaml .

# Option 2: Direct Docker build (old method)
gcloud builds submit --tag gcr.io/peecity/citypee .

# 2. Deploy to Cloud Run
gcloud run deploy citypee \
  --image gcr.io/peecity/citypee \
  --platform managed \
  --region us-east1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --port 3000 \
  --set-env-vars="NODE_ENV=production"

# 3. Set Google Maps API key
gcloud run services update citypee \
  --region us-east1 \
  --set-env-vars="NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here"
```

---

## Post-Deployment Configuration

### 1. Update Google Maps API Key Restrictions
1. Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your API key
3. Add your Cloud Run URL to HTTP referrers:
   - `https://citypee-*.a.run.app/*`
   - `https://your-custom-domain.com/*`

### 2. Test Deployment
```bash
# Test API endpoint
curl https://your-service-url/api/search

# Test full application
open https://your-service-url
```

### 3. Set Up Custom Domain (Optional)
```bash
# Map custom domain
gcloud run domain-mappings create \
  --service citypee \
  --domain citypee.com \
  --region us-east1
```

---

## Cost Estimation

### Google Cloud Run
- **Free tier**: 2M requests/month
- **After free tier**: $0.40 per 1M requests
- **Memory**: $0.00001667 per GB-second
- **CPU**: $0.00002400 per vCPU-second

### Google Maps APIs
- **Maps JavaScript API**: 28,000 loads/month free
- **Places API**: 10,000 requests/month free

**Estimated monthly cost for 10,000 users: $5-15**

---

## Monitoring & Maintenance

### View Logs
```bash
gcloud run services logs tail citypee --region us-east1
```

### Update Service
```bash
# Redeploy after code changes
./scripts/deploy-to-cloud-run.sh

# Update environment variables only
gcloud run services update citypee \
  --region us-east1 \
  --set-env-vars="NEW_VAR=value"
```

### Scale Configuration
```bash
# Increase resources if needed
gcloud run services update citypee \
  --region us-east1 \
  --memory 1Gi \
  --cpu 2 \
  --max-instances 50
```

---

## Troubleshooting

### Common Issues

#### "Service not found"
- Check project: `gcloud config get-value project`
- Check region: Services are region-specific

#### "Build failed"
- Check Dockerfile syntax
- Ensure all dependencies in package.json
- Check Docker is running locally: `docker --version`

#### "API key not working"
- Verify API key is set: `gcloud run services describe citypee --region us-east1`
- Check API restrictions in Google Cloud Console
- Ensure Maps JavaScript API + Places API are enabled

#### "Site not loading"
- Check service URL: `gcloud run services list`
- View logs: `gcloud run services logs tail citypee --region us-east1`
- Test API directly: `curl https://your-url/api/search`

### Emergency Rollback
```bash
# List previous revisions
gcloud run revisions list --service citypee --region us-east1

# Rollback to previous version
gcloud run services update-traffic citypee \
  --to-revisions REVISION_NAME=100 \
  --region us-east1
```

---

## Production Checklist

### Before Going Live
- [ ] Google Maps API key configured with domain restrictions
- [ ] Custom domain set up (optional)
- [ ] SSL certificate configured (automatic with Cloud Run)
- [ ] Error monitoring configured
- [ ] Analytics/AdSense implemented (Week 3)
- [ ] Load testing completed
- [ ] Backup strategy in place

### Security
- [ ] API key restricted to production domains
- [ ] No secrets in environment variables
- [ ] HTTPS enforced (default with Cloud Run)
- [ ] Content Security Policy configured

### Performance
- [ ] Build optimization enabled
- [ ] Images optimized
- [ ] Caching headers configured
- [ ] CDN setup for static assets (if needed)

---

## Next Steps After Deployment

### Week 2 Features
- [ ] Add toilet filters (wheelchair, free, etc.)
- [ ] User voting system ("This toilet exists/doesn't exist")
- [ ] Mobile app considerations

### Week 3 Monetization
- [ ] Google AdSense integration
- [ ] Sponsored toilet pins
- [ ] Premium features

### Multi-City Expansion
- [ ] NYC toilet data
- [ ] City selection dropdown
- [ ] Regional Cloud Run deployments

---

**🎉 Ready to deploy? Run: `./scripts/deploy-to-cloud-run.sh`**