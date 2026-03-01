# Solana Tracker API Integration

## Overview
Integrated Solana Tracker API for accurate and reliable token holders data in the Handi Cat wallet tracker.

## What Was Added

### 1. New API Method (`src/lib/token-analysis.ts`)
```typescript
fetchSolanaTrackerHolders(tokenMint: string)
```
- Fetches top 20 token holders
- Returns holder addresses, balances, and percentages
- Calculates top 10 holders percentage
- Uses `x-api-key` header for authentication

### 2. Integration Points

**Parallel API Calls:**
- Added to the main `analyzeToken()` method alongside other data sources
- Runs in parallel with Helius, Moralis, GMGN, DexScreener, etc.

**Data Priority:**
- Solana Tracker holders data has **highest priority**
- Overrides holder data from other sources (Moralis, RugCheck, GMGN)
- Merged after RugCheck but before final calculations

### 3. Environment Configuration

**New Variable:**
```env
SOLANA_TRACKER_API_KEY=your_api_key_here
```

**Updated Files:**
- `.env.example` - Added configuration section
- `README.md` - Added setup instructions (step 9)

### 4. Test Script
Created `scripts/test-solanatracker-holders.ts` to verify integration:
- Tests API connectivity
- Validates response format
- Displays top holders data
- Calculates top 10 percentage

## API Details

**Endpoint:**
```
GET https://data.solanatracker.io/tokens/{tokenAddress}/holders/top
```

**Headers:**
```
x-api-key: <your-api-key>
Accept: application/json
```

**Response Format:**
```json
[
  {
    "address": "wallet_address",
    "amount": 1000000,
    "percentage": 10.5,
    "value": {
      "quote": 50000,
      "usd": 50000
    }
  }
]
```

## Benefits

1. **Accuracy**: Direct on-chain holder data from Solana Tracker
2. **Speed**: Fast API response times
3. **Reliability**: Dedicated holders endpoint
4. **Detail**: Includes USD values and exact percentages
5. **Priority**: Overrides less accurate sources

## Data Flow

```
Transaction Detected
    ↓
analyzeToken(tokenMint)
    ↓
Parallel API Calls:
  - Helius DAS
  - Moralis
  - GMGN
  - DexScreener
  - Solana RPC
  - RugCheck
  - Jupiter
  - PumpFun
  - Solana Tracker ← NEW
    ↓
Data Merging (Priority Order):
  1. Helius (metadata, authorities)
  2. Solana RPC (on-chain state)
  3. Moralis (price, pairs)
  4. DexScreener (trading data)
  5. GMGN (signals)
  6. RugCheck (security)
  7. Solana Tracker (holders) ← HIGHEST PRIORITY FOR HOLDERS
  8. Jupiter (price fallback)
  9. PumpFun (bonding curve)
    ↓
Final Token Analysis Result
    ↓
Telegram Notification
```

## Usage

### Setup
1. Get API key from https://www.solanatracker.io
2. Add to `.env`:
   ```env
   SOLANA_TRACKER_API_KEY=your_key_here
   ```
3. Restart the bot

### Testing
```bash
pnpm tsx scripts/test-solanatracker-holders.ts
```

### Optional
The integration is **optional**. If `SOLANA_TRACKER_API_KEY` is not set:
- Bot continues to work normally
- Falls back to Moralis/RugCheck/RPC for holder data
- No errors or warnings

## Code Changes Summary

**Modified Files:**
1. `src/lib/token-analysis.ts`
   - Added `fetchSolanaTrackerHolders()` method
   - Added to parallel API calls array
   - Added data merging logic

2. `.env.example`
   - Added `SOLANA_TRACKER_API_KEY` configuration

3. `README.md`
   - Updated setup instructions

**New Files:**
1. `scripts/test-solanatracker-holders.ts`
   - Test script for API integration

## References
- [Solana Tracker Documentation](https://docs.solanatracker.io)
- [Top Holders API](https://docs.solanatracker.io/data-api/tokens/get-top-20-token-holders)
- [Get API Key](https://www.solanatracker.io/account)
