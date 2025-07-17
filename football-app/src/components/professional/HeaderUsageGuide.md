# Professional Header System Usage Guide

## Overview

The Professional Header System provides a comprehensive set of header components designed for modern sports applications, matching the quality and functionality of FIFA, ESPN, and Premier League apps.

## Key Features

### 🎯 Header Types
- **Default Header**: General purpose header with title, subtitle, and actions
- **Search Header**: Full-featured search with autocomplete and filters
- **Match Header**: Live match display with scores, events, and timer
- **Profile Header**: User profile with stats and avatar
- **Minimal Header**: Clean header for settings and simple screens

### 📱 Responsive Design
- Tablet optimized layouts (768px+)
- Large phone support (414px+)
- Small phone compatibility (<375px)
- Dynamic sizing and spacing
- Accessible touch targets

### 🎨 Professional Styling
- Clean, modern design language
- Smooth animations and transitions
- Glass morphism effects
- Live indicators and pulsing animations
- Professional color system

### ♿ Accessibility
- WCAG AA compliant
- Screen reader support
- Proper semantic roles
- High contrast support
- Keyboard navigation

## Quick Start

### Using Pre-configured Headers

```tsx
import {
  HomeHeader,
  TeamsHeader,
  MatchesHeader,
  SearchHeader,
  ProfileHeader,
  LiveMatchHeader,
} from '../components/professional';

// Home Screen
<HomeHeader
  user={user}
  onSearch={() => navigation.navigate('Search')}
  onNotifications={() => navigation.navigate('Notifications')}
  onProfile={() => navigation.navigate('Profile')}
>
  <WelcomeMessage user={user} />
</HomeHeader>

// Teams Screen
<TeamsHeader
  onSearch={() => navigation.navigate('Search')}
  onNotifications={() => navigation.navigate('Notifications')}
  onProfile={() => navigation.navigate('Profile')}
/>

// Search Screen
<SearchHeader
  onBack={() => navigation.goBack()}
  onSearch={(query) => handleSearch(query)}
  searchResults={searchResults}
  placeholder="Search players, teams, matches..."
/>

// Profile Screen
<ProfileHeader
  user={user}
  stats={playerStats}
  onBack={() => navigation.goBack()}
  onSettings={() => navigation.navigate('Settings')}
  editable={true}
/>

// Live Match Screen
<LiveMatchHeader
  match={matchData}
  timer={timerData}
  onBack={() => navigation.goBack()}
  onEndMatch={() => handleEndMatch()}
/>
```

### Using the Header System Directly

```tsx
import { ProfessionalHeaderSystem } from '../components/professional';

// Automatic configuration based on context
<ProfessionalHeaderSystem
  context="home"
  title="Football Stars"
  subtitle="Your football journey starts here"
  user={user}
  onSearch={() => navigation.navigate('Search')}
  onNotifications={() => navigation.navigate('Notifications')}
  onProfile={() => navigation.navigate('Profile')}
/>

// Custom configuration
<ProfessionalHeaderSystem
  context="teams"
  type="minimal"
  title="My Teams"
  centerTitle={true}
  onBack={() => navigation.goBack()}
  customProps={{
    showLiveIndicator: hasLiveMatches,
    notificationCount: unreadCount,
  }}
/>
```

## Header Types Detailed

### 1. Default Header (`ProfessionalHeader`)

**Use Case**: General screens like Teams, Matches, Tournaments

**Features**:
- Title and subtitle support
- Navigation actions (back, search, notifications, profile)
- Children content support
- Multiple variants (default, match, team, profile, minimal)
- Live indicators
- Animation support

```tsx
<ProfessionalHeader
  title="Teams"
  subtitle="Manage your football teams"
  showBack={false}
  showSearch={true}
  showNotifications={true}
  showProfile={true}
  variant="default"
  animateOnMount={true}
  centerTitle={false}
  notificationCount={5}
  onSearch={() => handleSearch()}
  onNotifications={() => handleNotifications()}
  onProfile={() => handleProfile()}
/>
```

### 2. Search Header (`ProfessionalSearchHeader`)

**Use Case**: Search screens with live results and filtering

**Features**:
- Real-time search with debouncing
- Search suggestions and autocomplete
- Recent searches
- Filter chips
- Voice search support
- Loading states

```tsx
<ProfessionalSearchHeader
  placeholder="Search players, teams, matches..."
  onBack={() => navigation.goBack()}
  onSearch={(query) => handleSearch(query)}
  onResultSelect={(result) => handleResultSelect(result)}
  searchResults={searchResults}
  showRecentSearches={true}
  recentSearches={recentSearches}
  onClearRecent={() => clearRecentSearches()}
  showFilters={true}
  activeFilters={['Players', 'Teams']}
  onFilterToggle={(filter) => toggleFilter(filter)}
  showVoiceSearch={true}
  onVoiceSearch={() => startVoiceSearch()}
  isLoading={isSearching}
  autoFocus={true}
/>
```

### 3. Match Header (`ProfessionalMatchHeader`)

**Use Case**: Live matches and match details

**Features**:
- Live score display with animations
- Team logos and information
- Match status and timer
- Live events feed
- Competition badges
- Venue information
- Action buttons (share, favorite, notifications)

```tsx
<ProfessionalMatchHeader
  homeTeam={{
    id: '1',
    name: 'Manchester United',
    shortName: 'MAN UTD',
    logo: 'https://example.com/logo.png',
    score: 2,
    color: '#DA020E'
  }}
  awayTeam={{
    id: '2',
    name: 'Liverpool FC',
    shortName: 'LIV',
    logo: 'https://example.com/logo.png',
    score: 1,
    color: '#C8102E'
  }}
  matchStatus="live"
  venue="Old Trafford"
  competition="Premier League"
  competitionLogo="https://example.com/pl-logo.png"
  minute={75}
  additionalTime={3}
  onBack={() => navigation.goBack()}
  onShare={() => shareMatch()}
  onFavorite={() => toggleFavorite()}
  onNotifications={() => handleNotifications()}
  isFavorite={true}
  showActions={true}
  animateScore={true}
  liveEvents={[
    {
      type: 'goal',
      minute: 23,
      player: 'Marcus Rashford',
      team: 'home'
    },
    {
      type: 'card',
      minute: 45,
      player: 'Virgil van Dijk',
      team: 'away'
    }
  ]}
/>
```

### 4. Profile Header (`ProfessionalProfileHeader`)

**Use Case**: User profiles and player profiles

**Features**:
- User avatar with fallback initials
- Position badges for players
- Player statistics cards
- Cover image support
- Editable profile support
- Social sharing
- Team information

```tsx
<ProfessionalProfileHeader
  user={{
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg',
    coverImage: 'https://example.com/cover.jpg'
  }}
  stats={{
    matchesPlayed: 25,
    goals: 12,
    assists: 8,
    averageRating: 7.8,
    position: 'FWD',
    team: 'Manchester United'
  }}
  onBack={() => navigation.goBack()}
  onSettings={() => navigation.navigate('Settings')}
  onEdit={() => navigation.navigate('EditProfile')}
  onShare={() => shareProfile()}
  showActions={true}
  editable={true}
  animateOnMount={true}
  showStats={true}
  customBackground="https://example.com/stadium.jpg"
  tintColor="#DA020E"
/>
```

## Responsive Behavior

### Tablet (768px+)
- Larger fonts and spacing
- More prominent actions
- Extended header heights
- Enhanced animations

### Large Phone (414px+)
- Standard sizing
- Optimal touch targets
- Balanced layouts

### Small Phone (<375px)
- Compact layouts
- Reduced font sizes
- Prioritized content
- Simplified interactions

## Animation System

### Mount Animations
- Fade in effects
- Slide from top
- Scale animations
- Staggered element reveals

### Live Animations
- Pulsing live indicators
- Score update animations
- Progress bars
- Wave effects

### Interaction Animations
- Button press feedback
- Icon transitions
- Color changes
- Loading states

## Accessibility Features

### Screen Reader Support
```tsx
// Automatic accessibility props
accessibilityRole="header"
accessibilityLabel="Teams screen header"
importantForAccessibility="yes"
```

### Keyboard Navigation
- Tab order optimization
- Focus indicators
- Skip links
- Keyboard shortcuts

### High Contrast
- WCAG AA compliant colors
- Alternative color schemes
- Enhanced borders
- Clear visual hierarchy

## Best Practices

### 1. Choose the Right Header
- Use `HomeHeader` for main navigation screens
- Use `SearchHeader` for search functionality
- Use `LiveMatchHeader` for real-time match data
- Use `ProfileHeader` for user/player profiles

### 2. Performance Optimization
- Use `animateOnMount={false}` for improved performance on older devices
- Implement proper image optimization for logos and avatars
- Use placeholder components while loading data

### 3. Consistent Navigation
- Always provide back navigation on detail screens
- Use consistent action placement
- Maintain navigation hierarchy

### 4. Data Handling
- Provide fallback data for all props
- Handle loading and error states
- Implement proper data validation

## Migration Guide

### From Old Headers

```tsx
// Old way
<View style={styles.header}>
  <TouchableOpacity onPress={onBack}>
    <Ionicons name="arrow-back" />
  </TouchableOpacity>
  <Text style={styles.title}>{title}</Text>
  <TouchableOpacity onPress={onSearch}>
    <Ionicons name="search" />
  </TouchableOpacity>
</View>

// New way
<TeamsHeader
  onBack={onBack}
  onSearch={onSearch}
/>
```

### Using the Header System

```tsx
// Replace multiple header types with the unified system
<ProfessionalHeaderSystem
  context="teams"
  title="Teams"
  onBack={onBack}
  onSearch={onSearch}
/>
```

## Customization

### Theme Integration
All headers use the professional design system and automatically adapt to:
- Light/dark mode
- Team colors
- Brand colors
- Accessibility preferences

### Custom Styling
```tsx
<ProfessionalHeader
  customProps={{
    style: customStyles,
    backgroundColor: teamColor,
    tintColor: '#FFFFFF'
  }}
/>
```

This header system provides a comprehensive, professional solution that matches the quality of top sports applications while maintaining accessibility and performance standards.