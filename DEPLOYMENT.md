# Deployment Guide

This guide covers deploying FitVide to production environments for web, iOS, and Android platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Web Deployment](#web-deployment)
4. [Mobile Deployment](#mobile-deployment)
5. [Supabase Configuration](#supabase-configuration)
6. [CI/CD Setup](#cicd-setup)
7. [Monitoring](#monitoring)

---

## Prerequisites

- Node.js 18.x or higher
- Docker and Docker Compose (for web deployment)
- Expo CLI or EAS CLI (for mobile builds)
- Supabase account with a project
- Git repository

---

## Environment Setup

### 1. Production Environment Variables

Create a `.env.production` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

**Important:** Never commit `.env` files to version control!

### 2. Supabase Production Setup

1. Create a production Supabase project
2. Run `schema.sql` in the SQL Editor
3. Create storage bucket `avatars` with public access
4. Configure RLS policies (already in schema.sql)
5. Set up backup schedules
6. Configure rate limiting if needed

---

## Web Deployment

### Option 1: Docker Deployment (Recommended)

#### Step 1: Build Docker Image

```bash
docker build -t fitvide-web .
```

#### Step 2: Run with Docker Compose

```bash
# Update docker-compose.yml with production environment variables
docker-compose up -d
```

The app will be available at `http://localhost:80`

#### Step 3: Configure Nginx (Production)

Update `nginx.conf` for production:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Cache static assets
    location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Option 2: Static Hosting (Vercel, Netlify, etc.)

#### Vercel Deployment

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Build the app:
   ```bash
   npx expo export -p web
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

4. Set environment variables in Vercel dashboard:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

#### Netlify Deployment

1. Build command:
   ```bash
   npx expo export -p web
   ```

2. Publish directory: `dist`

3. Add environment variables in Netlify dashboard

### Option 3: Traditional Web Server

1. Build the app:
   ```bash
   npx expo export -p web
   ```

2. Copy `dist/` contents to your web server

3. Configure your web server (Apache/Nginx) to serve the static files

4. Ensure `index.html` is served for all routes (SPA routing)

---

## Mobile Deployment

### iOS Deployment

#### Prerequisites

- macOS with Xcode installed
- Apple Developer account ($99/year)
- EAS Build account (free tier available)

#### Step 1: Configure app.json

Ensure iOS configuration is correct:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.fitvide.app",
      "buildNumber": "1.0.0"
    }
  }
}
```

#### Step 2: Build with EAS

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios --profile production
```

#### Step 3: Submit to App Store

```bash
# Submit to App Store
eas submit --platform ios
```

Or use Xcode:
1. Download the `.ipa` file from EAS
2. Open in Xcode
3. Use App Store Connect to submit

### Android Deployment

#### Prerequisites

- Google Play Developer account ($25 one-time)
- EAS Build account

#### Step 1: Configure app.json

```json
{
  "expo": {
    "android": {
      "package": "com.fitvide.app",
      "versionCode": 1
    }
  }
}
```

#### Step 2: Build with EAS

```bash
# Build for Android
eas build --platform android --profile production
```

#### Step 3: Submit to Play Store

```bash
# Submit to Play Store
eas submit --platform android
```

Or manually:
1. Download the `.aab` file from EAS
2. Upload to Google Play Console
3. Complete store listing and submit for review

---

## Supabase Configuration

### 1. Production Database

- Enable automatic backups
- Set up point-in-time recovery
- Configure connection pooling
- Monitor database performance

### 2. Storage Buckets

Create and configure:

```sql
-- Create avatars bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Set up storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. API Rate Limiting

Configure in Supabase Dashboard:
- Go to Settings → API
- Set rate limits based on your plan
- Monitor usage in Analytics

### 4. Environment Variables

Update Supabase project settings:
- Site URL: Your production domain
- Redirect URLs: Add your app's redirect URLs

---

## CI/CD Setup

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx expo export -p web
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  build-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm install -g eas-cli
      - run: eas build --platform all --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### Environment Secrets

Add to GitHub Secrets:
- `VERCEL_TOKEN`
- `ORG_ID`
- `PROJECT_ID`
- `EXPO_TOKEN`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## Monitoring

### 1. Application Monitoring

#### Sentry Integration

```bash
npm install @sentry/react-native
```

Configure in `app/_layout.tsx`:

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: __DEV__ ? 'development' : 'production',
});
```

### 2. Supabase Monitoring

- Monitor API usage in Supabase Dashboard
- Set up alerts for:
  - High error rates
  - Database connection issues
  - Storage quota limits
  - Unusual traffic patterns

### 3. Performance Monitoring

- Use React Native Performance Monitor
- Track app load times
- Monitor API response times
- Track user engagement metrics

---

## Security Checklist

- [ ] Environment variables secured (not in code)
- [ ] RLS policies enabled on all tables
- [ ] HTTPS enabled for web deployment
- [ ] API keys rotated regularly
- [ ] Database backups configured
- [ ] Error tracking set up
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Storage bucket permissions set correctly
- [ ] App signing certificates secured

---

## Rollback Procedures

### Web Deployment

```bash
# Vercel
vercel rollback

# Docker
docker-compose down
docker-compose up -d --scale web=previous-version
```

### Mobile Deployment

- iOS: Use App Store Connect to pause rollout
- Android: Use Play Console to halt rollout
- EAS: Build previous version and resubmit

---

## Troubleshooting

### Common Issues

1. **Build fails with "Missing environment variables"**
   - Ensure all required env vars are set in build environment
   - Check `.env` file is not committed

2. **App crashes on startup**
   - Check Supabase URL and keys are correct
   - Verify database schema is applied
   - Check error logs in Sentry/console

3. **Images not loading**
   - Verify storage bucket exists and is public
   - Check storage policies are correct
   - Verify CORS settings

4. **Authentication not working**
   - Check Supabase Auth settings
   - Verify redirect URLs are configured
   - Check JWT token expiration

---

## Performance Optimization

### Web

- Enable gzip compression
- Use CDN for static assets
- Implement lazy loading
- Optimize images
- Use service workers for caching

### Mobile

- Optimize bundle size
- Use code splitting
- Implement image caching
- Reduce API calls with caching
- Use native modules where possible

---

## References

- [Expo Deployment Guide](https://docs.expo.dev/distribution/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Supabase Production Guide](https://supabase.com/docs/guides/hosting)
- [Docker Documentation](https://docs.docker.com/)
