# SSE Timer Implementation Checklist

## ✅ Backend Implementation

### Core Files Created:
- [x] `/src/services/sse/SSEMatchTimerService.ts` - Main SSE timer service
- [x] `/src/services/redisClient.ts` - Redis client stub (replace with actual Redis)
- [x] `/src/routes/sse.ts` - SSE route handlers
- [x] `/src/config/timerConfig.ts` - Configuration for timer system
- [x] `/src/scripts/migrate-timer-fields.ts` - Database migration script
- [x] `/src/scripts/test-sse-timer.ts` - Test script for SSE timer

### Backend Integration:
- [x] Updated `app.ts` to include SSE routes
- [x] Added SSE timer service import to match controller
- [ ] Update match controller to use SSE timer service based on config

## ✅ Frontend Implementation

### Core Files Created:
- [x] `/football-app/src/hooks/useMatchTimer.ts` - React hook for SSE timer
- [x] `/football-app/src/screens/matches/MatchScoringScreenSSE.tsx` - SSE version of match screen
- [x] `/football-app/src/config/timerConfig.ts` - Frontend timer configuration

### Frontend Integration:
- [x] Updated `App.tsx` to include EventSource polyfill
- [x] Updated API service with SSE endpoints
- [ ] Replace MatchScoringScreen with SSE version

## 📋 Implementation Steps

### 1. Install Dependencies
```bash
# Backend
cd /Users/preetikumari/github_aakash/football-stars
npm install redis  # Optional but recommended

# Frontend
cd /Users/preetikumari/github_aakash/football-stars/football-app
npm install react-native-event-source
```

### 2. Run Database Migration
```bash
cd /Users/preetikumari/github_aakash/football-stars
npx ts-node src/scripts/migrate-timer-fields.ts
```

### 3. Test SSE Timer
```bash
# Start your backend server first
npm run dev

# In another terminal
npx ts-node src/scripts/test-sse-timer.ts
```

### 4. Update Match Routes
Replace the current `MatchScoringScreen` with `MatchScoringScreenSSE` in your navigation:

```typescript
// In your navigation file (e.g., MatchesStack.tsx)
import MatchScoringScreenSSE from '../screens/matches/MatchScoringScreenSSE';

// Replace
Screen name="MatchScoring" component={MatchScoringScreen}
// With
Screen name="MatchScoring" component={MatchScoringScreenSSE}
```

### 5. Configure Timer System
Edit `/src/config/timerConfig.ts` and `/football-app/src/config/timerConfig.ts`:
- Set `USE_SSE_TIMER: true` to use SSE
- Set `USE_SSE_TIMER: false` to fallback to WebSocket

### 6. Test Different Scenarios

#### 5-Minute Match Test:
1. Create a match with 5-minute duration
2. Start the match
3. Verify timer starts at 0:00
4. Watch for automatic halftime at 2:30
5. Start second half manually
6. Verify second half starts at 3:00
7. Watch for automatic fulltime at 5:00

#### Connection Test:
1. Start a live match
2. Turn off WiFi/data
3. Verify timer continues locally
4. Turn WiFi/data back on
5. Verify timer resynchronizes

#### Manual Controls Test:
1. Start a match
2. Pause the match
3. Resume the match
4. Add stoppage time
5. Trigger manual halftime
6. Start second half manually

## 🚀 Deployment

### Railway Deployment:
1. No special configuration needed for SSE
2. Works out of the box with Railway
3. No WebSocket proxy issues

### Environment Variables:
```env
# Add to Railway/production
REDIS_URL=your-redis-url  # Optional
USE_SSE_TIMER=true
```

## 🔍 Monitoring

### Server Logs:
```
📡 SSE: Client connecting to match X timer stream
⚽ SSE Timer: Starting match X
🟨 SSE Timer: Triggering halftime for match X
⚽ SSE Timer: Starting second half for match X
🏁 SSE Timer: Triggering fulltime for match X
```

### Client Logs:
```
✅ EventSource polyfill loaded successfully
📡 Connecting to SSE: https://your-api/matches/X/timer-stream
✅ SSE connection established
⏱️ Timer update: 2:30 - Half 1
```

## ⚠️ Common Issues

### Issue: EventSource is not defined
**Fix:** Make sure `react-native-event-source` is installed and imported in App.tsx

### Issue: 401 Unauthorized on SSE endpoint
**Fix:** Ensure auth token is being passed in EventSource headers

### Issue: Timer not updating
**Fix:** Check that match status is 'LIVE' and SSE connection is established

## 🎯 Next Steps

After successful implementation:
1. Remove old WebSocket code
2. Implement Redis caching
3. Add match replay functionality
4. Build admin dashboard
5. Add timer sync across devices

## 📊 Performance Metrics

Monitor these metrics:
- Connection time: Should be < 100ms
- Timer drift: Should be < 1 second
- Reconnection time: Should be < 2 seconds
- Memory usage: Should be stable
- CPU usage: Should be < 5%

## ✅ Sign-off Checklist

Before considering implementation complete:
- [ ] All timer scenarios work correctly
- [ ] Connection recovery works
- [ ] No memory leaks
- [ ] Performance is acceptable
- [ ] Logs are clean
- [ ] Documentation is updated
- [ ] Team is trained on new system
