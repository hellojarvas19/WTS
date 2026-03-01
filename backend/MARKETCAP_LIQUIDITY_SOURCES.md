# 💰 Market Cap & Liquidity - Data Sources

## 📊 How We Fetch Market Cap

### Priority Order (First Valid Value Wins)

#### 1. **DexScreener** (Primary)
```typescript
marketCap: data.marketCap
```
**Source:** `https://api.dexscreener.com/latest/dex/tokens/{mint}`

**Calculation:** Real-time from DEX pairs
- Most accurate for actively traded tokens
- Updates every few seconds
- Includes all major DEXs

---

#### 2. **GMGN** (Secondary)
```typescript
marketCap: data.market_cap
```
**Source:** `https://gmgn.ai/defi/quotation/v1/tokens/sol/{mint}`

**Calculation:** Aggregated from multiple sources
- Good for new/trending tokens
- Includes bonding curve data
- Fast updates

---

#### 3. **Pump.fun** (For Pump Tokens)
```typescript
marketCap: data.market_cap
```
**Source:** `https://frontend-api-v3.pump.fun/coins/{mint}`

**Calculation:** Bonding curve formula
- Accurate for tokens on bonding curve
- Real-time updates
- Includes migration status

---

#### 4. **Moralis** (Fallback)
```typescript
// Calculated from pairs data
marketCap = price * totalSupply
```
**Source:** `https://solana-gateway.moralis.io/token/mainnet/{mint}/price`

**Calculation:** Price × Total Supply
- Backup when others unavailable
- May be slightly delayed

---

## 💧 How We Fetch Liquidity

### Priority Order (First Valid Value Wins)

#### 1. **DexScreener** (Primary)
```typescript
liquidity: data.liquidity.usd
```
**Source:** `https://api.dexscreener.com/latest/dex/tokens/{mint}`

**Returns:** Total USD liquidity across all pairs
- Most comprehensive
- Includes all DEXs (Raydium, Orca, Meteora, etc.)
- Real-time updates

**Example:**
```json
{
  "liquidity": {
    "usd": 125430.50,
    "base": 1234567,
    "quote": 125.43
  }
}
```

---

#### 2. **GMGN** (Secondary)
```typescript
liquidity: data.liquidity
```
**Source:** `https://gmgn.ai/defi/quotation/v1/tokens/sol/{mint}`

**Returns:** Aggregated liquidity
- Good for trending tokens
- Fast updates
- Includes bonding curve liquidity

---

#### 3. **Moralis** (Fallback)
```typescript
// Sum of all pairs
totalLiquidity = pairs.reduce((sum, pair) => 
  sum + (pair.liquidityUsd || 0), 0
)
```
**Source:** `https://solana-gateway.moralis.io/token/mainnet/{mint}/pairs`

**Returns:** Sum of liquidity from all pairs
- Backup source
- May miss some DEXs

---

#### 4. **RugCheck** (Verification)
```typescript
totalLiquidityUsd = markets.reduce((sum, market) => 
  sum + (market.lp?.quoteUSD || 0), 0
)
```
**Source:** `https://api.rugcheck.xyz/v1/tokens/{mint}/report`

**Returns:** Liquidity from known markets
- Used for verification
- Includes LP lock info

---

## 🔄 Data Merge Logic

### Code Flow
```typescript
// Fetch from all sources in parallel
const [dexscreener, gmgn, moralis, rugcheck] = await Promise.allSettled([
  fetchDexScreener(mint),
  fetchGMGN(mint),
  fetchMoralis(mint),
  fetchRugCheck(mint),
])

// Merge with priority
result.marketCap = dexscreener.marketCap 
  || gmgn.marketCap 
  || pumpfun.marketCap 
  || (moralis.price * totalSupply)

result.liquidity = dexscreener.liquidity.usd 
  || gmgn.liquidity 
  || moralisTotal 
  || rugcheck.totalLiquidityUsd
```

---

## 📊 Real Example

### Token: $BONK

**DexScreener Response:**
```json
{
  "marketCap": 1234567890,
  "liquidity": {
    "usd": 5432100
  }
}
```

**GMGN Response:**
```json
{
  "market_cap": 1234500000,
  "liquidity": 5430000
}
```

**Final Result:**
```typescript
{
  marketCap: 1234567890,    // From DexScreener (primary)
  liquidity: 5432100,       // From DexScreener (primary)
  liquidityRatio: 0.0044    // Calculated: liquidity / marketCap
}
```

---

## 🎯 Why Multiple Sources?

### Redundancy
- If DexScreener is down → Use GMGN
- If GMGN is down → Use Moralis
- Always have data available

### Accuracy
- Cross-verify between sources
- Detect anomalies
- Use most reliable source

### Coverage
- DexScreener: Best for established tokens
- GMGN: Best for new/trending tokens
- Pump.fun: Best for bonding curve tokens
- Moralis: Best for backup

---

## 📱 In Transaction Messages

```
💰 Market Cap: $1.23M    ← DexScreener
💧 Liquidity: $45.2K     ← DexScreener
📊 Ratio: 3.7%           ← Calculated
```

**Data Sources Shown:**
```typescript
result.dataSources = [
  'helius',
  'dexscreener',  // ← Market cap & liquidity from here
  'gmgn',
  'rugcheck',
  'solanatracker'
]
```

---

## ⚙️ Configuration

Enable in `.env`:
```env
ENABLE_ENHANCED_METADATA=true
```

**No API keys needed for:**
- ✅ DexScreener (free)
- ✅ RugCheck (free)
- ✅ Pump.fun (free)

**Optional API keys:**
- Moralis (backup source)
- GMGN (enhanced data)

---

## 🔍 Calculation Details

### Market Cap Formula
```
Market Cap = Token Price × Circulating Supply
```

### Liquidity Calculation
```
Total Liquidity = Sum of all DEX pair liquidity
```

### Liquidity Ratio
```
Liquidity Ratio = Liquidity / Market Cap
```

**Healthy ratio:** 3-10%  
**Low liquidity:** < 1%  
**High liquidity:** > 20%

---

## 🎯 Summary

| Metric | Primary Source | Fallback | Update Speed |
|--------|---------------|----------|--------------|
| **Market Cap** | DexScreener | GMGN → Moralis | Real-time |
| **Liquidity** | DexScreener | GMGN → Moralis | Real-time |

**Both metrics are fetched in parallel and merged with priority-based logic!**
