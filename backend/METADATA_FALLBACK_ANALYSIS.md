# 📊 Metadata Fallback Analysis

## ✅ Has Fallback (Uses `||` or conditional)

### 🎯 Market Data
| Field | Primary | Fallback 1 | Fallback 2 | Fallback 3 |
|-------|---------|------------|------------|------------|
| **priceUsd** | Birdeye | DexScreener | GMGN | Moralis |
| **marketCap** | Birdeye | DexScreener | GMGN | Moralis |
| **liquidity** | Birdeye | DexScreener | GMGN | Moralis |
| **volume24h** | Birdeye | DexScreener | GMGN | - |
| **priceChange24h** | Birdeye | DexScreener | Moralis | - |
| **priceChange1h** | DexScreener | - | - | - |
| **priceSol** | DexScreener | Jupiter | - | - |
| **fullyDilutedMarketCap** | DexScreener | - | - | - |

---

### 📝 Basic Token Info
| Field | Primary | Fallback 1 | Fallback 2 | Fallback 3 |
|-------|---------|------------|------------|------------|
| **name** | Helius | DexScreener | Moralis | - |
| **symbol** | Helius | DexScreener | Moralis | - |
| **decimals** | Helius | RPC | Moralis | - |
| **description** | Helius | - | - | - |
| **image** | Helius | DexScreener | Moralis | - |
| **totalSupply** | RPC | Helius | - | - |

---

### 👥 Holder Data
| Field | Primary | Fallback 1 | Fallback 2 | Fallback 3 |
|-------|---------|------------|------------|------------|
| **totalHolders** | Solana Tracker | GMGN | Moralis | - |
| **top10HoldersPercentage** | Solana Tracker | RugCheck | GMGN | RPC |
| **topHolders** | Solana Tracker | RugCheck | RPC | - |

---

### 🔗 Social Links
| Field | Primary | Fallback 1 | Fallback 2 |
|-------|---------|------------|------------|
| **website** | DexScreener | Helius | - |
| **twitter** | DexScreener | Helius | - |
| **telegram** | DexScreener | Helius | - |
| **discord** | DexScreener | Helius | - |

---

### 💼 Dev/Creator Info
| Field | Primary | Fallback 1 | Fallback 2 |
|-------|---------|------------|------------|
| **devWallet** | GMGN | - | - |
| **devHoldingPercentage** | GMGN | - | - |
| **devStatus** | GMGN | - | - |
| **devRugHistory** | GMGN | - | - |
| **creatorAddress** | Helius | - | - |

---

### 🏊 Pool Info
| Field | Primary | Fallback 1 | Fallback 2 |
|-------|---------|------------|------------|
| **poolAddress** | DexScreener | Moralis | - |
| **poolType** | DexScreener | Moralis | - |
| **lpBurned** | RugCheck | GMGN | DexScreener |
| **lpBurnedPercentage** | RugCheck | GMGN | - |

---

## ❌ NO Fallback (Overwrites Always)

### 🔒 Security Info (Authoritative Sources Only)
| Field | Source | Fallback |
|-------|--------|----------|
| **mintAuthority** | RPC | ❌ None |
| **mintAuthorityRevoked** | RPC | ❌ None |
| **freezeAuthority** | RPC | ❌ None |
| **freezeAuthorityRevoked** | RPC | ❌ None |
| **updateAuthority** | Helius | ❌ None |
| **isMutable** | Helius | Moralis |

**Why?** Security data must be authoritative from on-chain sources (RPC/Helius). No fallback to prevent false security info.

---

### 📊 Trading Signals (GMGN Only)
| Field | Source | Fallback |
|-------|--------|----------|
| **buyPressure** | GMGN | ❌ None |
| **netFlow24h** | GMGN | ❌ None |
| **signals** | GMGN | ❌ None |
| **smartWalletHolders** | GMGN | ❌ None |
| **hotLevel** | GMGN | ❌ None |

**Why?** These are GMGN-specific metrics. Either have them or don't - no fallback makes sense.

---

### 🚀 Pump.fun Specific
| Field | Source | Fallback |
|-------|--------|----------|
| **pumpfunComplete** | GMGN/Pump.fun | ❌ None |
| **pumpfunProgress** | GMGN/Pump.fun | ❌ None |
| **pumpfunKingOfTheHill** | Pump.fun | ❌ None |

**Why?** Only relevant for Pump.fun tokens. Either on bonding curve or not.

---

### 🎯 Platform Specific
| Field | Source | Fallback |
|-------|--------|----------|
| **launchpad** | GMGN | ❌ None |
| **dexscreenerPaid** | DexScreener/GMGN | ❌ None |

**Why?** Platform-specific flags. Either true or false, no fallback needed.

---

### ⏱️ Time Data
| Field | Source | Fallback |
|-------|--------|----------|
| **launchTimestamp** | GMGN | Pump.fun |
| **launchTime** | Calculated | - |
| **ageInHours** | Calculated | - |

**Why?** Launch time is either known or unknown. Calculated fields derived from timestamp.

---

## 🔄 Merge Priority Order

### 1. Birdeye (Market Data)
```typescript
priceUsd, marketCap, liquidity, volume24h, priceChange24h
```

### 2. Helius (Metadata & Security)
```typescript
name, symbol, description, image, decimals
mintAuthority, freezeAuthority, updateAuthority, isMutable
website, twitter, telegram, discord
```

### 3. RPC (On-chain Authority)
```typescript
mintAuthority, freezeAuthority (AUTHORITATIVE)
decimals, totalSupply
topHolders, top10Percentage
```

### 4. Moralis (Backup Market Data)
```typescript
name, symbol, decimals, image
priceUsd, priceChange24h, liquidity
totalHolders, poolAddress, poolType
```

### 5. DexScreener (Market & Social)
```typescript
name, symbol, image
priceUsd, priceSol, marketCap, fdv
liquidity, volume24h, priceChange24h, priceChange1h
website, twitter, telegram, discord
lpBurned, dexscreenerPaid
```

### 6. GMGN (Trading Signals & Dev Info)
```typescript
priceUsd, marketCap, liquidity, volume24h
totalHolders, top10HoldersPercentage
devWallet, devHoldingPercentage, devStatus, devRugHistory
buyPressure, netFlow24h, signals, smartWalletHolders
lpBurned, lpBurnedPercentage
launchTimestamp, hotLevel
```

### 7. RugCheck (Security Verification)
```typescript
mintAuthorityRevoked, freezeAuthorityRevoked (AUTHORITATIVE)
lpBurned, lpLockedPercentage
topHolders, top10HoldersPercentage
riskScore, riskFactors
```

### 8. Solana Tracker (Holders)
```typescript
totalHolders, topHolders, top10HoldersPercentage (HIGHEST PRIORITY)
```

### 9. Jupiter (Price Fallback)
```typescript
priceUsd, priceSol (only if not set)
```

### 10. Pump.fun (Bonding Curve)
```typescript
marketCap, launchTimestamp
pumpfunComplete, pumpfunProgress, pumpfunKingOfTheHill
devWallet
```

---

## 📊 Summary

### ✅ Has Fallback (35 fields)
- Market data (price, MC, liquidity, volume)
- Basic token info (name, symbol, decimals, image)
- Holder data (count, top 10%, top holders)
- Social links (website, twitter, telegram, discord)
- Dev info (wallet, holding %, status)
- Pool info (address, type, LP status)

### ❌ No Fallback (15 fields)
- Security flags (mint/freeze authority) - Must be authoritative
- Trading signals (buy pressure, net flow) - GMGN specific
- Pump.fun data (bonding curve status) - Platform specific
- Platform flags (dexscreener paid, launchpad) - Binary flags
- Time data (launch timestamp, age) - Either known or not

---

## 🎯 Key Takeaways

1. **Market data** = Multiple fallbacks (Birdeye → DexScreener → GMGN → Moralis)
2. **Security data** = No fallback (RPC/Helius only - must be accurate)
3. **Social links** = Limited fallback (DexScreener → Helius)
4. **Trading signals** = No fallback (GMGN specific)
5. **Holder data** = Multiple fallbacks (Solana Tracker → RugCheck → GMGN → RPC)

**Total fields tracked: ~50**  
**Fields with fallback: ~35 (70%)**  
**Fields without fallback: ~15 (30%)**
