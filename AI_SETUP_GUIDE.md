# AI-Powered Insights Setup Guide

This guide explains how to enable the AI-Powered Insights feature when your app is deployed on GitHub Pages or any static hosting.

## Why Do We Need a Backend?

The Gemini API cannot be called directly from the browser due to CORS (Cross-Origin Resource Sharing) restrictions. We need a backend proxy server to handle the API requests securely.

## Option 1: Deploy Backend to Vercel (Recommended - Free)

Vercel offers free serverless functions perfect for this use case.

### Step 1: Prepare Your Backend

1. **Create the API folder structure:**
```bash
mkdir api
```

2. **Create `api/gemini.js`:**
```javascript
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    const { prompt } = req.body;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const insights = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No insights generated';
    res.status(200).json({ insights });
    
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate insights' 
    });
  }
}
```

3. **Create `api/health.js`:**
```javascript
export default function handler(req, res) {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
}
```

4. **Create `vercel.json` in your project root:**
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### Step 2: Deploy to Vercel

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

4. **Add your Gemini API Key as environment variable:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add: `GEMINI_API_KEY` = `your-actual-api-key`

5. **Get your deployment URL** (e.g., `https://your-project.vercel.app`)

### Step 3: Update Your Frontend

1. **Create `.env.production` file:**
```env
VITE_PROXY_SERVER_URL=https://your-project.vercel.app
```

2. **Update `geminiService.ts`** (already done):
```typescript
const PROXY_SERVER_URL = import.meta.env.VITE_PROXY_SERVER_URL || 'http://localhost:3002';
```

3. **Update the API endpoint in geminiService.ts:**
Change `/api/insights` to `/api/gemini` since that's what we named the Vercel function:

```typescript
const response = await fetch(`${PROXY_SERVER_URL}/api/gemini`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt })
});
```

4. **Rebuild and deploy your frontend:**
```bash
npm run build
# Deploy the dist folder to GitHub Pages
```

---

## Option 2: Deploy Backend to Render (Free Tier)

Render offers free Node.js hosting.

### Step 1: Create a Separate Backend Project

1. **Create a new folder `backend-proxy`**
2. **Initialize Node.js project:**
```bash
cd backend-proxy
npm init -y
npm install express cors dotenv
```

3. **Create `server.js`:**
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/insights', async (req, res) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { prompt } = req.body;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const insights = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No insights generated';
    res.json({ insights });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

4. **Create `package.json` start script:**
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

5. **Deploy to Render:**
   - Push to GitHub
   - Go to render.com
   - Create new Web Service
   - Connect your GitHub repo
   - Add environment variable: `GEMINI_API_KEY`
   - Deploy

6. **Update your frontend `.env.production`:**
```env
VITE_PROXY_SERVER_URL=https://your-app.onrender.com
```

---

## Option 3: Use Netlify Functions

Similar to Vercel, create `netlify/functions/gemini.js` and follow Netlify's deployment guide.

---

## Testing Your Setup

1. **Test the health endpoint:**
```bash
curl https://your-deployment.vercel.app/api/health
```

2. **Test the insights endpoint:**
```bash
curl -X POST https://your-deployment.vercel.app/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test prompt"}'
```

3. **Check your frontend:**
   - Deploy your updated frontend
   - Click "Generate AI Insights"
   - Should work without CORS errors!

---

## Troubleshooting

### Issue: "Proxy Server Not Running"
- **Cause:** Frontend can't reach backend
- **Fix:** Check `VITE_PROXY_SERVER_URL` is set correctly and backend is deployed

### Issue: "API Key Error"
- **Cause:** Missing or invalid Gemini API key
- **Fix:** Add `GEMINI_API_KEY` to your backend's environment variables

### Issue: CORS Errors
- **Cause:** Backend not allowing frontend domain
- **Fix:** Update CORS settings to allow your GitHub Pages domain

### Issue: Timeout Errors
- **Cause:** Serverless cold starts or slow API
- **Fix:** Increase function timeout in Vercel/Render settings

---

## Security Notes

⚠️ **IMPORTANT:** Never commit your `.env` files or expose your Gemini API key!

- Keep API keys in environment variables only
- Use different keys for development and production
- Monitor API usage in Google Cloud Console
- Set up usage quotas to prevent unexpected charges

---

## Cost Estimation

- **Vercel Free Tier:** 100GB bandwidth, 100 function executions/day
- **Render Free Tier:** 750 hours/month, sleeps after 15 min inactivity
- **Gemini API:** Free tier includes generous limits
- **Estimated cost for typical usage:** $0-5/month

---

## Quick Start Checklist

- [ ] Get Gemini API key from Google AI Studio
- [ ] Choose hosting platform (Vercel recommended)
- [ ] Create backend API files
- [ ] Deploy backend with API key as environment variable
- [ ] Update frontend `.env.production` with backend URL
- [ ] Rebuild and deploy frontend
- [ ] Test AI insights feature
- [ ] Monitor usage and errors

---

For more help, see:
- [Vercel Documentation](https://vercel.com/docs)
- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Gemini API Docs](https://ai.google.dev/docs)
