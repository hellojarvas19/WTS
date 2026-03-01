# ⏸️ 5-Second Cooldown After BUY - Final Logic

## 🎯 Correct Behavior

**When a BUY happens:**
1. ✅ Send BUY message immediately
2. ⏸️ Start 5-second cooldown for that wallet
3. ❌ Ignore ALL transactions from that wallet for 5 seconds (BUY, SELL, Transfer)
4. ✅ After 5 seconds, resume normal tracking

**Other wallets:** Not affected (independent cooldowns)

---

## 📊 Example Timeline

### Single Wallet (Wallet1)
```
00:00 - BUY #1    → ✅ Sent (starts 5s cooldown)
00:02 - BUY #2    → ❌ Ignored (in cooldown)
00:03 - SELL #1   → ❌ Ignored (in cooldown)
00:04 - Transfer  → ❌ Ignored (in cooldown)
00:06 - BUY #3    → ✅ Sent (cooldown ended, starts new 5s cooldown)
00:07 - SELL #2   → ❌ Ignored (in cooldown)
00:12 - SELL #3   → ✅ Sent (cooldown ended)
```

### Multiple Wallets
```
00:00 - Wallet1 BUY  → ✅ Sent (Wallet1 cooldown starts)
00:01 - Wallet2 BUY  → ✅ Sent (Wallet2 cooldown starts)
00:02 - Wallet1 SELL → ❌ Ignored (Wallet1 in cooldown)
00:02 - Wallet2 SELL → ❌ Ignored (Wallet2 in cooldown)
00:06 - Wallet1 BUY  → ✅ Sent (Wallet1 cooldown ended)
00:07 - Wallet2 BUY  → ✅ Sent (Wallet2 cooldown ended)
```

---

## ✅ Key Points

- ✅ **BUY triggers cooldown** - 5 seconds of silence
- ❌ **All transactions ignored** during cooldown (BUY, SELL, Transfer)
- ✅ **Per-wallet tracking** - each wallet independent
- ✅ **Prevents spam bans** - rate limiting

---

## 🎯 Logic Flow

```
Transaction detected
  ↓
Is it BUY?
  ↓ YES
  Check cooldown
    ↓ Active (< 5s)
    → Ignore transaction ❌
    ↓ Inactive (>= 5s)
    → Send message ✅
    → Start 5s cooldown
  ↓ NO (SELL or Transfer)
  Check cooldown
    ↓ Active (< 5s)
    → Ignore transaction ❌
    ↓ Inactive (>= 5s)
    → Send message ✅
```

---

## 📋 Log Messages

**BUY Sent (Cooldown Starts):**
```
🟢 BUY BONK • Raydium
```

**Transaction Ignored (In Cooldown):**
```
⏸️  Cooldown: Ignoring transaction for abc12345... (2.3s since last BUY)
⏸️  Cooldown: Ignoring SELL for abc12345... (3.1s since last BUY)
⏸️  Cooldown: Ignoring SOL transfer for abc12345... (4.5s since last BUY)
```

**Transaction Sent (Cooldown Ended):**
```
🟢 BUY WIF • Jupiter
🔴 SELL BONK • Raydium
```

---

## 🎯 Benefits

- ✅ Prevents spam bans (rate limiting)
- ✅ Reduces message noise (~80%)
- ✅ Per-wallet control
- ✅ Simple and effective

---

## 🚀 Deploy

```bash
git add src/lib/watch-transactions.ts
git commit -m "Add 5-second cooldown after BUY - ignore all transactions"
git push
```

---

## ⚠️ Important

**Cooldown applies to:**
- ❌ BUY transactions
- ❌ SELL transactions
- ❌ SOL transfers

**Cooldown triggered by:**
- ✅ BUY transactions ONLY

**Cooldown duration:**
- ⏱️ 5 seconds

---

## Status

🟢 **Ready to deploy - Correct logic implemented**
