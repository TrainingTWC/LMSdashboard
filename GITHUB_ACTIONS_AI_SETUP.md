# Using GitHub Actions for AI Insights (No External Backend Needed!)

This guide shows you how to use GitHub Actions to generate AI insights during build time, so you don't need Vercel or any external backend service.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ 1. You push code/data to GitHub                             │
│ 2. GitHub Actions runs automatically                         │
│ 3. Script calls Gemini API (server-side, no CORS issues)   │
│ 4. Insights saved as insights.json                          │
│ 5. GitHub Pages serves the pre-generated insights           │
│ 6. Your app loads insights.json (no API calls needed!)     │
└─────────────────────────────────────────────────────────────┘
```

## Advantages ✅
- ✅ **Free** - No Vercel/Render needed
- ✅ **No CORS issues** - API called server-side in GitHub Actions
- ✅ **Fast loading** - Pre-generated insights load instantly
- ✅ **Secure** - API key stored in GitHub Secrets
- ✅ **Simple** - Everything stays in one repo

## Limitations ⚠️
- ⚠️ Insights are not "real-time" (updated when you push changes)
- ⚠️ Need to trigger workflow to refresh insights
- ⚠️ No interactive "Generate Now" button (can still work with proxy)

---

## Setup Instructions

### Step 1: Add Gemini API Key to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `GEMINI_API_KEY`
5. Value: Your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
6. Click **Add secret**

### Step 2: Files Already Created

I've created these files for you:
- `.github/workflows/generate-insights.yml` - GitHub Actions workflow
- `scripts/generate-insights.js` - Script to call Gemini API
- Updated `GeminiInsights.tsx` - Now loads pre-generated insights first

### Step 3: Prepare Your Data

The script automatically searches for training data in these locations (in order):
1. `public/data/lms-completion.json` ✅ (Default)
2. `public/data/training-data.json`
3. `data/lms-completion.json`

**Your data is already in the correct location!**
The file `public/data/lms-completion.json` exists and will be found automatically.

**Option: Add additional data locations**
If you have data elsewhere, edit `scripts/generate-insights.js` to add more search paths:
```javascript
// Add your custom path to the search list
if (!fs.existsSync(dataPath)) {
  dataPath = path.join(__dirname, '../path/to/your/data.json');
}
```

### Step 4: Commit and Push

```bash
git add .github/workflows/generate-insights.yml
git add scripts/generate-insights.js
git add components/GeminiInsights.tsx
git commit -m "Add GitHub Actions for AI insights generation"
git push
```

### Step 5: Trigger the Workflow

The workflow runs automatically when:
- ✅ You push changes to `public/data/**` or `data/**`
- ✅ Daily at midnight (scheduled)
- ✅ Manually triggered

**To trigger manually:**
1. Go to your repo → **Actions** tab
2. Click **Generate AI Insights** workflow
3. Click **Run workflow** → **Run workflow**

### Step 6: Check the Results

1. Wait for the workflow to complete (~1-2 minutes)
2. Check that `public/insights.json` was created
3. The file will be committed automatically by GitHub Actions
4. Deploy to GitHub Pages as usual

---

## How to Use Both Methods (Hybrid Approach)

You can have **both** pre-generated insights (fast, free) **and** live generation (requires proxy):

### Current Behavior:
```javascript
// GeminiInsights.tsx
1. Try to load /insights.json (pre-generated from GitHub Actions)
2. If not found, call live API (requires proxy server)
```

This way:
- **On GitHub Pages**: Uses pre-generated insights (fast, free)
- **In development**: Can use live generation with proxy
- **Best of both worlds!**

---

## Workflow Configuration

The workflow is configured to run:

```yaml
on:
  push:
    paths:
      - 'public/data/**'      # When data files change
      - 'data/**'
  workflow_dispatch:          # Manual trigger
  schedule:
    - cron: '0 0 * * *'      # Daily at midnight UTC
```

**To change the schedule:**
Edit `.github/workflows/generate-insights.yml`:
```yaml
schedule:
  - cron: '0 */6 * * *'  # Every 6 hours
  - cron: '0 12 * * *'   # Daily at noon UTC
  - cron: '0 9 * * 1'    # Every Monday at 9 AM UTC
```

[Cron syntax help](https://crontab.guru/)

---

## Troubleshooting

### Workflow Failed: "GEMINI_API_KEY not found"
**Solution:** Make sure you added the secret correctly in repository settings.

### Workflow Failed: "No training data found"
**Solution:** 
- Check if `public/data/lms-completion.json` exists
- Update the path in `scripts/generate-insights.js` if needed

### Workflow Succeeded but No insights.json
**Solution:**
- Check workflow logs for errors
- Make sure the workflow has write permissions:
  - Settings → Actions → General → Workflow permissions
  - Select "Read and write permissions"

### insights.json Not Loading on Website
**Solution:**
- Make sure insights.json is in the `public` folder
- Check browser console for 404 errors
- Verify the file is deployed to GitHub Pages

### Want to Disable Pre-generated and Use Live Only
Edit `GeminiInsights.tsx`:
```typescript
const [usePreGenerated, setUsePreGenerated] = useState<boolean>(false);
```

---

## Monitoring & Costs

### GitHub Actions Limits (Free Tier):
- ✅ 2,000 minutes/month for private repos
- ✅ Unlimited for public repos
- ✅ Each insight generation takes ~1-2 minutes

### Gemini API Limits (Free Tier):
- ✅ 60 requests per minute
- ✅ Generous free quota
- ✅ Check usage at [Google AI Studio](https://makersuite.google.com/)

### Estimated Costs:
- **GitHub Actions:** FREE (public repo) or ~$0-2/month (private)
- **Gemini API:** FREE for typical usage
- **Total:** $0-2/month

---

## Advanced: Custom Triggers

### Trigger on New CSV Upload

If you upload CSVs via GitHub API, the workflow automatically runs!

### Trigger via API

```bash
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/TrainingTWC/LMSdashboard/actions/workflows/generate-insights.yml/dispatches \
  -d '{"ref":"master"}'
```

### Trigger on Pull Request

Add to workflow:
```yaml
on:
  pull_request:
    paths:
      - 'public/data/**'
```

---

## Comparison: GitHub Actions vs Vercel

| Feature | GitHub Actions | Vercel |
|---------|---------------|---------|
| Cost | Free (public repos) | Free tier available |
| Setup Complexity | Medium (one-time) | Easy |
| Insights Update | On push/schedule | Real-time |
| CORS Issues | None | None |
| Infrastructure | GitHub only | Separate service |
| Generate Button | Pre-generated only | Works live |
| Best For | Static updates | Real-time generation |

---

## Recommended Setup

**For most users (best balance):**
1. ✅ Use GitHub Actions for scheduled daily updates (free, automatic)
2. ✅ Keep Vercel option for manual "Generate Now" button (optional)
3. ✅ GeminiInsights tries pre-generated first, then falls back to live

**To implement:**
- Follow this guide for GitHub Actions
- Optionally follow `AI_SETUP_GUIDE.md` for Vercel
- Both will work together seamlessly!

---

## Quick Reference

```bash
# Check workflow status
gh run list --workflow=generate-insights.yml

# Trigger manually
gh workflow run generate-insights.yml

# View logs
gh run view --log

# Download insights.json
curl https://trainingtwc.github.io/LMSdashboard/insights.json
```

---

## Next Steps

1. ✅ Add GEMINI_API_KEY to GitHub Secrets
2. ✅ Ensure data file is in correct location
3. ✅ Enable workflow write permissions
4. ✅ Push changes to trigger first run
5. ✅ Monitor Actions tab for results
6. ✅ Deploy to GitHub Pages

**Need help?** Check workflow logs in Actions tab for detailed error messages.

---

## Summary

✨ **This is the simplest solution!**
- No external services needed
- Everything stays in GitHub
- Free for public repositories
- Insights auto-update when you push changes
- Falls back to live generation if needed

Perfect for your use case! 🎉
