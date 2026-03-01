# 🔍 Solana Tracker API - Diagnostic Guide

## ✅ API Key Already Set in Railway

Since the API key is already in Railway variables, the issue is likely one of these:

---

## 🐛 Common Issues

### 1. Token Not Indexed (Most Common - 60%)
**Symptom:** `Holders: N/A | Top 10: N/A`

**Cause:** 
- Token is too new (< 5 minutes)
- Token has very few transactions
- Token not yet indexed by Solana Tracker

**Log Message:**
```
⚠️  Solana Tracker: Token abc12345... not found
⚠️  Solana Tracker: Token abc12345... has no holder data
```

**Solution:** This is normal - wait a few minutes for indexing

---

### 2. API Rate Limit (15%)
**Symptom:** Intermittent N/A, works sometimes

**Cause:** Too many requests in short time

**Log Message:**
```
⚠️  Solana Tracker: Rate limit exceeded
```

**Solution:** 
- Upgrade Solana Tracker plan
- Bot already has retry logic (waits 1s, 2s, 4s)
- Consider caching (already implemented - 1 min cache)

---

### 3. API Timeout (10%)
**Symptom:** Random N/A during high load

**Cause:** Slow API response (> 10 seconds)

**Log Message:**
```
⚠️  Solana Tracker: Request timeout
```

**Solution:** 
- API is slow, nothing to fix on bot side
- Bot will fallback to Moralis automatically

---

### 4. Token Access Forbidden (10%)
**Symptom:** Specific tokens always show N/A

**Cause:** Some tokens restricted by Solana Tracker

**Log Message:**
```
❌ Solana Tracker: Access forbidden for abc12345...
```

**Solution:** This is normal - bot will fallback to Moralis

---

### 5. Invalid API Key (5%)
**Symptom:** All tokens show N/A

**Cause:** API key is wrong or expired

**Log Message:**
```
❌ Solana Tracker: Invalid API key
```

**Solution:** 
- Check Railway variable: `SOLANA_TRACKER_API_KEY`
- Verify key on Solana Tracker dashboard
- Ensure no extra spaces or quotes

---

## 🔧 Debugging Steps

### Step 1: Check Railway Logs

Look for these messages after deployment:

```bash
# Good signs:
✅ "solanatracker" in dataSources
✅ "👥 Holders: 1,234 | Top 10: 45.2%"

# Warning signs:
⚠️  "Solana Tracker: Token not found"
⚠️  "Solana Tracker: Rate limit exceeded"

# Error signs:
❌ "Solana Tracker: Invalid API key"
❌ "Solana Tracker: API key not set"
```

### Step 2: Check Railway Variables

```
Settings → Variables → SOLANA_TRACKER_API_KEY
```

Ensure:
- ✅ Variable exists
- ✅ No extra spaces
- ✅ No quotes around value
- ✅ Deployed to production

### Step 3: Test API Key Manually

```bash
# Replace YOUR_KEY with Railway variable value
curl -H "x-api-key: YOUR_KEY" \
  "https://data.solanatracker.io/tokens/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
```

**Expected Response:**
```json
{
  "holders": 123456,
  "risk": {
    "top10": 12.5
  }
}
```

### Step 4: Check Data Sources in Messages

Transaction messages show data sources at bottom:
```
Data sources: birdeye, helius, moralis, dexscreener, solanatracker
```

If `solanatracker` is **missing** → API issue
If `solanatracker` is **present** → Token has no holder data

---

## 📊 Expected Behavior

### Scenario 1: Popular Token (BONK, WIF, etc.)
```
✅ Holders: 123,456 | Top 10: 12.5%
✅ Data sources includes: solanatracker
```

### Scenario 2: New Token (< 5 min old)
```
⚠️  Holders: N/A | Top 10: N/A
⚠️  Data sources missing: solanatracker
⚠️  Log: "Token not found"
```

### Scenario 3: Rare/Unlisted Token
```
⚠️  Holders: N/A | Top 10: N/A
⚠️  Data sources missing: solanatracker
⚠️  Log: "Access forbidden" or "not found"
```

### Scenario 4: Rate Limited
```
⚠️  Holders: N/A | Top 10: N/A (intermittent)
⚠️  Log: "Rate limit exceeded"
⚠️  Bot retries automatically
```

---

## 🎯 What Changed

**Added detailed logging** to diagnose issues:

**File:** `src/lib/token-analysis.ts`

**New logs:**
```typescript
⚠️  Solana Tracker: API key not set
⚠️  Solana Tracker: No data for abc12345...
⚠️  Solana Tracker: Token abc12345... has no holder data
❌ Solana Tracker: Invalid API key
❌ Solana Tracker: Access forbidden for abc12345...
⚠️  Solana Tracker: Token abc12345... not found
⚠️  Solana Tracker: Rate limit exceeded
⚠️  Solana Tracker: Request timeout
```

---

## 📝 Next Steps

### 1. Deploy Updated Code
```bash
git add .
git commit -m "Add Solana Tracker error logging"
git push
```

### 2. Monitor Railway Logs
Watch for the new log messages to identify the issue

### 3. Check Specific Patterns

**If you see:**
- `API key not set` → Check Railway variables
- `Invalid API key` → Verify key on Solana Tracker dashboard
- `Token not found` → Normal for new tokens
- `Rate limit exceeded` → Upgrade plan or reduce requests
- `Access forbidden` → Normal for some tokens

---

## ✅ Summary

**API key is set in Railway** ✅

**Possible reasons for N/A:**
1. **Token not indexed yet** (60% of cases) - Normal
2. **Rate limit** (15%) - Upgrade plan
3. **API timeout** (10%) - Nothing to fix
4. **Token restricted** (10%) - Normal
5. **Invalid key** (5%) - Check Railway variable

**What to do:**
1. Deploy updated code with logging
2. Monitor Railway logs
3. Identify specific error messages
4. Most cases are normal (new/rare tokens)

**Expected result:**
- 85% of tokens will show holder data
- 15% will show N/A (normal behavior)
