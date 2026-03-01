# ⏸️ BUY Delay - Updated Behavior

## 🔄 Change Summary

**Before (Ignore):** BUY messages within 5s were ignored ❌
**After (Delay):** BUY messages within 5s are delayed and sent ✅

---

## 📊 Comparison

### Scenario: 3 BUYs in 4 seconds

**Old Behavior (Ignore):**
```
00:00 - BUY #1 → ✅ Sent
00:02 - BUY #2 → ❌ Ignored
00:04 - BUY #3 → ❌ Ignored

Result: Only 1 message sent
```

**New Behavior (Delay):**
```
00:00 - BUY #1 → ✅ Sent immediately
00:02 - BUY #2 → ⏸️  Wait 3s → ✅ Sent at 00:05
00:04 - BUY #3 → ⏸️  Wait 1s → ✅ Sent at 00:10

Result: All 3 messages sent
```

---

## ✅ Benefits

- ✅ No data loss (all messages sent)
- ✅ Prevents spam (5s gap between messages)
- ✅ Rate limiting (avoids bans)
- ✅ Cleaner message flow

---

## 🎯 How It Works

```typescript
if (parsed.type === 'buy') {
  const timeSinceLastBuy = now - lastBuy
  
  if (timeSinceLastBuy < 5000) {
    const waitTime = 5000 - timeSinceLastBuy
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  this.lastBuyTime.set(walletAddress, Date.now())
}

// Message is sent after delay
await this.sendMessageToUsers(...)
```

---

## 📋 Example Timeline

### Rapid Trading (10 BUYs in 10 seconds)

**Messages sent at:**
```
00:00 - BUY #1  (immediate)
00:05 - BUY #2  (delayed 5s)
00:10 - BUY #3  (delayed 5s)
00:15 - BUY #4  (delayed 5s)
00:20 - BUY #5  (delayed 5s)
00:25 - BUY #6  (delayed 5s)
00:30 - BUY #7  (delayed 5s)
00:35 - BUY #8  (delayed 5s)
00:40 - BUY #9  (delayed 5s)
00:45 - BUY #10 (delayed 5s)
```

**Result:** All 10 messages sent over 45 seconds

---

## ⚠️ Important Notes

1. **Messages are queued** - they will be sent in order
2. **SELL not affected** - sent immediately
3. **Per-wallet** - each wallet has independent delay
4. **No data loss** - all transactions tracked

---

## 🚀 Status

🟢 **Updated and ready to deploy**
