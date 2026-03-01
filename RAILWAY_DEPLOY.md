# Railway Deployment Guide

## Quick Deploy

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `hellojarvas19/WTS`

3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically create `DATABASE_URL`

4. **Configure Environment Variables**
   
   Go to your service → Variables → Add these:

   ```env
   # Required
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   BOT_TOKEN=your_telegram_bot_token
   HELIUS_API_KEY=your_helius_api_key
   ADMIN_CHAT_ID=your_telegram_chat_id
   
   # Deployment
   ENVIRONMENT=production
   APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   PORT=3001
   
   # Optional - Enhanced Features
   ENABLE_ENHANCED_METADATA=false
   BIRDEYE_API_KEY=
   MORALIS_API_KEY=
   SOLANA_TRACKER_API_KEY=
   
   # Optional - Telegram User API
   TELEGRAM_API_ID=
   TELEGRAM_API_HASH=
   TELEGRAM_SESSION_STRING=
   
   # Optional - Additional RPC
   RPC_ENDPOINTS=https://api.mainnet-beta.solana.com
   ```

5. **Deploy**
   - Railway will automatically build and deploy
   - Wait for deployment to complete
   - Check logs for any errors

## Getting API Keys

### Telegram Bot Token
1. Open [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot`
3. Follow instructions
4. Copy the token

### Helius API Key
1. Go to [helius.dev](https://www.helius.dev)
2. Sign up for free account
3. Create new project
4. Copy API key

### Admin Chat ID
1. Open [@userinfobot](https://t.me/userinfobot) on Telegram
2. Send any message
3. Copy your ID

### Optional: Birdeye API Key
1. Go to [birdeye.so](https://birdeye.so)
2. Sign up and get API key

### Optional: Solana Tracker API Key
1. Go to [solanatracker.io](https://www.solanatracker.io)
2. Sign up and get API key

## Verify Deployment

1. Check Railway logs for "Bot started successfully"
2. Open your Telegram bot
3. Send `/start` command
4. Bot should respond with menu

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` is set correctly
- Check if PostgreSQL service is running

### Bot Not Responding
- Verify `BOT_TOKEN` is correct
- Check `ENVIRONMENT` is set to "production"
- Ensure `APP_URL` matches your Railway domain

### Webhook Issues
- Railway automatically provides HTTPS
- `APP_URL` should be: `https://your-app.railway.app`
- No trailing slash in `APP_URL`

## Monitoring

- View logs: Railway Dashboard → Your Service → Logs
- Check metrics: Railway Dashboard → Your Service → Metrics
- Database: Railway Dashboard → PostgreSQL → Connect

## Scaling

Railway automatically scales based on usage. For high traffic:
1. Upgrade Railway plan
2. Add multiple Helius API keys (HELIUS_API_KEY1, HELIUS_API_KEY2, etc.)
3. Add more RPC endpoints in `RPC_ENDPOINTS`

## Support

For issues, check:
- Railway logs
- [Backend README](./backend/README.md)
- GitHub Issues
