# Deployment Guide

## Vercel Deployment

Both frontend and backend are deployed on Vercel as serverless applications.

### Frontend Deployment

The frontend uses Vite as the build system. Vercel auto-detects the framework.

**Build Configuration:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Root Directory: `frontend`

**vercel.json (frontend):**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The SPA rewrite rule ensures all client-side routes are handled by React Router.

### Backend Deployment

The backend uses Vercel's Python runtime for serverless functions.

**vercel.json (backend):**
```json
{
  "builds": [
    { "src": "app/main.py", "use": "@vercel/python" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "app/main.py" }
  ]
}
```

### Environment Variables

Configure these in the Vercel dashboard under Project Settings > Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| MONGODB_URL | MongoDB Atlas connection string | mongodb+srv://user:pass@cluster.mongodb.net/aravanta |
| JWT_SECRET | Secret key for JWT token signing | a-strong-random-string-min-32-chars |
| SUPABASE_URL | Supabase project URL | https://xxxxx.supabase.co |
| SUPABASE_KEY | Supabase service role key | eyJhbGciOiJIUzI1NiIs... |
| SMTP_EMAIL | Gmail address for sending verification emails | your-email@gmail.com |
| SMTP_PASSWORD | Gmail App Password (not regular password) | xxxx-xxxx-xxxx-xxxx |

### MongoDB Atlas Setup

1. Create a free cluster at https://cloud.mongodb.com
2. Create a database user with read/write permissions
3. Whitelist `0.0.0.0/0` in Network Access (required for Vercel serverless)
4. Copy the connection string and set as `MONGODB_URL`

### Supabase Storage Setup

1. Create a project at https://supabase.com
2. Navigate to Storage and create a bucket named `uploads`
3. Set the bucket policy to allow authenticated uploads
4. Copy the project URL and service role key

### Custom Domain Configuration

1. In Vercel dashboard, go to Project > Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. SSL certificates are provisioned automatically

### CI/CD with Vercel Git Integration

Vercel automatically deploys on every push to the connected Git branch:

1. Connect your GitHub repository to Vercel
2. Set the production branch to `main`
3. Preview deployments are created for pull requests
4. Environment variables are shared across deployments

```mermaid
graph LR
    Git["Git Push to main"] --> Vercel["Vercel Build"]
    Vercel --> TSC["TypeScript Compiler"]
    TSC --> Vite["Vite Bundle"]
    Vite --> Deploy["Deploy to Edge"]
    Deploy --> CDN["Global CDN"]
```
