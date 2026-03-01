# Websol - Solana Wallet Tracker

A comprehensive Telegram bot for tracking Solana wallet transactions in real-time.

## Project Structure

- `/backend` - Node.js/TypeScript backend with Telegram bot
- `/app` - React frontend (optional dashboard)
- `/webapp` - Alternative React frontend

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

### Prerequisites

1. PostgreSQL database (Railway provides this)
2. Telegram Bot Token from [@BotFather](https://t.me/botfather)
3. Helius API Key from [helius.dev](https://www.helius.dev)

### Environment Variables

Set these in Railway:

```env
DATABASE_URL=postgresql://...
BOT_TOKEN=your_telegram_bot_token
HELIUS_API_KEY=your_helius_api_key
ADMIN_CHAT_ID=your_telegram_chat_id
ENVIRONMENT=production
APP_URL=https://your-railway-app.railway.app
PORT=3001
```

### Deployment Steps

1. Fork/Clone this repository
2. Create new project on Railway
3. Add PostgreSQL database service
4. Connect your GitHub repository
5. Add environment variables
6. Deploy!

## Local Development

See [backend/README.md](./backend/README.md) for detailed setup instructions.

## Features

- Real-time Solana wallet tracking
- Multi-DEX support (Raydium, Jupiter, Pump.fun, PumpSwap)
- Token metadata and market cap tracking
- Customizable notification filters
- Multi-wallet support
- Admin controls

## License

ISC
