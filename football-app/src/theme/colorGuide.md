# Professional Football App Color System Guide

## Overview

This color system has been completely redesigned to match professional sports applications like FIFA, ESPN, Premier League app, and UEFA apps. The focus is on clean, accessible, and professional design that works well for a serious sports management application.

## Color Philosophy

### Key Principles
1. **Professional First**: Clean whites, professional blues, subtle grays
2. **Accessibility**: WCAG AA compliant contrast ratios
3. **Team Identity**: Rich team-specific color palettes
4. **Semantic Clarity**: Clear meaning for status and feedback colors
5. **Light/Dark Ready**: Full support for both light and dark modes

## Primary Color Palette

### Professional Blue System
- **Primary Main**: `#1E40AF` - Deep professional blue (FIFA/UEFA inspired)
- **Primary Light**: `#3B82F6` - Interactive blue for buttons and links  
- **Primary Lighter**: `#60A5FA` - Hover states and highlights
- **Primary Dark**: `#1E3A8A` - Emphasis and important elements
- **Primary Darker**: `#1E2A69` - Headers and navigation

### Professional Green System (Football Pitch)
- **Secondary Main**: `#059669` - Professional forest green
- **Secondary Light**: `#10B981` - Success states
- **Secondary Lighter**: `#34D399` - Light success backgrounds
- **Secondary Dark**: `#047857` - Dark success emphasis

### Neutral Gray Scale
- **White**: `#FFFFFF` - Pure white for backgrounds
- **Gray 50-900**: Professional gray scale from `#F9FAFB` to `#111827`
- **Black**: `#000000` - Pure black for high contrast

## Usage Guidelines

### Background Colors

#### Light Mode (Default)
```typescript
// Main app background
backgroundColor: Colors.background.primary // #FFFFFF

// Card backgrounds  
backgroundColor: Colors.background.secondary // #F9FAFB

// Elevated elements
backgroundColor: Colors.background.elevated // #FFFFFF with shadow
```

#### Dark Mode
```typescript
// Main app background
backgroundColor: Colors.background.primaryDark // #0F172A

// Card backgrounds
backgroundColor: Colors.background.secondaryDark // #1E293B

// Elevated elements  
backgroundColor: Colors.background.elevatedDark // #1E293B
```

### Text Colors 

#### Light Mode
```typescript
// Primary text
color: Colors.text.primary // #111827

// Secondary text
color: Colors.text.secondary // #4B5563

// Links
color: Colors.text.link // #1E40AF
```

#### Dark Mode
```typescript
// Primary text
color: Colors.text.primaryDark // #F9FAFB

// Secondary text  
color: Colors.text.secondaryDark // #D1D5DB

// Links
color: Colors.text.linkDark // #60A5FA
```

### Semantic Colors

#### Success (Completed matches, positive actions)
```typescript
backgroundColor: Colors.semantic.success.main // #059669
backgroundColor: Colors.semantic.success.background // Light background
borderColor: Colors.semantic.success.border // Borders
```

#### Error (Failed actions, cancelled matches)
```typescript
backgroundColor: Colors.semantic.error.main // #DC2626
backgroundColor: Colors.semantic.error.background // Light background
borderColor: Colors.semantic.error.border // Borders
```

#### Warning (Postponed matches, cautions)
```typescript
backgroundColor: Colors.semantic.warning.main // #D97706
backgroundColor: Colors.semantic.warning.background // Light background
borderColor: Colors.semantic.warning.border // Borders
```

#### Info (Scheduled matches, general information)
```typescript
backgroundColor: Colors.semantic.info.main // #1E40AF
backgroundColor: Colors.semantic.info.background // Light background
borderColor: Colors.semantic.info.border // Borders
```

### Match Status Colors

#### Live Matches
```typescript
// Main live indicator
backgroundColor: Colors.match.live.main // #DC2626

// Live match card border
borderColor: Colors.match.live.border // #DC2626

// Pulsing animation
backgroundColor: Colors.match.live.pulse // #EF4444
```

#### Scheduled Matches  
```typescript
backgroundColor: Colors.match.scheduled.main // #1E40AF
borderColor: Colors.match.scheduled.border // #1E40AF
```

#### Completed Matches
```typescript
backgroundColor: Colors.match.completed.main // #059669
borderColor: Colors.match.completed.border // #059669
```

## Team Colors

### Premier League Teams
```typescript
// Arsenal
Colors.teams.premierLeague.arsenal.primary // #EF0107
Colors.teams.premierLeague.arsenal.secondary // #023474

// Chelsea
Colors.teams.premierLeague.chelsea.primary // #034694
Colors.teams.premierLeague.chelsea.secondary // #FFFFFF

// Liverpool  
Colors.teams.premierLeague.liverpool.primary // #C8102E
Colors.teams.premierLeague.liverpool.secondary // #00B2A9

// And many more...
```

### La Liga Teams
```typescript
// Real Madrid
Colors.teams.laLiga.real_madrid.primary // #FFFFFF
Colors.teams.laLiga.real_madrid.secondary // #00529F

// Barcelona
Colors.teams.laLiga.barcelona.primary // #A50044
Colors.teams.laLiga.barcelona.secondary // #004D98
```

### Generic Team Colors
```typescript
// Home team
Colors.teams.home.primary // #1E40AF
Colors.teams.home.secondary // #3B82F6

// Away team  
Colors.teams.away.primary // #DC2626
Colors.teams.away.secondary // #EF4444
```

## Button Colors

### Primary Buttons (Main actions)
```typescript
backgroundColor: Colors.primary.main // #1E40AF
borderColor: Colors.primary.main
// Text should be white: Colors.text.inverse
```

### Secondary Buttons (Secondary actions)
```typescript
backgroundColor: Colors.surface.secondary // #F9FAFB
borderColor: Colors.border.medium // #D1D5DB  
// Text should be: Colors.text.primary
```

### Success Buttons (Positive actions)
```typescript
backgroundColor: Colors.semantic.success.main // #059669
borderColor: Colors.semantic.success.main
// Text should be white: Colors.text.inverse
```

### Error Buttons (Destructive actions)
```typescript
backgroundColor: Colors.semantic.error.main // #DC2626
borderColor: Colors.semantic.error.main
// Text should be white: Colors.text.inverse
```

## Gradients

### Primary Gradients
```typescript
// Main brand gradient
colors: Gradients.primary // ['#1E40AF', '#3B82F6']

// Vertical gradient for headers
colors: Gradients.primaryVertical // ['#1E40AF', '#1E3A8A']
```

### Special Football Gradients
```typescript
// Football pitch gradient
colors: Gradients.pitch // ['#059669', '#047857']

// Stadium atmosphere
colors: Gradients.stadium // ['#1F2937', '#374151']

// Trophy/achievement gradient
colors: Gradients.trophy // ['#F59E0B', '#D97706']
```

## Accessibility

### High Contrast Combinations
```typescript
// Light backgrounds
color: AccessibilityColors.highContrast.onLight.primary // #111827
color: AccessibilityColors.highContrast.onLight.secondary // #4B5563

// Dark backgrounds  
color: AccessibilityColors.highContrast.onDark.primary // #F9FAFB
color: AccessibilityColors.highContrast.onDark.secondary // #D1D5DB

// Colored backgrounds
color: AccessibilityColors.highContrast.onPrimary // #FFFFFF
color: AccessibilityColors.highContrast.onError // #FFFFFF
```

### Focus States
```typescript
// Focus ring color
borderColor: AccessibilityColors.focus.ring // #60A5FA

// Focus offset
borderColor: AccessibilityColors.focus.offset // #FFFFFF  
```

## Best Practices

### Do's ✅
- Use semantic colors for their intended purpose (success for positive, error for negative)
- Always check contrast ratios with the AccessibilityColors helpers
- Use team colors for team-specific UI elements
- Stick to the neutral gray scale for text hierarchy
- Use primary blue for main brand elements
- Use professional green for football-related elements

### Don'ts ❌
- Don't use bright neon colors (this replaces the old cyberpunk theme)
- Don't use red for anything other than live matches or errors
- Don't mix team colors inappropriately  
- Don't ignore the light/dark mode variants
- Don't use colors outside the defined system
- Don't sacrifice accessibility for visual appeal

## Migration from Old System

The previous system used bright neon greens (`#00E676`) and cyberpunk aesthetics. The new system uses:

- **Old neon green** → **New professional blue** (`#1E40AF`)
- **Old bright colors** → **New subtle, professional colors**
- **Old dark-only design** → **New light/dark mode support**
- **Old limited team colors** → **New comprehensive team color system**

## Examples

### Professional Match Card
```typescript
const matchCardStyle = {
  backgroundColor: Colors.surface.primary, // #FFFFFF
  borderWidth: 1,
  borderColor: Colors.border.light, // #E5E7EB
  borderRadius: 12,
  shadowColor: Colors.shadow.light, // rgba(0, 0, 0, 0.1)
}

// Live match variant
const liveMatchStyle = {
  ...matchCardStyle,
  borderWidth: 2,
  borderColor: Colors.match.live.main, // #DC2626
}
```

### Professional Button
```typescript
const primaryButton = {
  backgroundColor: Colors.primary.main, // #1E40AF
  borderWidth: 1,
  borderColor: Colors.primary.main,
  paddingHorizontal: 24,
  paddingVertical: 16,
  borderRadius: 12,
  shadowColor: Colors.shadow.medium,
}

const buttonText = {
  color: Colors.text.inverse, // #FFFFFF
  fontSize: 16,
  fontWeight: '600',
}
```

This professional color system provides a clean, accessible, and team-focused foundation for the football app that matches the quality and professionalism of leading sports applications.