# ⏸️ Cooldown Logic - Quick Summary

## 🎯 What Happens

**When BUY occurs:**
1. ✅ Send BUY message
2. ⏸️ Start 5-second cooldown
3. ❌ Ignore ALL transactions for 5 seconds
4. ✅ Resume after 5 seconds

---

## 📊 Example

```
Wallet1:
00:00 - BUY    → ✅ Sent (cooldown starts)
00:02 - BUY    → ❌ Ignored
00:03 - SELL   → ❌ Ignored
00:04 - Transfer → ❌ Ignored
00:06 - BUY    → ✅ Sent (cooldown ended)

Wallet2:
00:01 - BUY    → ✅ Sent (independent cooldown)
00:03 - SELL   → ❌ Ignored
00:07 - SELL   → ✅ Sent (cooldown ended)
```

---

## ✅ Rules

- **Cooldown triggered by:** BUY only
- **Cooldown affects:** ALL transactions (BUY, SELL, Transfer)
- **Duration:** 5 seconds
- **Scope:** Per wallet (independent)

---

## 🚀 Deploy

```bash
git add src/lib/watch-transactions.ts
git commit -m "Add 5-second cooldown after BUY"
git push
```

**Status:** 🟢 Ready
