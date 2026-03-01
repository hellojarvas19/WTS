# 🔧 Group Messages Not Working - Quick Fix

## 🐛 Problem

Group BUY messages not being sent OR sent by bot instead of your personal account.

---

## ✅ Solution

Add these 3 environment variables to Railway:

### 1. Get API Credentials

**Go to:** https://my.telegram.org

- Log in
- API development tools
- Create app
- Copy `api_id` and `api_hash`

### 2. Generate Session String

**Quick method:**

```bash
npm install telegram input
```

Create `generate-session.js`:
```javascript
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');

const apiId = YOUR_API_ID;
const apiHash = 'YOUR_API_HASH';

(async () => {
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text('Phone: '),
    password: async () => await input.text('Password: '),
    phoneCode: async () => await input.text('Code: '),
    onError: (err) => console.log(err),
  });

  console.log('Session:', client.session.save());
  await client.disconnect();
})();
```

Run: `node generate-session.js`

### 3. Add to Railway

**Variables:**
```
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abc123def456
TELEGRAM_SESSION_STRING=1AgAOMTQ5LjE1NC4xNjcuNTEBu...
```

### 4. Redeploy

Railway will auto-redeploy.

---

## 🧪 Verify

**Check logs for:**
```
✅ Telegram User API configured
```

**Test:**
- Wait for BUY transaction
- Check group
- Message should appear from YOUR account (not bot)

---

## ⚠️ Important

- Keep session string private
- You must be in the group
- Session may expire (regenerate if needed)

---

**Status:** Add 3 variables → Redeploy → Test
