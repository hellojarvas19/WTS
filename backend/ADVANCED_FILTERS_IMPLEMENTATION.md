# 📊 Advanced Notification Filters - Implementation Guide

## ✅ What Was Implemented

Added 7 new advanced filter types to notification settings:

### Filter Types
1. **Market Cap** - Min/Max
2. **Liquidity** - Min/Max  
3. **Holders** - Min/Max
4. **Volume 24h** - Min/Max
5. **Top 10 Holding %** - Min/Max
6. **Dev Holding %** - Min/Max
7. **Token Age** - Min/Max (in hours)

---

## 🗄️ Database Changes

### Updated Schema (`prisma/schema.prisma`)
```prisma
model NotificationSettings {
  // ... existing fields ...
  
  // Advanced filters (0 = no filter)
  minMarketCap          Float    @default(0)
  maxMarketCap          Float    @default(0)
  minLiquidity          Float    @default(0)
  maxLiquidity          Float    @default(0)
  minHolders            Int      @default(0)
  maxHolders            Int      @default(0)
  minVolume24h          Float    @default(0)
  maxVolume24h          Float    @default(0)
  minTop10Percentage    Float    @default(0)
  maxTop10Percentage    Float    @default(0)
  minDevPercentage      Float    @default(0)
  maxDevPercentage      Float    @default(0)
  minAgeHours           Float    @default(0)
  maxAgeHours           Float    @default(0)
}
```

### Migration Required
```bash
pnpm db:migrate
```

---

## 🔧 Code Changes

### 1. Repository (`src/repositories/prisma/notification-settings.ts`)
Added method:
```typescript
setAdvancedFilter(userId, {
  minMarketCap?: number
  maxMarketCap?: number
  // ... etc
})
```

### 2. Transaction Handler (`src/bot/handlers/send-tx-msg-handler.ts`)
Updated `shouldSendNotification()` to check advanced filters:
- Only applies when `ENABLE_ENHANCED_METADATA=true`
- Checks all filters where value > 0
- Returns false if any filter condition not met

### 3. Bot Menus (`src/config/bot-menus.ts`)
Added:
- `ADVANCED_FILTERS_MENU` - Main advanced filters menu

---

## 📱 User Interface

### Menu Structure
```
Settings
  └─ Notification Filters
      ├─ DEX Filters
      ├─ Min SOL Amount
      └─ Advanced Filters ← NEW
          ├─ Market Cap
          ├─ Liquidity
          ├─ Holders
          ├─ Volume 24h
          ├─ Top 10%
          ├─ Dev%
          └─ Token Age
```

---

## 🎯 How Filters Work

### Filter Logic
- **0 = No filter** (disabled)
- **Min only**: Must be >= min value
- **Max only**: Must be <= max value
- **Both**: Must be between min and max

### Examples

**Example 1: Only new tokens**
```
minAgeHours: 0
maxAgeHours: 24  (only tokens < 24 hours old)
```

**Example 2: High holder count**
```
minHolders: 1000
maxHolders: 0  (no max limit)
```

**Example 3: Market cap range**
```
minMarketCap: 100000  ($100K)
maxMarketCap: 1000000 ($1M)
```

---

## 🚀 TODO: Complete Implementation

### Still Need to Add:

1. **Callback Handlers** (`src/bot/handlers/callback-query-handler.ts`)
   ```typescript
   case 'advanced_filters':
     await settingsCommand.advancedFiltersHandler(message)
     break
   case 'filter_market_cap':
     await settingsCommand.setMarketCapFilterHandler(message)
     break
   // ... etc for each filter
   ```

2. **Settings Command Methods** (`src/bot/commands/settings-command.ts`)
   ```typescript
   async advancedFiltersHandler(msg) {
     // Show advanced filters menu
   }
   
   async setMarketCapFilterHandler(msg) {
     // Prompt for min/max market cap
   }
   // ... etc for each filter
   ```

3. **Input Handlers**
   - Listen for user input (min/max values)
   - Validate input
   - Save to database
   - Show confirmation

---

## 📋 Implementation Checklist

### Completed ✅
- [x] Database schema updated
- [x] Repository method added
- [x] Filter logic in transaction handler
- [x] Advanced filters menu created
- [x] Filter checks integrated

### TODO ⏳
- [ ] Add callback handlers for each filter
- [ ] Add settings command methods
- [ ] Add input validation
- [ ] Add user prompts for min/max values
- [ ] Add confirmation messages
- [ ] Test all filters
- [ ] Update help documentation

---

## 🧪 Testing

### Test Cases
1. Set min market cap to $100K - verify only tokens >= $100K shown
2. Set max holders to 1000 - verify only tokens <= 1000 holders shown
3. Set min age to 24h - verify only tokens >= 24h old shown
4. Set multiple filters - verify ALL conditions must be met
5. Set filter to 0 - verify filter is disabled

---

## 📚 User Documentation

### Help Text Example
```
📊 Advanced Filters

Filter notifications by token metrics:

💰 Market Cap: Set min/max market cap
💧 Liquidity: Set min/max liquidity  
👥 Holders: Set min/max holder count
📈 Volume: Set min/max 24h volume
📊 Top 10%: Set min/max top 10 holder %
👨‍💻 Dev%: Set min/max dev holding %
⏱️ Age: Set min/max token age (hours)

Note: Set to 0 to disable a filter
Example: Min: 50, Max: 0 = only >= 50
```

---

## 🔑 Key Points

1. **Requires Enhanced Metadata** - Filters only work when `ENABLE_ENHANCED_METADATA=true`
2. **Zero Means Disabled** - Any filter set to 0 is ignored
3. **All Filters Must Pass** - If multiple filters set, ALL must be satisfied
4. **Fallback Behavior** - If analysis fails, only basic filters (DEX, SOL amount) apply

---

**Status:** 🟡 Partially Complete
**Next Step:** Implement callback handlers and user input flow
**Priority:** High (core feature)
