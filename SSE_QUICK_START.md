# SSE Timer Quick Start Guide

## 🚀 Quick Implementation (15 minutes)

### Step 1: Install Dependencies (2 minutes)

```bash
# Terminal 1 - Backend
cd /Users/preetikumari/github_aakash/football-stars
npm install redis

# Terminal 2 - Frontend
cd /Users/preetikumari/github_aakash/football-stars/football-app
npm install react-native-event-source
```

### Step 2: Run Database Migration (1 minute)

```bash
# In backend directory
npx ts-node src/scripts/migrate-timer-fields.ts
```

### Step 3: Quick Test (2 minutes)

1. Start your backend server:
```bash
npm run dev
```

2. Test SSE endpoint:
```bash
curl -N http://localhost:3001/api/matches/test-id/timer-stream
```

You should see: `401 Unauthorized` (this is good - means endpoint exists!)

### Step 4: Update Navigation (5 minutes)

Find your navigation file (likely `MatchesStack.tsx`) and replace:

```typescript
// OLD
import MatchScoringScreen from '../screens/matches/MatchScoringScreen';

// NEW
import MatchScoringScreenSSE from '../screens/matches/MatchScoringScreenSSE';

// Then update the Screen component
<Stack.Screen 
  name="MatchScoring" 
  component={MatchScoringScreenSSE}  // Changed!
  options={{ headerShown: false }}
/>
```

### Step 5: Test with a Real Match (5 minutes)

1. Create a new match (5 minutes duration for testing)
2. Start the match
3. Watch the timer count up from 0:00
4. Notice automatic halftime at 2:30
5. Click "Start Second Half"
6. Watch it count from 3:00 to 5:00

## ✅ That's It!

Your timer is now using SSE instead of WebSocket. Benefits:
- Works perfectly with Railway
- No more connection drops
- Automatic reconnection
- Better performance

## 🔥 Quick Wins

### See it in action:
```typescript
// The timer state comes from SSE
const timerState = useMatchTimer(matchId);

// Use it like this:
<Text>{timerState.displayTime}</Text>  // Shows "02:30"
<Text>Half: {timerState.currentHalf}</Text>
<Text>Status: {timerState.status}</Text>
```

### Connection status:
```typescript
{!timerState.isConnected && (
  <Text>Reconnecting...</Text>
)}
```

### Halftime countdown:
```typescript
const { breakTimeDisplay } = useHalftimeBreakDisplay(
  timerState.halftimeBreakRemaining
);
<Text>Break time: {breakTimeDisplay}</Text>  // "14:32"
```

## 🐛 Quick Debug

Check these in order:

1. **Backend running?**
   ```bash
   curl http://localhost:3001/health
   ```

2. **SSE endpoint working?**
   ```bash
   curl -N http://localhost:3001/api/matches/test/timer-stream
   ```

3. **Frontend connected?**
   Look for this in React Native logs:
   ```
   ✅ EventSource polyfill loaded successfully
   📡 Connecting to SSE: ...
   ✅ SSE connection established
   ```

4. **Timer updating?**
   Add this to your component:
   ```typescript
   console.log('Timer:', timerState.currentMinute, timerState.currentSecond);
   ```

## 💡 Pro Tips

1. **Test with 5-minute matches** - Halftime at 2:30, fulltime at 5:00
2. **Check connection status** - Show UI when reconnecting
3. **Use interpolation** - Smooth 60 FPS display
4. **Monitor performance** - Should use < 5% CPU

## 🆘 Need Help?

Common fixes:
- **Timer stuck?** Check match status is 'LIVE'
- **No connection?** Check auth token is sent
- **Not updating?** Check EventSource polyfill loaded

Still stuck? Check:
- `/SSE_MIGRATION_GUIDE.md` - Full migration guide
- `/SSE_IMPLEMENTATION_CHECKLIST.md` - Complete checklist
- Server logs for `📡 SSE:` messages
- Client logs for timer state
