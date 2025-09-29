# Vercel Deployment Setup Guide

This guide will walk you through setting up your project for Vercel deployment with Vercel Blobs for shared CSV storage.

## Prerequisites

1. A Vercel account (free tier is sufficient)
2. Your project pushed to GitHub (already done ✅)

## Step 1: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from the nextjs package directory
cd packages/nextjs
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: cohort-streaming-data (or your preferred name)
# - Directory: ./
# - Override settings? No
```

### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository: `BuidlGuidl/cohort-streaming-data`
4. Set the root directory to `packages/nextjs`
5. Click "Deploy"

## Step 2: Configure Vercel Blobs

### 2.1 Enable Vercel Blobs
1. In your Vercel dashboard, go to your project
2. Go to the "Storage" tab
3. Click "Create Database" → "Blob"
4. Name it: `csv-storage` (or any name you prefer)
5. Note down the connection string

### 2.2 Set Environment Variables
In your Vercel project dashboard:
1. Go to "Settings" → "Environment Variables"
2. Add the following variables:

```
BLOB_READ_WRITE_TOKEN=your_blob_token_from_step_2.1
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_admin_password
```

### 2.3 Redeploy
After adding environment variables:
1. Go to "Deployments" tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"

## Step 3: Test the Implementation

### 3.1 Test Admin Upload
1. Visit: `https://your-app.vercel.app/admin`
2. Enter the admin password you set
3. Upload a CSV file
4. Verify the upload was successful

### 3.2 Test Public Access
1. Visit: `https://your-app.vercel.app/accounting-data`
2. Verify the shared CSV data appears automatically
3. Check that the data is the same as what you uploaded

## Step 4: Configure Auto-Deploy (Optional)

### 4.1 Branch-based Deployments
1. In Vercel dashboard → "Settings" → "Git"
2. Enable "Auto-deploy" for your main branch
3. Optionally enable preview deployments for other branches

### 4.2 Custom Domains (Optional)
1. Go to "Settings" → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | Yes |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Password for admin access | Yes |
| `NEXT_PUBLIC_PONDER_API` | Ponder GraphQL endpoint | No (has default) |

## API Endpoints

- `GET /api/shared-csv-data` - Public endpoint to fetch shared CSV data
- `POST /api/admin/upload-csv` - Admin endpoint to upload CSV data
- `GET /api/admin/check-shared-data` - Admin endpoint to check data status

## File Structure

```
packages/nextjs/
├── app/
│   ├── admin/
│   │   └── page.tsx              # Admin dashboard
│   ├── api/
│   │   ├── admin/
│   │   │   ├── upload-csv/
│   │   │   │   └── route.ts      # Upload CSV to Vercel Blobs
│   │   │   └── check-shared-data/
│   │   │       └── route.ts      # Check shared data status
│   │   └── shared-csv-data/
│   │       └── route.ts          # Public CSV data endpoint
│   └── accounting-data/
│       └── page.tsx             # Updated with shared data display
├── components/scaffold-eth/
│   ├── AdminCsvUpload.tsx       # Admin upload component
│   └── SharedCsvDisplay.tsx     # Public data display component
├── hooks/
│   └── useSharedCsvData.ts      # Hook for fetching shared data
└── vercel.json                  # Vercel configuration
```

## Troubleshooting

### Common Issues

1. **"No shared CSV data available"**
   - Check that `BLOB_READ_WRITE_TOKEN` is set correctly
   - Verify the admin has uploaded data successfully

2. **Admin upload fails**
   - Check Vercel Blobs is enabled
   - Verify the token has write permissions

3. **Build errors**
   - Check that all dependencies are installed
   - Verify TypeScript types are correct

### Debug Steps

1. Check Vercel function logs in the dashboard
2. Verify environment variables are set
3. Test API endpoints directly using curl or Postman
4. Check browser console for client-side errors

## Security Notes

- Change the default admin password in production
- Consider implementing proper authentication instead of simple password
- The admin password is exposed client-side (NEXT_PUBLIC_*), so use a strong password
- For production, consider implementing server-side authentication

## Next Steps

1. Test the complete flow: admin upload → public display
2. Customize the admin password
3. Set up monitoring and alerts
4. Consider implementing data validation and sanitization
5. Add error handling and user feedback improvements
