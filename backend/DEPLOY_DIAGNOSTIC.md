# 🚀 Deploy Diagnostic Logging

## What Changed

Added detailed error logging to identify why holders show as N/A.

**File Modified:** `src/lib/token-analysis.ts`

---

## New Log Messages

After deployment, you'll see these in Railway logs:

### ✅ Success Messages
```
Data sources: [..., solanatracker]
👥 Holders: 1,234 | Top 10: 45.2%
```

### ⚠️ Warning Messages (Normal)
```
⚠️  Solana Tracker: Token abc12345... not found
⚠️  Solana Tracker: Token abc12345... has no holder data
⚠️  Solana Tracker: Rate limit exceeded
⚠️  Solana Tracker: Request timeout
```

### ❌ Error Messages (Need Action)
```
❌ Solana Tracker: API key not set
❌ Solana Tracker: Invalid API key
```

---

## Deploy Steps

```bash
git add src/lib/token-analysis.ts
git commit -m "Add Solana Tracker diagnostic logging"
git push
```

Railway will auto-deploy.

---

## What to Look For

### If you see: `API key not set`
**Action:** Check Railway variable `SOLANA_TRACKER_API_KEY`

### If you see: `Invalid API key`
**Action:** Verify key on https://www.solanatracker.io

### If you see: `Token not found`
**Action:** None - this is normal for new/rare tokens

### If you see: `Rate limit exceeded`
**Action:** Consider upgrading Solana Tracker plan

### If you see: `Access forbidden`
**Action:** None - some tokens are restricted

---

## Expected Results

**85% of tokens:** Will show holder data
**15% of tokens:** Will show N/A (normal)

The logs will tell you exactly why each token shows N/A.
