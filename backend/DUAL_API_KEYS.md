# 🔑 Dual API Keys for Solana Tracker

## Overview
You can now use **separate API keys** for different Solana Tracker endpoints to manage rate limits better.

---

## Configuration Options

### Option 1: Single API Key (Default)
Use the same key for both endpoints:

```env
SOLANA_TRACKER_API_KEY=your_api_key_here
```

**Used for:**
- ✅ Token info endpoint (`/tokens/{address}`)
- ✅ Holders endpoint (`/tokens/{address}/holders/top`)

---

### Option 2: Separate API Keys (Recommended)
Use different keys for each endpoint:

```env
SOLANA_TRACKER_API_KEY=key_for_token_info
SOLANA_TRACKER_HOLDERS_API_KEY=key_for_holders_list
```

**Distribution:**
- `SOLANA_TRACKER_API_KEY` → Token info endpoint
- `SOLANA_TRACKER_HOLDERS_API_KEY` → Holders list endpoint

---

## Why Use Separate Keys?

### Rate Limit Management
Different endpoints have different rate limits:

| Endpoint | Usage Frequency | Rate Limit Impact |
|----------|----------------|-------------------|
| Token Info | Every transaction | High |
| Holders List | Every transaction | High |

**With separate keys:**
- Each key has its own rate limit
- Reduces chance of hitting limits
- Better reliability

---

## Endpoint Details

### 1. Token Info Endpoint
**URL:** `GET /tokens/{tokenAddress}`

**Uses:** `SOLANA_TRACKER_API_KEY`

**Returns:**
```json
{
  "holders": 988972,
  "risk": {
    "top10": 35.06
  }
}
```

**Priority:** **HIGH** - Essential data

---

### 2. Holders List Endpoint
**URL:** `GET /tokens/{tokenAddress}/holders/top`

**Uses:** `SOLANA_TRACKER_HOLDERS_API_KEY` (or falls back to `SOLANA_TRACKER_API_KEY`)

**Returns:**
```json
[
  {
    "address": "2RH6rUTP...",
    "amount": 800000026.907734,
    "percentage": 80.00005992080315
  }
]
```

**Priority:** **MEDIUM** - Optional detailed data

---

## Fallback Behavior

### If Only One Key Set
```env
SOLANA_TRACKER_API_KEY=your_key
# SOLANA_TRACKER_HOLDERS_API_KEY not set
```

**Result:** Both endpoints use `SOLANA_TRACKER_API_KEY`

### If Both Keys Set
```env
SOLANA_TRACKER_API_KEY=key1
SOLANA_TRACKER_HOLDERS_API_KEY=key2
```

**Result:** Each endpoint uses its dedicated key

### If Neither Key Set
```env
# Both empty
```

**Result:** Skips Solana Tracker, falls back to other sources (Moralis, RugCheck)

---

## Example Configurations

### Basic Setup (Single Key)
```env
SOLANA_TRACKER_API_KEY=b06990e4-8620-41a1-9757-235932f69d7a
ENABLE_ENHANCED_METADATA=true
```

### Advanced Setup (Dual Keys)
```env
SOLANA_TRACKER_API_KEY=key_for_token_info_endpoint
SOLANA_TRACKER_HOLDERS_API_KEY=key_for_holders_endpoint
ENABLE_ENHANCED_METADATA=true
```

### Partial Setup (Token Info Only)
```env
SOLANA_TRACKER_API_KEY=your_key
# SOLANA_TRACKER_HOLDERS_API_KEY not set
# Will use same key for both, or skip holders if rate limited
```

---

## Logging

The bot logs which keys are being used:

**Both keys set:**
```
✅ Solana Tracker: 988972 holders, top10: 35.06%
```

**Only token info succeeds:**
```
✅ Solana Tracker: 988972 holders, top10: 35.06%
❌ Solana Tracker holders failed: Rate limit reached
```

**No keys set:**
```
⚠️ SOLANA_TRACKER_API_KEY not set - skipping holders data
```

---

## Benefits

| Feature | Single Key | Dual Keys |
|---------|-----------|-----------|
| **Setup** | ✅ Simple | ⚠️ More config |
| **Rate Limits** | ❌ Shared | ✅ **Separate** |
| **Reliability** | ⚠️ Good | ✅ **Better** |
| **Cost** | 💰 1 key | 💰💰 2 keys |

---

## Recommendation

**For most users:** Use single key (Option 1)

**For high-volume bots:** Use dual keys (Option 2)

---

## Testing

Test your configuration:
```bash
# Set your keys in .env
SOLANA_TRACKER_API_KEY=key1
SOLANA_TRACKER_HOLDERS_API_KEY=key2

# Restart bot
pnpm start

# Watch logs for:
✅ Solana Tracker: 988972 holders, top10: 35.06%
```

---

**Status:** ✅ Implemented
**Backward Compatible:** Yes (single key still works)
**Breaking Changes:** None
