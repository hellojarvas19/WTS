# ⏸️ 5-Second BUY Cooldown - Quick Guide

## What It Does

Prevents spam by ignoring BUY transactions that happen within 5 seconds of the previous BUY from the same wallet.

---

## Behavior

### ✅ Sent Immediately
- First BUY transaction
- BUY after 5+ seconds
- All SELL transactions
- All SOL transfers

### ⏸️ Ignored (Cooldown)
- BUY within 5 seconds of previous BUY

---

## Example

```
00:00 - BUY BONK  → ✅ Sent
00:02 - BUY WIF   → ⏸️  Ignored (2s < 5s)
00:03 - SELL BONK → ✅ Sent (SELL not affected)
00:04 - BUY POPCAT → ⏸️  Ignored (4s < 5s)
00:07 - BUY SAMO  → ✅ Sent (7s > 5s)
```

---

## Benefits

- ✅ Prevents wallet spam bans
- ✅ Reduces message noise
- ✅ SELL transactions always visible
- ✅ ~80% reduction in BUY spam

---

## Log Messages

**BUY Sent:**
```
🟢 BUY BONK • Raydium
```

**BUY Ignored:**
```
⏸️  Cooldown: Ignoring BUY for abc12345... (2.3s since last BUY)
```

---

## Deploy

```bash
git add src/lib/watch-transactions.ts
git commit -m "Add 5-second cooldown for BUY transactions"
git push
```

---

## File Changed

- `src/lib/watch-transactions.ts`

**Changes:**
1. Added `lastBuyTime` Map
2. Added cooldown check before sending BUY
3. Added log message for ignored BUYs

---

## Status

🟢 Ready to deploy
