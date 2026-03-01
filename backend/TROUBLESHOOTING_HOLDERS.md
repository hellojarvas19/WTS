# 🔍 Troubleshooting: Holders Showing "N/A"

## Issue
Transaction messages show:
```
👥 Holders: N/A | Top 10: N/A
```

## Possible Causes & Solutions

### 1. ❌ API Key Not Set

**Check your `.env` file:**
```bash
grep SOLANA_TRACKER_API_KEY .env
```

**Should show:**
```env
SOLANA_TRACKER_API_KEY=your_actual_api_key_here
```

**If missing or empty:**
1. Get API key from: https://www.solanatracker.io/account
2. Add to `.env`:
   ```env
   SOLANA_TRACKER_API_KEY=st_xxxxxxxxxxxxx
   ```
3. Restart the bot

---

### 2. ⚠️ Enhanced Metadata Disabled

**Check `.env`:**
```bash
grep ENABLE_ENHANCED_METADATA .env
```

**Should be:**
```env
ENABLE_ENHANCED_METADATA=true
```

**If false or missing:**
```bash
echo "ENABLE_ENHANCED_METADATA=true" >> .env
```

---

### 3. 🔍 Check Bot Logs

**Look for these messages:**

✅ **Success:**
```
✅ Solana Tracker: 673795 holders, top10: 88.97%
```

❌ **API Key Missing:**
```
⚠️ SOLANA_TRACKER_API_KEY not set - skipping holders data
```

❌ **API Error:**
```
❌ Solana Tracker token info failed: Request failed with status code 401
❌ Solana Tracker holders failed: Request failed with status code 401
```

---

### 4. 🔑 Invalid API Key

**Error in logs:**
```
❌ Solana Tracker token info failed: Request failed with status code 401
```

**Solution:**
1. Verify API key is correct
2. Check it's not expired
3. Get new key from: https://www.solanatracker.io/account

---

### 5. 🌐 API Rate Limit

**Error in logs:**
```
❌ Solana Tracker token info failed: Request failed with status code 429
```

**Solution:**
- Wait a few minutes
- Upgrade your Solana Tracker plan
- API will retry on next transaction

---

### 6. 🚫 Token Not Found

**Some tokens may not have holder data yet**

**Check logs:**
```
❌ Solana Tracker token info failed: Request failed with status code 404
```

**This is normal for:**
- Very new tokens
- Tokens not indexed yet
- Invalid token addresses

---

## Quick Test

**Run the test script:**
```bash
pnpm tsx scripts/test-solanatracker-holders.ts
```

**Expected output:**
```
🧪 Testing Solana Tracker API - Top Holders
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Token: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Successfully fetched 20 holders

📊 Top 10 Holders: 85.42%
```

---

## Verification Checklist

- [ ] `SOLANA_TRACKER_API_KEY` is set in `.env`
- [ ] `ENABLE_ENHANCED_METADATA=true` in `.env`
- [ ] Bot has been restarted after changes
- [ ] API key is valid (test with script)
- [ ] Check bot logs for error messages
- [ ] Test with a popular token first

---

## Still Not Working?

**Check environment variables are loaded:**
```bash
# In your deployment platform (Railway, etc.)
# Verify SOLANA_TRACKER_API_KEY is set
```

**Restart the bot:**
```bash
# Stop and start the bot to reload .env
pnpm start
```

**Check API status:**
- Visit: https://status.solanatracker.io
- Verify API is operational

---

## Expected Behavior

**With API key set:**
```
👥 Holders: 673,795 | Top 10: 88.97%
```

**Without API key:**
```
👥 Holders: N/A | Top 10: N/A
```
(Falls back to other sources like Moralis/RugCheck)

---

**Need help?** Check the logs for specific error messages!
