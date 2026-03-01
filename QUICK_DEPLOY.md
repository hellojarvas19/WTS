# 🚀 Quick Deploy to Railway

## 1️⃣ One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/WTS)

## 2️⃣ Manual Deploy (5 minutes)

### Step 1: Create Project
```
1. Go to railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose: hellojarvas19/WTS
```

### Step 2: Add Database
```
1. Click "+ New"
2. Select "Database"
3. Choose "PostgreSQL"
```

### Step 3: Set Environment Variables
```
Click your service → Variables → Raw Editor → Paste:

DATABASE_URL=${{Postgres.DATABASE_URL}}
BOT_TOKEN=get_from_botfather
HELIUS_API_KEY=get_from_helius.dev
ADMIN_CHAT_ID=get_from_userinfobot
ENVIRONMENT=production
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
PORT=3001
```

### Step 4: Deploy
```
Railway auto-deploys on push
Wait 2-3 minutes for build
Check logs for "Bot started successfully"
```

## 🔑 Get API Keys

| Service | URL | Steps |
|---------|-----|-------|
| Telegram Bot | t.me/botfather | Send `/newbot` |
| Helius API | helius.dev | Sign up → Create project |
| Chat ID | t.me/userinfobot | Send any message |

## ✅ Verify Deployment

1. **Check Logs**: Railway Dashboard → Logs
2. **Test Bot**: Open Telegram → Send `/start`
3. **Health Check**: `https://your-app.railway.app/api/health`

## 🆘 Quick Fixes

| Issue | Solution |
|-------|----------|
| Bot not responding | Check BOT_TOKEN in env vars |
| Database error | Verify DATABASE_URL is set |
| Webhook failed | Ensure APP_URL has no trailing `/` |
| Build failed | Check Railway logs for errors |

## 📊 Monitor

- **Logs**: Railway Dashboard → Your Service → Logs
- **Metrics**: Railway Dashboard → Your Service → Metrics  
- **Database**: Railway Dashboard → PostgreSQL → Connect

## 🎯 Success Checklist

- [ ] Railway shows "Deployed" status
- [ ] Logs show "Bot started successfully"
- [ ] `/api/health` returns 200 OK
- [ ] Bot responds to `/start` command
- [ ] Can add wallet with `/add` command

## 📚 Full Documentation

- [Complete Deployment Guide](./RAILWAY_DEPLOY.md)
- [Optimization Summary](./OPTIMIZATION_SUMMARY.md)
- [Backend README](./backend/README.md)

---

**Repository**: https://github.com/hellojarvas19/WTS.git  
**Support**: Check Railway logs or GitHub issues
