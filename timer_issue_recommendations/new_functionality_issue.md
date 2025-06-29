# Extra Time Display & Real-time Update Fixes

## Understanding the Issues

Let me break down what's happening with each problem:

### 1. Extra Time Minute Display (5+0 vs 5+1)

The issue here is about when extra time starts. Think of it like this: when a 5-minute half ends and you have 2 minutes of extra time, the progression should be:
- Minute 4:59 → "5'"
- Minute 5:00 → "5+1'" (NOT "5+0'")
- Minute 5:59 → "5+1'"
- Minute 6:00 → "5+2'"

Your timer is treating minute 5 as "5+0" when it should already be showing "5+1" because you're in the first minute of extra time.

### 2. Extra Time Badge Not Showing

The badge should appear once you pass the regular half duration, showing the total extra time for that half (e.g., "+2").

### 3. Real-time Updates Not Reflecting

This is a state management issue. When you add extra time via the API, the component doesn't know to refetch the data. It's like updating a database but forgetting to refresh the webpage.

## Complete Solution

### Step 1: Fix the Extra Time Minute Calculation

In your timer hook or component, update the display logic:

```typescript
// In useSimpleMatchTimer.ts or wherever your timer logic is

const calculateTimerDisplay = (currentMinute: number, currentSecond: number, halfDuration: number, isSecondHalf: boolean) => {
  // Determine which half we're in
  const halfOffset = isSecondHalf ? halfDuration : 0;
  const displayMinute = currentMinute + halfOffset;
  
  // Check if we're in extra time
  const regularHalfEnd = isSecondHalf ? halfDuration * 2 : halfDuration;
  const isInExtraTime = currentMinute >= halfDuration;
  
  if (isInExtraTime) {
    // Calculate extra time minute (starting from 1, not 0)
    const extraMinute = currentMinute - halfDuration + 1;
    return `${halfDuration}+${extraMinute}'`;
  }
  
  // Regular time display
  return `${displayMinute + 1}'`;
};
```

### Step 2: Fix the Extra Time Badge Display

Update your ProfessionalMatchHeader to properly show the extra time badge:

```typescript
// In ProfessionalMatchHeader.tsx

const ProfessionalMatchHeader = ({ match, timer, onBack }) => {
  // Get the current half and extra time values
  const currentHalf = match?.current_half || 1;
  const addedTimeFirst = match?.added_time_first_half || 0;
  const addedTimeSecond = match?.added_time_second_half || 0;
  
  // Determine if we should show the extra time badge
  const halfDuration = match.duration / 2;
  const isFirstHalf = currentHalf === 1;
  const isSecondHalf = currentHalf === 2;
  
  // Show badge when we're past regular time in the current half
  const shouldShowExtraTimeBadge = 
    (isFirstHalf && timer.currentMinute >= halfDuration && addedTimeFirst > 0) ||
    (isSecondHalf && timer.currentMinute >= halfDuration && addedTimeSecond > 0);
  
  const extraTimeToShow = isFirstHalf ? addedTimeFirst : addedTimeSecond;
  
  return (
    <View style={styles.header}>
      {/* Timer display without green dot */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{timer.displayText}</Text>
        {shouldShowExtraTimeBadge && (
          <View style={styles.extraTimeBadge}>
            <Text style={styles.extraTimeText}>+{extraTimeToShow}</Text>
          </View>
        )}
      </View>
      {/* Rest of your header */}
    </View>
  );
};
```

### Step 3: Remove the Green Dot

Find the timer display component and remove the status indicator:

```typescript
// Remove or comment out the green dot
// Before:
<View style={styles.timerContainer}>
  <View style={styles.greenDot} /> {/* Remove this line */}
  <Text>{timer.displayText}</Text>
</View>

// After:
<View style={styles.timerContainer}>
  <Text style={styles.timerText}>{timer.displayText}</Text>
</View>
```

### Step 4: Sleek Event Display (No Boxes)

Update the event display to be more minimal and ensure names are fully visible:

```typescript
// In ProfessionalMatchHeader.tsx or wherever events are displayed

const EventDisplay = ({ event }) => (
  <View style={styles.eventRow}>
    <Text style={styles.eventMinute}>{event.minute}'</Text>
    <Text style={styles.eventPlayer} numberOfLines={1} ellipsizeMode="tail">
      {event.player_name || event.playerName}
    </Text>
    {event.event_type === 'GOAL' && <Text style={styles.goalIcon}>⚽</Text>}
    {event.event_type === 'YELLOW_CARD' && <Text style={styles.cardIcon}>🟨</Text>}
    {event.event_type === 'RED_CARD' && <Text style={styles.cardIcon}>🟥</Text>}
  </View>
);

const styles = StyleSheet.create({
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  eventMinute: {
    fontSize: 10,
    color: '#666',
    marginRight: 4,
    minWidth: 20,
  },
  eventPlayer: {
    fontSize: 11,
    color: '#333',
    flex: 1, // This ensures the name takes available space
  },
  goalIcon: {
    fontSize: 10,
    marginLeft: 4,
  },
  cardIcon: {
    fontSize: 10,
    marginLeft: 4,
  },
});
```

### Step 5: Fix Real-time Extra Time Updates

The crucial fix for the "+1" button not updating immediately is to implement proper state management:

```typescript
// In LiveMatchScreen.tsx

const LiveMatchScreen = ({ route, navigation }) => {
  const [match, setMatch] = useState(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Function to handle adding extra time
  const handleAddExtraTime = async (minutes) => {
    try {
      const response = await api.post(`/matches/${matchId}/extra-time`, {
        minutes,
        half: match.current_half
      });
      
      if (response.data.success) {
        // Show success message
        Alert.alert('Success', `${minutes} minute(s) extra time added`);
        
        // CRUCIAL: Update the local state immediately
        setMatch(prevMatch => ({
          ...prevMatch,
          added_time_first_half: match.current_half === 1 
            ? (prevMatch.added_time_first_half || 0) + minutes 
            : prevMatch.added_time_first_half,
          added_time_second_half: match.current_half === 2 
            ? (prevMatch.added_time_second_half || 0) + minutes 
            : prevMatch.added_time_second_half,
        }));
        
        // Also trigger a fresh fetch to ensure consistency
        fetchMatchData();
      }
    } catch (error) {
      console.error('Error adding extra time:', error);
      Alert.alert('Error', 'Failed to add extra time');
    }
  };

  // Polling function that checks for updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMatchData();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [matchId]);

  return (
    // Your component JSX
  );
};
```

### Step 6: Complete Timer Display Logic

Here's the comprehensive timer display logic that handles all cases:

```typescript
// In your timer component or hook

const getTimerDisplay = () => {
  const halfDuration = match.duration / 2;
  const currentHalf = match.current_half || 1;
  const isSecondHalf = currentHalf === 2;
  
  // Base calculation
  let displayMinute = timer.currentMinute;
  let displayText = '';
  
  if (isSecondHalf) {
    // In second half, add the first half duration
    displayMinute = timer.currentMinute + halfDuration;
  }
  
  // Check if we're in extra time
  if (timer.currentMinute >= halfDuration) {
    // We're in extra time
    const extraMinute = timer.currentMinute - halfDuration + 1;
    const baseMinute = isSecondHalf ? halfDuration * 2 : halfDuration;
    displayText = `${baseMinute}+${extraMinute}'`;
  } else {
    // Regular time
    displayText = `${displayMinute + 1}'`;
  }
  
  return displayText;
};
```

## Testing Your Implementation

After implementing these changes, test the following scenarios:

1. **Extra Time Display**: Let a half run past 5 minutes - it should show "5+1'" not "5+0'"
2. **Extra Time Badge**: The "+2" badge should appear when in extra time
3. **Real-time Updates**: Click "+1" button and the extra time should update immediately
4. **Event Display**: Goals should show cleanly without boxes, names fully visible
5. **No Green Dot**: Timer should display without any status indicator

## Why These Solutions Work

1. **Extra Time Calculation**: By adding 1 to the extra minute calculation, we correctly show that we're in the first minute of extra time, not the "zeroth" minute.

2. **State Management**: By updating the local state immediately after the API call, we don't have to wait for the next poll cycle to see changes.

3. **Responsive Design**: Using `flex: 1` and `numberOfLines={1}` ensures names fit within available space while remaining readable.

4. **Clean UI**: Removing boxes and using subtle styling makes the interface more professional while maintaining functionality.

The key insight here is that real-time applications need both immediate local updates (for responsiveness) and periodic server syncs (for consistency). This dual approach ensures users see their actions reflected instantly while keeping data accurate across all clients.