# Global Timer System Guide

## Overview

We've implemented a new **Global Match Timer Manager** that provides smooth, 1-second timer updates for all match cards. This solves the issue of timers jumping irregularly (e.g., 4:32 → 4:35 → 4:40).

## Current Status

The new timer system is **DISABLED by default** to ensure app stability. The old timer system continues to work as before.

## How to Enable the New Timer System

1. Open `/src/config/featureFlags.ts`
2. Change `USE_GLOBAL_TIMER_MANAGER` from `false` to `true`:

```typescript
export const FeatureFlags = {
  USE_GLOBAL_TIMER_MANAGER: true, // ← Change this to true
  TIMER_DEBUG_LOGS: false,
};
```

3. Restart the app

## How It Works

### Old System (Default)
- Each match card calculates its own timer
- Uses `calculateMatchTimer` utility
- Updates triggered by SSE/component re-renders
- Can cause irregular updates

### New System (When Enabled)
- Single global timer updates ALL matches every 1 second
- Smooth, predictable updates (4:32 → 4:33 → 4:34)
- Lightweight subscriptions (no multiple SSE connections)
- Uses Zustand for state management

## Architecture

```
GlobalMatchTimerManager
├── Single setInterval (1000ms)
├── Updates all live matches
├── Match cards subscribe to specific matches
└── SSE/API updates feed data to global timer
```

## Benefits

1. **Performance**: One timer for all matches instead of multiple timers
2. **Consistency**: All match cards show synchronized time
3. **Smooth Updates**: Exactly 1-second intervals
4. **Scalable**: Can handle hundreds of matches
5. **Easy Rollback**: Just set feature flag to false

## Testing

To test the new timer:

1. Enable the feature flag
2. Create/start multiple live matches
3. Observe that all timers update smoothly every second
4. Check that match cards and live match screen show same time

## Rollback

If any issues occur, simply set `USE_GLOBAL_TIMER_MANAGER` back to `false` in the feature flags.

## Implementation Details

- **Global State**: `/src/services/globalMatchTimerManager.ts`
- **Hook**: `/src/hooks/useMatchCardTimer.ts`
- **Feature Flag**: `/src/config/featureFlags.ts`
- **Components**: ProfessionalMatchCard already integrated

## Future Enhancements

- Persist timer state across app restarts
- Background timer support
- Offline mode improvements
- Performance monitoring