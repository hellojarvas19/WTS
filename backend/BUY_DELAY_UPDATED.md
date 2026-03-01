# ⏸️ 5-Second BUY Delay (Updated)

## 🎯 What It Does

**Adds a 5-second delay between BUY messages** from the same wallet.

**Important:** Messages are NOT ignored - they are DELAYED and then sent.

---

## 📊 Behavior

### Example Timeline

```
00:00 - BUY #1 → ✅ Sent immediately
00:02 - BUY #2 → ⏸️  Wait 3s → ✅ Sent at 00:05
00:04 - BUY #3 → ⏸️  Wait 1s → ✅ Sent at 00:10
00:11 - BUY #4 → ✅ Sent immediately (5s passed)
```

### With SELL Transactions

```
00:00 - BUY #1  → ✅ Sent immediately
00:02 - SELL #1 → ✅ Sent immediately (no delay)
00:03 - BUY #2  → ⏸️  Wait 2s → ✅ Sent at 00:05
00:06 - SELL #2 → ✅ Sent immediately (no delay)
```

---

## ✅ Key Points

- ✅ **All BUY messages are sent** (none ignored)
- ✅ **5-second minimum gap** between BUYs
- ✅ **SELL has no delay** (sent immediately)
- ✅ **Per-wallet tracking** (independent delays)

---

## 📋 Log Messages

**Sent Immediately:**
```
🟢 BUY BONK • Raydium
```

**Delayed:**
```
⏸️  Cooldown: Waiting 3.2s before sending BUY for abc12345...
🟢 BUY BONK • Raydium
```

---

## 🎯 Benefits

- ✅ Prevents spam bans (rate limiting)
- ✅ All messages delivered (no data loss)
- ✅ Cleaner message flow
- ✅ SELL messages unaffected

---

## 🚀 Deploy

```bash
git add src/lib/watch-transactions.ts
git commit -m "Add 5-second delay between BUY messages"
git push
```

---

## Status

🟢 **Ready to deploy - All BUY messages will be sent with delay**
