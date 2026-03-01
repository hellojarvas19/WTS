# 🔧 Group Messages Not Sending - Fix Guide

## 🐛 Problem

Group BUY messages are being sent by the bot instead of using Telegram User API (API ID, Hash, Session).

**Current behavior:** Messages not appearing in groups OR sent by bot account

**Expected behavior:** Messages sent by your personal Telegram account via User API

---

## 🔍 Root Cause

The code checks if Telegram User API is configured:

```typescript
export function isTelegramUserConfigured(): boolean {
  return !!(API_ID && API_HASH && SESSION_STRING)
}

private async sendBuyMessageToGroups(...) {
  if (!isTelegramUserConfigured()) return  // ❌ Exits if not configured
  // ... rest of code
}
```

**If these variables are missing, group messages are NOT sent at all.**

---

## ✅ Solution

You need to configure Telegram User API credentials in Railway.

### Step 1: Get Telegram API Credentials

**Go to:** https://my.telegram.org

1. Log in with your phone number
2. Go to "API development tools"
3. Create an app (any name/description)
4. Copy:
   - `api_id` (number)
   - `api_hash` (string)

---

### Step 2: Generate Session String

You need to generate a session string for your Telegram account.

**Option A: Use Telegram Session Generator**

1. Install dependencies:
```bash
npm install telegram
```

2. Create a script `generate-session.js`:
```javascript
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');

const apiId = YOUR_API_ID;  // Replace with your API ID
const apiHash = 'YOUR_API_HASH';  // Replace with your API hash
const stringSession = new StringSession('');

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text('Phone number: '),
    password: async () => await input.text('Password (if 2FA): '),
    phoneCode: async () => await input.text('Code from Telegram: '),
    onError: (err) => console.log(err),
  });

  console.log('Session string:', client.session.save());
  await client.disconnect();
})();
```

3. Run:
```bash
node generate-session.js
```

4. Enter your phone number and verification code
5. Copy the session string

**Option B: Use Online Generator**

Search for "Telegram session string generator" - there are several tools available.

---

### Step 3: Add to Railway Environment Variables

**Go to Railway → Your Project → Variables**

Add these 3 variables:

```
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
TELEGRAM_SESSION_STRING=your_long_session_string_here
```

**Important:**
- `TELEGRAM_API_ID` is a NUMBER (no quotes)
- `TELEGRAM_API_HASH` is a STRING
- `TELEGRAM_SESSION_STRING` is a LONG STRING

---

### Step 4: Redeploy

Railway will automatically redeploy with the new variables.

---

## 🧪 Verify It's Working

### Check Logs

After deployment, look for:

```
✅ Telegram User API configured
✅ Sending to group: -1001234567890
```

**If you see:**
```
⚠️  Telegram User API not configured, skipping group messages
```

Then the variables are missing or incorrect.

---

### Test in Group

1. Add a wallet that makes transactions
2. Wait for a BUY transaction
3. Check your group

**Expected:** Message appears from YOUR personal account (not bot)

---

## 📋 Troubleshooting

### Issue: "Telegram User API not configured"

**Check:**
```bash
# In Railway logs, you should see:
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abc...
TELEGRAM_SESSION_STRING=1Ag...
```

**Fix:** Add all 3 variables to Railway

---

### Issue: "Failed to send to group"

**Possible causes:**
1. Your account is not in the group
2. Group ID is wrong
3. Session expired

**Fix:**
1. Make sure YOU (not the bot) are in the group
2. Check group ID format: `-1001234567890`
3. Regenerate session string

---

### Issue: "Session expired"

**Symptom:** Worked before, now doesn't

**Fix:** Regenerate session string (Step 2) and update Railway variable

---

## 🎯 Current Code Flow

```
BUY transaction detected
  ↓
sendBuyMessageToGroups()
  ↓
Check: isTelegramUserConfigured()?
  ↓ NO
  Return (skip group messages) ❌
  ↓ YES
  Get groups for user
  ↓
  Send via Telegram User API ✅
```

---

## ✅ Expected Behavior After Fix

**Private chats:** Sent by bot (normal)
**Group chats:** Sent by YOUR personal account via User API

**Why?** Telegram bots have limitations in groups. Using User API allows:
- Better formatting
- Photos/media
- No bot restrictions
- Appears as regular user message

---

## 📝 Summary

**Problem:** Missing Telegram User API credentials
**Solution:** Add 3 environment variables to Railway
**Variables needed:**
1. `TELEGRAM_API_ID`
2. `TELEGRAM_API_HASH`
3. `TELEGRAM_SESSION_STRING`

**Get them from:** https://my.telegram.org + session generator

**After adding:** Redeploy and test

---

## ⚠️ Security Note

**Keep your session string private!**
- It gives full access to your Telegram account
- Don't share it
- Don't commit it to git
- Only store in Railway environment variables

---

## 🚀 Quick Checklist

- [ ] Get API ID and Hash from https://my.telegram.org
- [ ] Generate session string
- [ ] Add all 3 variables to Railway
- [ ] Redeploy
- [ ] Check logs for "Telegram User API configured"
- [ ] Test with a BUY transaction
- [ ] Verify message appears in group from your account

**Status:** Ready to configure
