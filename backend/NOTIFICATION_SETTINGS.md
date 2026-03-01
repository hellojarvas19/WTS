# Notification Settings Feature

## Overview
Users can now customize which notifications they receive through the bot's settings menu.

## Features

### DEX Filters
Toggle notifications for specific platforms:
- ✅/❌ Pump.fun (bonding curve + mints)
- ✅/❌ PumpSwap (Pump.fun AMM)
- ✅/❌ Raydium (all versions)
- ✅/❌ Jupiter (all versions)
- ✅/❌ SOL Transfers

### Minimum SOL Amount
Set a minimum SOL threshold for swap notifications:
- Default: 0 (receive all notifications)
- Example: Set to 1.0 to only receive notifications for swaps ≥ 1 SOL

## Database Schema

New `NotificationSettings` model:
```prisma
model NotificationSettings {
  id                    String   @id @default(cuid())
  
  enablePumpFun         Boolean  @default(true)
  enablePumpSwap        Boolean  @default(true)
  enableRaydium         Boolean  @default(true)
  enableJupiter         Boolean  @default(true)
  enableSolTransfers    Boolean  @default(true)
  
  minSolAmount          Float    @default(0)
  
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

## Usage

### For Users
1. Open bot with `/start`
2. Click "⚙️ Settings"
3. Click "🔔 Notification Filters"
4. Choose:
   - "🎯 DEX Filters" - Toggle platforms on/off
   - "💰 Min SOL Amount" - Set minimum threshold

### Migration
Run the migration to add the new table:
```bash
pnpm db:migrate
```

## Implementation Details

### Files Modified
- `prisma/schema.prisma` - Added NotificationSettings model
- `src/config/bot-menus.ts` - Added filter menus
- `src/bot/commands/settings-command.ts` - Added filter handlers
- `src/bot/handlers/callback-query-handler.ts` - Added callback routes
- `src/bot/handlers/send-tx-msg-handler.ts` - Added filtering logic
- `src/repositories/prisma/notification-settings.ts` - New repository

### Filtering Logic
Notifications are filtered in `SendTransactionMsgHandler`:
1. Check if DEX is enabled for the transaction platform
2. Check if SOL amount meets minimum threshold
3. Only send notification if both conditions pass

### Default Behavior
- All filters enabled by default
- Minimum SOL amount = 0 (no filtering)
- Settings auto-created on first access
