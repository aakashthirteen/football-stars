# 🚀 Railway Deployment Guide - Football Stars App

## Step-by-Step Railway Deployment

### 1. **Create Railway Account & Connect GitHub**
- Go to [Railway.app](https://railway.app)
- Sign up with GitHub account
- Connect your GitHub repository: `aakashthirteen/football-stars`

### 2. **Deploy Backend Service**
1. **Create New Project** → **Deploy from GitHub repo**
2. **Select Repository:** `aakashthirteen/football-stars`
3. **Set Root Directory:** `/backend` (important!)
4. **Framework Detection:** Railway will auto-detect Node.js

### 3. **Add PostgreSQL Database**
1. In your Railway project dashboard
2. **Add Service** → **Database** → **PostgreSQL**
3. Railway will automatically provide `DATABASE_URL` environment variable

### 4. **Configure Environment Variables**
Add these environment variables in Railway dashboard:
```
NODE_ENV=production
JWT_SECRET=your-super-secure-production-jwt-secret-key-here-make-it-very-long
PORT=3000
```

**Important:** Railway automatically provides `DATABASE_URL` for PostgreSQL

### 5. **Deploy Configuration**
Railway will use our `railway.json` configuration:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Port:** Automatically detected from `process.env.PORT`

### 6. **Get Production URL**
After deployment, Railway provides a URL like:
```
https://football-stars-production-xxxx.up.railway.app
```

---

## 📱 Update React Native App

### **Switch from Mock to Real API**

**File:** `/football-app/src/services/api.ts`

**Change Line 4:**
```typescript
// FROM:
const USE_MOCK = true;

// TO:
const USE_MOCK = false;
```

**Update Line 6:**
```typescript
// FROM:
const API_BASE_URL = 'http://192.168.0.102:3001';

// TO:  
const API_BASE_URL = 'https://your-railway-app-url.up.railway.app';
```

---

## 🔧 Deployment Features Ready

### **✅ Database Migration**
- SQLite (development) → PostgreSQL (production)
- Auto-switching based on `DATABASE_URL` environment variable
- Complete schema migration with UUID primary keys
- Test data seeding on first deployment

### **✅ Production Optimizations**
- SSL connections for PostgreSQL
- Environment-based configuration
- Graceful shutdown handling
- Error logging and monitoring ready

### **✅ API Endpoints Ready**
All endpoints will be available at your Railway URL:
- **Authentication:** `/api/auth/login`, `/api/auth/register`
- **Teams:** `/api/teams` (GET, POST)
- **Matches:** `/api/matches` (GET, POST)
- **Players:** `/api/players/stats`
- **Health Check:** `/health`

---

## 🧪 Testing Deployment

### **1. Test Backend Health**
```bash
curl https://your-railway-url.up.railway.app/health
```

### **2. Test Authentication**
```bash
curl -X POST https://your-railway-url.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### **3. Test React Native App**
1. Update API_BASE_URL in `/football-app/src/services/api.ts`
2. Set `USE_MOCK = false`
3. Restart Expo development server
4. Test login with test@test.com / password123

---

## 📊 Production Features

### **Database Seeded With:**
- ✅ Test user: `test@test.com` / `password123`
- ✅ Sample teams: "Local Rangers", "Sunday Warriors"
- ✅ Sample matches and tournament data
- ✅ Player statistics and achievements

### **API Features:**
- ✅ JWT Authentication with bcrypt password hashing
- ✅ Real-time match scoring and events
- ✅ Team management and player statistics
- ✅ Tournament system with registration
- ✅ Leaderboards and achievement tracking

---

## 🔄 Rollback Plan

If issues occur, easily rollback to mock mode:
```typescript
// In /football-app/src/services/api.ts
const USE_MOCK = true; // Switch back to mock mode
```

---

## 🚀 Next Steps After Deployment

1. **Update React Native app** with Railway URL
2. **Test all features** with production database
3. **Monitor Railway logs** for any issues
4. **Setup custom domain** (optional)
5. **Enable Railway analytics** for monitoring

**Your football app will be fully production-ready!** ⚽🚀