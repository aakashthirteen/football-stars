# Live Match Header Enhancement - Extra Time & Events Display

## Vision Overview
Transform the match header to display crucial match information at a glance:
- **Extra Time Indicators**: Show "+2" or similar when extra time is granted
- **Key Events Summary**: Display goals and cards below each team with player names

## Implementation Guide

### Step 1: Update Match Type to Include Events
**File**: `/football-app/src/types/index.ts`

First, ensure the Match type includes events array (if not already):
```typescript
export interface Match {
  // ... existing fields ...
  events?: MatchEvent[];
  // ... other fields ...
}
```

### Step 2: Create Mini Event Display Component
**Create new file**: `/football-app/src/components/professional/ProfessionalMiniEvent.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing } = DesignSystem;

interface ProfessionalMiniEventProps {
  eventType: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD';
  playerName: string;
  minute: number;
}

export const ProfessionalMiniEvent: React.FC<ProfessionalMiniEventProps> = ({
  eventType,
  playerName,
  minute,
}) => {
  const getEventStyle = () => {
    switch (eventType) {
      case 'GOAL':
        return {
          icon: '⚽',
          color: colors.primary.main,
        };
      case 'YELLOW_CARD':
        return {
          icon: '🟨',
          color: colors.semantic.warning,
        };
      case 'RED_CARD':
        return {
          icon: '🟥',
          color: colors.semantic.error,
        };
    }
  };

  const style = getEventStyle();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{style.icon}</Text>
      <Text style={styles.playerName} numberOfLines={1}>
        {playerName}
      </Text>
      <Text style={[styles.minute, { color: style.color }]}>
        {minute}'
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
  },
  icon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  playerName: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    flex: 1,
    marginRight: spacing.xs,
  },
  minute: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
  },
});
```

### Step 3: Enhanced Professional Match Header
**Update file**: `/football-app/src/components/professional/ProfessionalMatchHeader.tsx`

Add these imports at the top:
```typescript
import { ProfessionalMiniEvent } from './ProfessionalMiniEvent';
```

Update the interface to include new props:
```typescript
interface ProfessionalMatchHeaderProps {
  // ... existing props ...
  events?: Array<{
    id: string;
    eventType: 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
    minute: number;
    teamId: string;
    playerId: string;
    player?: {
      name: string;
    };
  }>;
  addedTimeFirstHalf?: number;
  addedTimeSecondHalf?: number;
  currentHalf?: 1 | 2;
}
```

Add this function inside the component to filter events by team:
```typescript
const getTeamEvents = (teamId: string | undefined, eventTypes: string[]) => {
  if (!events || !teamId) return [];
  
  return events
    .filter(event => 
      event.teamId === teamId && 
      eventTypes.includes(event.eventType)
    )
    .sort((a, b) => a.minute - b.minute)
    .slice(0, 3); // Show max 3 events per team
};
```

Update the status display function to show extra time:
```typescript
const getStatusDisplay = () => {
  const halfDuration = duration / 2;
  
  switch (status) {
    case 'LIVE':
      const displaySeconds = currentSecond ? String(currentSecond).padStart(2, '0') : '00';
      let timeDisplay = `${currentMinute}:${displaySeconds}`;
      
      // Add extra time indicator
      if (currentHalf === 1 && currentMinute >= halfDuration && addedTimeFirstHalf) {
        timeDisplay = `${Math.floor(halfDuration)}+${currentMinute - Math.floor(halfDuration)}'`;
      } else if (currentHalf === 2 && currentMinute >= duration && addedTimeSecondHalf) {
        timeDisplay = `${duration}+${currentMinute - duration}'`;
      }
      
      return timeDisplay;
    case 'HALFTIME':
      return 'HT';
    case 'COMPLETED':
      return 'FT';
    default:
      return 'Scheduled';
  }
};
```

Add extra time badges to the status container (after the status text):
```typescript
{/* In the statusContainer section, add this after statusText */}
{status === 'LIVE' && (
  <>
    {currentHalf === 1 && addedTimeFirstHalf > 0 && currentMinute < (duration / 2) && (
      <View style={styles.extraTimeBadge}>
        <Text style={styles.extraTimeText}>+{addedTimeFirstHalf}</Text>
      </View>
    )}
    {currentHalf === 2 && addedTimeSecondHalf > 0 && currentMinute < duration && (
      <View style={styles.extraTimeBadge}>
        <Text style={styles.extraTimeText}>+{addedTimeSecondHalf}</Text>
      </View>
    )}
  </>
)}
```

Update the team sections to include events below the score:
```typescript
{/* Home Team Section - add this after the score */}
<View style={styles.teamEvents}>
  {getTeamEvents(homeTeam?.id, ['GOAL', 'YELLOW_CARD', 'RED_CARD']).map((event) => (
    <ProfessionalMiniEvent
      key={event.id}
      eventType={event.eventType as 'GOAL' | 'YELLOW_CARD' | 'RED_CARD'}
      playerName={event.player?.name || 'Unknown'}
      minute={event.minute}
    />
  ))}
</View>

{/* Away Team Section - add this after the score */}
<View style={styles.teamEvents}>
  {getTeamEvents(awayTeam?.id, ['GOAL', 'YELLOW_CARD', 'RED_CARD']).map((event) => (
    <ProfessionalMiniEvent
      key={event.id}
      eventType={event.eventType as 'GOAL' | 'YELLOW_CARD' | 'RED_CARD'}
      playerName={event.player?.name || 'Unknown'}
      minute={event.minute}
    />
  ))}
</View>
```

Add these new styles:
```typescript
extraTimeBadge: {
  position: 'absolute',
  top: -8,
  right: -24,
  backgroundColor: colors.accent.orange,
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
  borderRadius: 10,
  minWidth: 24,
  alignItems: 'center',
},
extraTimeText: {
  fontSize: typography.fontSize.micro,
  fontWeight: typography.fontWeight.bold,
  color: '#FFFFFF',
},
teamEvents: {
  marginTop: spacing.xs,
  width: '100%',
  maxWidth: 120,
},
```

### Step 4: Update LiveMatchScreen to Pass Events
**File**: `/football-app/src/screens/matches/LiveMatchScreen.tsx`

Update the ProfessionalMatchHeader usage to pass the new props:
```typescript
<ProfessionalMatchHeader 
  homeTeam={match.homeTeam || { 
    id: match.homeTeamId,  // Add the ID
    name: `Team ${match.homeTeamId?.substring(0, 8) || 'Home'}`,
    logoUrl: undefined,
    badge: undefined
  }}
  awayTeam={match.awayTeam || { 
    id: match.awayTeamId,  // Add the ID
    name: `Team ${match.awayTeamId?.substring(0, 8) || 'Away'}`,
    logoUrl: undefined,
    badge: undefined
  }}
  homeScore={match.homeScore || 0}
  awayScore={match.awayScore || 0}
  status={timerState.isHalftime ? 'HALFTIME' : match.status}
  currentMinute={timerState.currentMinute}
  currentSecond={timerState.currentSecond}
  venue={match.venue}
  duration={match.duration}
  events={match.events}  // Pass events array
  addedTimeFirstHalf={match.addedTimeFirstHalf}
  addedTimeSecondHalf={match.addedTimeSecondHalf}
  currentHalf={match.currentHalf}
  onBack={() => navigation.goBack()}
  onEndMatch={handleEndMatch}
/>
```

### Step 5: Export the New Component
**File**: `/football-app/src/components/professional/index.ts`

Add the export:
```typescript
export { ProfessionalMiniEvent } from './ProfessionalMiniEvent';
```

## Visual Design Specifications

### Extra Time Display
- Shows as a small orange badge next to the timer
- Format: "+2" for 2 minutes of extra time
- Only visible when extra time is granted and match hasn't reached that phase yet
- Positioned to the top-right of the main timer

### Event Icons Under Teams
- Maximum 3 events shown per team (most important: goals, then cards)
- Compact design with emoji icons:
  - ⚽ for goals
  - 🟨 for yellow cards
  - 🟥 for red cards
- Shows player name and minute
- Semi-transparent background for subtle separation
- Events sorted by minute (earliest first)

## Testing Scenarios

1. **Extra Time in First Half**
   - Add extra time to first half
   - Verify "+X" badge appears next to timer
   - Badge disappears when entering extra time phase

2. **Multiple Goals**
   - Score goals for both teams
   - Verify goals appear under correct team
   - Check player names display correctly

3. **Mixed Events**
   - Add goals and cards for same team
   - Verify proper sorting and display
   - Maximum 3 events shown

4. **No Events**
   - Start match with no events
   - Header should display cleanly without event section

## Expected Result
The header will now provide a comprehensive match overview at a glance:
- Current time with extra time indicator
- Score with team badges
- Key events (goals and cards) listed under each team
- All in a clean, professional design that doesn't clutter the interface

This enhancement transforms the header from a simple score display to an informative match dashboard that keeps users engaged and informed throughout the match!