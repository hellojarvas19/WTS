# Notification Settings - Feature Flow

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User sends /start                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Main Menu                               │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │  🔮 Add     │  │  👀 Manage  │                          │
│  └─────────────┘  └─────────────┘                          │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ 👛 My Wallet│  │ ⚙️ Settings │ ◄── Click here           │
│  └─────────────┘  └─────────────┘                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Settings Menu                              │
│  ┌──────────────────────────────────────────────┐           │
│  │  ⏸️ Pause Handi Cat / ▶️ Resume Handi Cat   │           │
│  └──────────────────────────────────────────────┘           │
│  ┌──────────────────────────────────────────────┐           │
│  │       🔔 Notification Filters                │ ◄── Click │
│  └──────────────────────────────────────────────┘           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Notification Filters Menu                       │
│  ┌─────────────────┐  ┌─────────────────────┐              │
│  │ 🎯 DEX Filters  │  │ 💰 Min SOL Amount   │              │
│  └────────┬────────┘  └──────────┬──────────┘              │
└───────────┼───────────────────────┼──────────────────────────┘
            │                       │
            ▼                       ▼
┌───────────────────────┐  ┌────────────────────────────────┐
│   DEX Filters Menu    │  │   Min SOL Amount Input         │
│                       │  │                                │
│ ✅/❌ Pump.fun        │  │ Current: 0 SOL                 │
│ ✅/❌ PumpSwap        │  │                                │
│ ✅/❌ Raydium         │  │ Reply with number to set       │
│ ✅/❌ Jupiter         │  │ minimum SOL amount             │
│ ✅/❌ SOL Transfers   │  │                                │
│                       │  │ Example: 1.0                   │
│ (Click to toggle)     │  │                                │
└───────────────────────┘  └────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│     User     │
└──────┬───────┘
       │ Clicks toggle/sets amount
       ▼
┌──────────────────────────┐
│  CallbackQueryHandler    │
└──────┬───────────────────┘
       │ Routes to handler
       ▼
┌──────────────────────────┐
│   SettingsCommand        │
│  - toggleDexHandler()    │
│  - minSolAmountHandler() │
└──────┬───────────────────┘
       │ Updates database
       ▼
┌────────────────────────────────────┐
│ NotificationSettingsRepository     │
│  - toggleDex()                     │
│  - setMinSolAmount()               │
└──────┬─────────────────────────────┘
       │ Saves to DB
       ▼
┌──────────────────────────┐
│  PostgreSQL Database     │
│  NotificationSettings    │
└──────────────────────────┘
```

## Notification Filter Flow

```
┌─────────────────────────┐
│  Transaction Detected   │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  SendTransactionMsgHandler          │
│  sendTransactionMessage()           │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  shouldSendNotification()           │
│  1. Check DEX filter                │
│  2. Check min SOL amount            │
└──────────┬──────────────────────────┘
           │
           ├─── ❌ Filtered out ──► Return (no notification)
           │
           └─── ✅ Passes filters
                    │
                    ▼
           ┌────────────────────┐
           │  Send notification │
           │  to user           │
           └────────────────────┘
```

## Database Schema Flow

```
┌─────────────────────────┐
│        User             │
│  - id (PK)              │
│  - username             │
│  - ...                  │
└──────────┬──────────────┘
           │ 1:1
           │
           ▼
┌─────────────────────────────────┐
│   NotificationSettings          │
│  - id (PK)                      │
│  - userId (FK, unique)          │
│  - enablePumpFun (bool)         │
│  - enablePumpSwap (bool)        │
│  - enableRaydium (bool)         │
│  - enableJupiter (bool)         │
│  - enableSolTransfers (bool)    │
│  - minSolAmount (float)         │
│  - createdAt                    │
│  - updatedAt                    │
└─────────────────────────────────┘
```

## State Management

```
User opens settings
       │
       ▼
Settings exist? ──No──► Create with defaults
       │                      │
      Yes                     │
       │◄─────────────────────┘
       ▼
Display current state
       │
       ▼
User makes change
       │
       ▼
Update database
       │
       ▼
Refresh menu with new state
```

## Filter Logic Pseudocode

```typescript
async shouldSendNotification(message, userId) {
  // Get user settings (auto-create if not exists)
  settings = await getSettings(userId)
  
  // Check DEX filter
  if (message.platform === 'pumpfun' && !settings.enablePumpFun) {
    return false
  }
  if (message.platform === 'pumpfun_amm' && !settings.enablePumpSwap) {
    return false
  }
  if (message.platform === 'raydium' && !settings.enableRaydium) {
    return false
  }
  if (message.platform === 'jupiter' && !settings.enableJupiter) {
    return false
  }
  
  // Check minimum SOL amount
  if (settings.minSolAmount > 0) {
    solAmount = message.type === 'buy' 
      ? parseFloat(message.tokenTransfers.tokenAmountOut)
      : parseFloat(message.tokenTransfers.tokenAmountIn)
    
    if (solAmount < settings.minSolAmount) {
      return false
    }
  }
  
  return true // All filters passed
}
```

## Error Handling Flow

```
User action
    │
    ▼
Try operation
    │
    ├─── Success ──► Update UI ──► Show confirmation
    │
    └─── Error ──► Log error ──► Show error message
                       │
                       └─► Return to previous menu
```

## Menu Navigation Map

```
Main Menu
    │
    └── Settings
            │
            ├── Pause/Resume Bot
            │
            └── Notification Filters
                    │
                    ├── DEX Filters
                    │       │
                    │       ├── Toggle Pump.fun
                    │       ├── Toggle PumpSwap
                    │       ├── Toggle Raydium
                    │       ├── Toggle Jupiter
                    │       └── Toggle SOL Transfers
                    │
                    └── Min SOL Amount
                            │
                            └── [User input]
```

## Integration Points

```
┌─────────────────────────────────────────────────────────┐
│                    Existing System                       │
│                                                          │
│  ┌──────────────┐      ┌──────────────────┐            │
│  │ Track Wallets│─────►│ Watch Transactions│            │
│  └──────────────┘      └────────┬──────────┘            │
│                                  │                       │
│                                  ▼                       │
│                        ┌──────────────────┐             │
│                        │ Parse Transaction│             │
│                        └────────┬──────────┘             │
│                                  │                       │
│                                  ▼                       │
│  ┌────────────────────────────────────────────────┐    │
│  │   SendTransactionMsgHandler                    │    │
│  │   ┌──────────────────────────────────────┐    │    │
│  │   │ NEW: shouldSendNotification()        │    │    │
│  │   │  - Check DEX filters                 │    │    │
│  │   │  - Check min SOL amount              │    │    │
│  │   └──────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────┘    │
│                                  │                       │
│                                  ▼                       │
│                        ┌──────────────────┐             │
│                        │ Send to Telegram │             │
│                        └──────────────────┘             │
└─────────────────────────────────────────────────────────┘
```
