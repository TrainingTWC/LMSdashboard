# Migration from Google Gemini to OpenAI

## ✅ What Was Changed

I've successfully migrated your AI insights generation from Google Gemini to OpenAI. Here's what changed:

### 1. **GitHub Actions Workflow** (`.github/workflows/generate-insights.yml`)
- Changed environment variable from `GEMINI_API_KEY` to `OPENAI_API_KEY`
- The workflow now expects OpenAI credentials

### 2. **Insights Generation Script** (`scripts/generate-insights.js`)
- Updated API endpoint from Google's Generative AI to OpenAI's Chat Completions API
- Changed model from `gemini-pro` to `gpt-4o-mini` (faster and cost-effective)
- Updated request format to OpenAI's message format
- Updated response parsing for OpenAI's structure

### 3. **AI Service** (`services/aiService.ts`)
- Created new `aiService.ts` (replacing `geminiService.ts`)
- Updated proxy endpoint from `/api/gemini` to `/api/openai`
- Updated error messages to reference OpenAI instead of Gemini
- Updated CORS restriction messages

### 4. **UI Component** (`components/GeminiInsights.tsx`)
- Updated import to use `aiService` instead of `geminiService`
- Changed display text from "Gemini AI" to "OpenAI"
- Updated loading and error messages

### 5. **Documentation** (`GITHUB_ACTIONS_AI_SETUP.md`)
- Updated all references from Gemini to OpenAI
- Changed secret name instructions
- Updated API key source links
- Updated cost estimates (OpenAI uses pay-per-use, not free tier)

---

## 🔑 What You Need to Do

### **IMPORTANT: Update GitHub Secret**

Your GitHub Actions workflow will fail until you update the API key:

1. **Get an OpenAI API Key:**
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy the key (you won't see it again!)

2. **Add to GitHub Secrets:**
   - Go to your repository: https://github.com/TrainingTWC/LMSdashboard
   - Click **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `OPENAI_API_KEY`
   - Value: Paste your OpenAI API key
   - Click **Add secret**

3. **Optional: Remove Old Secret**
   - You can delete the old `GEMINI_API_KEY` secret if you're not using it

---

## 💰 Cost Comparison

### Google Gemini (Previous):
- ✅ **FREE** for generous usage
- ✅ 60 requests per minute
- ✅ No credit card required for basic tier

### OpenAI (Current):
- 💳 **Pay-per-use** (requires credit card)
- 💰 **gpt-4o-mini**: ~$0.01-0.10 per insight generation
- 💰 **Estimated**: $0-5/month for typical dashboard usage
- ⚡ Generally faster responses
- 🎯 More control over model parameters

**Typical Scenario:**
- Daily insight generation = ~30 requests/month
- Cost per request: ~$0.01-0.03
- **Monthly cost: ~$0.30-$1.00**

---

## 🔄 Want to Switch Back to Gemini?

If you prefer to use Google Gemini (free tier), let me know and I can revert these changes!

**Gemini Advantages:**
- Free generous quota
- No credit card required
- Good for prototyping

**OpenAI Advantages:**
- Generally better quality responses
- Faster processing
- More model options (GPT-4, GPT-3.5, etc.)
- Better reasoning capabilities

---

## 🚀 Next Steps

1. ✅ **Add `OPENAI_API_KEY` to GitHub Secrets** (see above)
2. ✅ **Trigger the workflow manually:**
   - Go to **Actions** tab
   - Click **Generate AI Insights**
   - Click **Run workflow**
3. ✅ **Verify it works:**
   - Check workflow completes successfully
   - Confirm `public/insights.json` is created
4. ✅ **Deploy and test:**
   - Build and deploy to GitHub Pages
   - Check that AI insights load on your live site

---

## 📊 Model Configuration

Currently using `gpt-4o-mini` which is:
- ✅ Fast and efficient
- ✅ Cost-effective ($0.15 per 1M input tokens)
- ✅ Great for analysis tasks like this

**Want to upgrade to GPT-4?**
Edit `scripts/generate-insights.js` line 67:
```javascript
model: 'gpt-4o',  // More powerful, more expensive (~$5 per 1M tokens)
```

---

## 🆘 Troubleshooting

### Workflow fails with "OPENAI_API_KEY not found"
→ You haven't added the secret yet. Follow steps above.

### Workflow fails with "401 Unauthorized"
→ Your API key is invalid. Generate a new one from OpenAI Platform.

### Workflow fails with "429 Rate Limit"
→ You've exceeded your OpenAI quota. Check your [usage dashboard](https://platform.openai.com/usage).

### Workflow fails with "insufficient_quota"
→ You need to add credits to your OpenAI account. Add $5-10 to start.

### Cost concerns?
→ I can switch you back to Gemini (free), or implement request throttling.

---

## ✨ Summary

✅ **Migration Complete!**
- All code updated to use OpenAI
- GitHub Actions workflow ready
- UI updated with new branding

⏳ **Waiting on You:**
- Add `OPENAI_API_KEY` to GitHub Secrets

🎯 **Result:**
- Same great AI insights
- Using OpenAI's GPT models
- Small cost (~$1/month for typical usage)

**Questions?** Let me know if you need help with:
- Getting an OpenAI API key
- Adding credits to your account
- Switching back to Gemini
- Optimizing costs
