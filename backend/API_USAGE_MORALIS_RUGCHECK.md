# 🔍 Moralis & RugCheck API Usage

## 📊 Moralis API

### What It Provides
Moralis is a **Web3 data provider** that gives real-time blockchain data.

### Used For (4 endpoints)

#### 1. **Token Metadata**
```
GET https://solana-gateway.moralis.io/token/mainnet/{mint}/metadata
```
**Returns:**
- Token name, symbol, decimals
- Token description
- Logo/image URL
- Contract addresses

---

#### 2. **Token Price** 💰
```
GET https://solana-gateway.moralis.io/token/mainnet/{mint}/price
```
**Returns:**
- Current price in USD
- Price in SOL
- 24h price change
- Exchange rate data

**Used for:** Real-time token pricing in notifications

---

#### 3. **DEX Pairs** 📈
```
GET https://solana-gateway.moralis.io/token/mainnet/{mint}/pairs
```
**Returns:**
- All DEX pairs (Raydium, Orca, etc.)
- Liquidity per pair
- Volume data
- Pool addresses

**Used for:** Finding best liquidity pools, calculating total liquidity

---

#### 4. **Holders Count** 👥
```
GET https://solana-gateway.moralis.io/token/mainnet/{mint}/holders
```
**Returns:**
- Total number of token holders
- Holder distribution data

**Used for:** Holder count in transaction messages

---

### Priority in Data Flow
**Moralis = Secondary Source**
- Used when Helius/DexScreener unavailable
- Provides backup price data
- Supplements holder information

---

## 🛡️ RugCheck API

### What It Provides
RugCheck is a **free security analysis tool** for Solana tokens.

### Used For (1 endpoint)

```
GET https://api.rugcheck.xyz/v1/tokens/{mint}/report
```

**Returns:**

#### 1. **Security Info** 🔒
- Mint authority status (revoked/active)
- Freeze authority status (revoked/active)
- Risk score (0-100)
- Risk descriptions (array of warnings)

**Used for:** Security flags in messages (✅MR, ✅FR)

---

#### 2. **LP Lock Info** 🔥
- LP locked percentage
- LP burn status
- Total liquidity in USD
- Market pool addresses

**Used for:** 
- "🔥LP" indicator (LP burned/locked)
- Liquidity calculations

---

#### 3. **Top Holders** 📊
- Top 20 holder addresses
- Holding percentages
- Filters out pool/bonding curve accounts

**Used for:**
- Top 10 holder percentage
- Dev holding detection
- Whale analysis

---

#### 4. **Risk Analysis** ⚠️
- Risk level: Low/Medium/High/Critical
- Specific risk warnings
- Security red flags

**Used for:** Risk emoji and level in messages (🟢🟡🟠🔴)

---

## 🎯 How They Work Together

### Data Priority Flow
```
1. Helius DAS (Primary)
   ↓ (if missing data)
2. DexScreener
   ↓ (if missing data)
3. Moralis (Backup)
   ↓ (security verification)
4. RugCheck (Security)
   ↓ (additional data)
5. GMGN (Trading signals)
```

---

## 📱 In Your Transaction Messages

### From Moralis:
```
💰 Price: $0.00001234  ← Moralis price API
💧 Liquidity: $45.2K   ← Moralis pairs API
👥 Holders: 1,234      ← Moralis holders API
```

### From RugCheck:
```
🔒 SECURITY
✅MR • ✅FR • 🔥LP     ← RugCheck security data
🟢 LOW RISK            ← RugCheck risk score
📊 Top 10: 23.4%       ← RugCheck top holders
```

---

## 💡 Why Both?

### Moralis Strengths:
- ✅ Real-time price data
- ✅ Comprehensive DEX pair info
- ✅ Accurate holder counts
- ✅ Fast response times

### RugCheck Strengths:
- ✅ **FREE** (no API key needed)
- ✅ Security-focused analysis
- ✅ LP lock detection
- ✅ Risk scoring
- ✅ Filters pool accounts from holders

---

## 🔑 API Keys

### Moralis
```env
MORALIS_API_KEY=your_key_here
```
**Get key:** https://moralis.io

**Optional:** Bot works without it (uses other sources)

### RugCheck
**No API key needed!** ✅ Completely free

---

## 📊 Example Data Flow

### User sees transaction:
```
🟢 BUY $BONK
💰 Price: $0.00001234    ← Moralis
💧 Liquidity: $45.2K     ← Moralis
👥 Holders: 1,234        ← Moralis
✅MR • ✅FR • 🔥LP       ← RugCheck
🟢 LOW RISK              ← RugCheck
📊 Top 10: 23.4%         ← RugCheck
```

**Behind the scenes:**
1. Helius fetches basic token info
2. Moralis gets price + liquidity + holders
3. RugCheck verifies security + LP status
4. All combined into one message

---

## ⚙️ Configuration

### Enable/Disable
Both are part of enhanced metadata:
```env
ENABLE_ENHANCED_METADATA=true
```

### Fallback Behavior
- **No Moralis key?** → Uses DexScreener/Helius only
- **RugCheck down?** → Shows basic security info from RPC
- **Both unavailable?** → Shows basic transaction data

---

## 🎯 Summary

| API | Purpose | Cost | Required |
|-----|---------|------|----------|
| **Moralis** | Price, Liquidity, Holders | Paid | No (optional) |
| **RugCheck** | Security, Risk, LP Status | Free | No (optional) |

**Both enhance your bot's data but aren't required for basic functionality!**
