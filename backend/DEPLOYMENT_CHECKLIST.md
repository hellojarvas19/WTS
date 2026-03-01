# Deployment Checklist

## ✅ Pre-Deployment

- [x] Database schema updated (`prisma/schema.prisma`)
- [x] Migration file created (`20260225131500_add_notification_settings`)
- [x] Repository layer implemented
- [x] Bot menus updated
- [x] Command handlers implemented
- [x] Callback handlers wired up
- [x] Filtering logic added to message handler
- [x] Documentation created

## 🚀 Deployment Steps

### 1. Backup Database
```bash
npm run db:backup
# or
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 2. Run Migration
```bash
# Option A: Using npm/pnpm
npm run db:migrate
# or
pnpm db:migrate

# Option B: Direct SQL (if Prisma fails)
psql $DATABASE_URL -f prisma/migrations/20260225131500_add_notification_settings/migration.sql

# Option C: Using Prisma push
npx prisma db push
```

### 3. Verify Migration
```bash
# Check if table exists
psql $DATABASE_URL -c "\d NotificationSettings"

# Should show:
# - id (text, primary key)
# - enablePumpFun (boolean, default true)
# - enablePumpSwap (boolean, default true)
# - enableRaydium (boolean, default true)
# - enableJupiter (boolean, default true)
# - enableSolTransfers (boolean, default true)
# - minSolAmount (double precision, default 0)
# - userId (text, unique, foreign key)
# - createdAt (timestamp)
# - updatedAt (timestamp)
```

### 4. Generate Prisma Client
```bash
npm run db:generate
# or
npx prisma generate
```

### 5. Build TypeScript
```bash
npm run start
# This runs: tsc && node ./dist/src/main.js
```

### 6. Test in Development
- Start bot locally
- Test all menu flows
- Verify filtering works

### 7. Deploy to Production
```bash
# Your deployment command here
# e.g., git push heroku main
# or docker build && docker push
```

## 🧪 Post-Deployment Testing

### Test Case 1: Menu Navigation
1. Send `/start` to bot
2. Click "⚙️ Settings"
3. Click "🔔 Notification Filters"
4. Verify two buttons appear: "🎯 DEX Filters" and "💰 Min SOL Amount"

### Test Case 2: DEX Filters
1. Click "🎯 DEX Filters"
2. Verify all 5 toggles show ✅ (default enabled)
3. Click "❌ Pump.fun"
4. Verify it changes to "✅ Pump.fun"
5. Make a test Pump.fun transaction
6. Verify NO notification received

### Test Case 3: Min SOL Amount
1. Click "💰 Min SOL Amount"
2. Reply with "1.0"
3. Verify confirmation: "✅ Minimum SOL amount set to 1.0 SOL"
4. Make test swap < 1 SOL
5. Verify NO notification
6. Make test swap ≥ 1 SOL
7. Verify notification received

### Test Case 4: SOL Transfers
1. Disable "SOL Transfers" toggle
2. Make test SOL transfer
3. Verify NO notification
4. Re-enable toggle
5. Make test SOL transfer
6. Verify notification received

## 🔍 Monitoring

### Check Logs
```bash
# Look for these log messages:
# - "GET_NOTIFICATION_SETTINGS_ERROR" (should not appear)
# - "TOGGLE_DEX_ERROR" (should not appear)
# - "SET_MIN_SOL_AMOUNT_ERROR" (should not appear)
```

### Database Queries
```sql
-- Check settings creation
SELECT COUNT(*) FROM "NotificationSettings";

-- Check user settings
SELECT * FROM "NotificationSettings" WHERE "userId" = 'YOUR_USER_ID';

-- Check default values
SELECT 
  "enablePumpFun",
  "enablePumpSwap",
  "enableRaydium",
  "enableJupiter",
  "enableSolTransfers",
  "minSolAmount"
FROM "NotificationSettings"
LIMIT 5;
```

## 🐛 Troubleshooting

### Issue: Migration fails
**Solution**: Run SQL manually:
```bash
psql $DATABASE_URL -f prisma/migrations/20260225131500_add_notification_settings/migration.sql
```

### Issue: TypeScript errors
**Solution**: Regenerate Prisma client:
```bash
npx prisma generate
```

### Issue: Settings not saving
**Solution**: Check database connection and logs for errors

### Issue: Filters not working
**Solution**: Verify `shouldSendNotification()` is called in `sendTransactionMessage()`

## 📊 Rollback Plan

If issues occur:

### 1. Rollback Code
```bash
git revert HEAD
```

### 2. Rollback Database
```sql
DROP TABLE "NotificationSettings";
```

### 3. Restore from Backup
```bash
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

## ✅ Success Criteria

- [ ] Migration runs without errors
- [ ] Settings menu accessible
- [ ] DEX toggles work
- [ ] Min SOL amount setting works
- [ ] Notifications filtered correctly
- [ ] No errors in logs
- [ ] All existing features still work

## 📝 Notes

- Settings are created with defaults on first access
- Existing users automatically get default settings (all enabled)
- No breaking changes to existing functionality
- Backward compatible with old code
