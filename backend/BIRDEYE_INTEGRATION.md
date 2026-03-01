# 🦅 Birdeye API Integration - Primary Source

## ✅ What Was Added

Birdeye API is now the **PRIMARY SOURCE** for market cap and liquidity data!

---

## 🎯 Priority Order (NEW)

### Market Cap & Liquidity
```
1. Birdeye      ← PRIMARY (NEW!)
2. DexScreener  ← Fallback
3. GMGN         ← Fallback
4. Moralis      ← Fallback
```

---

## 📊 Birdeye API Details

### Endpoint
```
GET https://public-api.birdeye.so/defi/token_overview?address={mint}
```

### Headers
```typescript
{
  'X-API-KEY': process.env.BIRDEYE_API_KEY,
  'Accept': 'application/json'
}
```

### Response Data
```json
{
  "data": {
    "price": 0.00001234,
    "mc": 1234567890,           // Market cap
    "liquidity": 5432100,       // Total liquidity
    "v24hUSD": 987654,          // 24h volume
    "priceChange24h": 15.5      // 24h price change %
  }
}
```

---

## 🔧 Implementation

### Files Modified (2)

**1. `src/lib/token-analysis.ts`**

Added:
- `fetchBirdeyeData()` method
- `mergeBirdeyeData()` method
- Birdeye as first data source in parallel fetch

**2. `.env.example`**

Added:
```env
BIRDEYE_API_KEY=your_key_here
```

---

## 📝 Code Changes

### Fetch Method
```typescript
private async fetchBirdeyeData(tokenMint: string): Promise<{
  priceUsd: number
  marketCap: number
  liquidity: number
  volume24h: number
  priceChange24h: number
} | null> {
  const apiKey = process.env.BIRDEYE_API_KEY
  if (!apiKey) return null

  const response = await axios.get(
    `https://public-api.birdeye.so/defi/token_overview?address=${tokenMint}`,
    {
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json',
      },
    }
  )

  return {
    priceUsd: data.price || 0,
    marketCap: data.mc || 0,
    liquidity: data.liquidity || 0,
    volume24h: data.v24hUSD || 0,
    priceChange24h: data.priceChange24h || 0,
  }
}
```

### Merge Method
```typescript
private mergeBirdeyeData(result, data) {
  return {
    ...result,
    priceUsd: data.priceUsd > 0 ? data.priceUsd : result.priceUsd,
    marketCap: data.marketCap > 0 ? data.marketCap : result.marketCap,
    liquidity: data.liquidity > 0 ? data.liquidity : result.liquidity,
    volume24h: data.volume24h > 0 ? data.volume24h : result.volume24h,
    priceChange24h: data.priceChange24h !== 0 ? data.priceChange24h : result.priceChange24h,
  }
}
```

### Data Flow
```typescript
const [
  birdeyeData,      // ← NEW! Fetched first
  heliusData,
  moralisData,
  gmgnData,
  dexscreenerData,
  // ...
] = await Promise.allSettled([
  this.fetchBirdeyeData(tokenMint),  // ← NEW!
  this.fetchHeliusDAS(tokenMint),
  // ...
])

// Merge Birdeye first (highest priority)
if (birdeyeData.status === 'fulfilled' && birdeyeData.value) {
  result = this.mergeBirdeyeData(result, birdeyeData.value)
  result.dataSources.push('birdeye')
}
```

---

## 🎯 Why Birdeye?

### Advantages
✅ **Most accurate** - Aggregates from all major DEXs  
✅ **Real-time** - Updates every few seconds  
✅ **Comprehensive** - Includes all liquidity pools  
✅ **Reliable** - Enterprise-grade API  
✅ **Fast** - Low latency responses  

### Coverage
- Raydium
- Orca
- Meteora
- Jupiter
- Pump.fun
- All other Solana DEXs

---

## ⚙️ Configuration

### 1. Get API Key
Visit: https://birdeye.so  
Sign up and get your API key

### 2. Add to .env
```env
ENABLE_ENHANCED_METADATA=true
BIRDEYE_API_KEY=your_api_key_here
```

### 3. Deploy
Birdeye will automatically become the primary source!

---

## 📊 Data Priority Example

### Token: $BONK

**Birdeye Response:**
```json
{
  "mc": 1234567890,
  "liquidity": 5432100
}
```

**DexScreener Response:**
```json
{
  "marketCap": 1234500000,
  "liquidity": { "usd": 5430000 }
}
```

**Final Result:**
```typescript
{
  marketCap: 1234567890,    // From Birdeye (primary)
  liquidity: 5432100,       // From Birdeye (primary)
  dataSources: ['birdeye', 'dexscreener', 'gmgn']
}
```

---

## 🔄 Fallback Behavior

### If Birdeye API Key Not Set
```
Birdeye skipped → DexScreener → GMGN → Moralis
```

### If Birdeye API Fails
```
Birdeye error → DexScreener → GMGN → Moralis
```

### If Birdeye Returns No Data
```
Birdeye empty → DexScreener → GMGN → Moralis
```

**Always have backup sources!** ✅

---

## 📱 In Transaction Messages

```
💰 Market Cap: $1.23M    ← Birdeye (primary)
💧 Liquidity: $45.2K     ← Birdeye (primary)
📈 Volume 24h: $123K     ← Birdeye (primary)
```

**Data source indicator:**
```typescript
result.dataSources = [
  'birdeye',      // ← Shows Birdeye was used
  'helius',
  'dexscreener',
  'gmgn'
]
```

---

## 🎯 Summary

| Metric | Primary | Fallback 1 | Fallback 2 | Fallback 3 |
|--------|---------|------------|------------|------------|
| **Market Cap** | Birdeye | DexScreener | GMGN | Moralis |
| **Liquidity** | Birdeye | DexScreener | GMGN | Moralis |
| **Price** | Birdeye | DexScreener | GMGN | Moralis |
| **Volume 24h** | Birdeye | DexScreener | GMGN | Moralis |

---

## ✅ Ready to Deploy!

**Changes:**
- ✅ Birdeye fetch method added
- ✅ Birdeye merge method added
- ✅ Priority order updated
- ✅ Fallback chain maintained
- ✅ .env.example updated

**Get your Birdeye API key:** https://birdeye.so 🦅
