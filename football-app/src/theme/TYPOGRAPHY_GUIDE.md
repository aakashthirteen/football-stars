# Professional Typography System Guide

## Overview

This comprehensive typography system is designed specifically for the Football Stars app, taking inspiration from professional sports applications like FIFA, ESPN, Premier League, and Sky Sports. The system prioritizes readability, accessibility, and consistent visual hierarchy while maintaining the professional aesthetic expected in modern sports applications.

## Key Features

- ✅ **Professional Sports Design**: Typography styles inspired by FIFA, ESPN, and Premier League apps
- ✅ **WCAG AA Compliance**: All text meets accessibility standards for contrast and readability
- ✅ **Responsive Scaling**: Text automatically adjusts for different screen sizes
- ✅ **Semantic Components**: Pre-built components for common use cases
- ✅ **Sports-Specific Styles**: Specialized typography for scores, stats, timers, and match data
- ✅ **Performance Optimized**: Efficient font loading and rendering
- ✅ **Cross-Platform**: Consistent appearance across iOS and Android

## Font System

### Font Families

The system uses platform-optimized font families:

- **Primary**: SF Pro Text (iOS) / Roboto (Android) - For body text and general content
- **Display**: SF Pro Display (iOS) / Roboto (Android) - For headings and emphasis
- **Condensed**: SF Pro Rounded (iOS) / Roboto Condensed (Android) - For compact layouts
- **Mono**: SF Mono (iOS) / Roboto Mono (Android) - For scores, timers, and numeric data
- **Impact**: SF Pro Display (iOS) / Roboto Black (Android) - For hero text and maximum impact

### Font Weights

```typescript
thin: '100'
extraLight: '200'
light: '300'
regular: '400'     // Default body weight
medium: '500'      // Emphasized body text
semiBold: '600'    // Headings and important text
bold: '700'        // Strong emphasis
extraBold: '800'   // Display text
black: '900'       // Maximum impact
```

### Font Sizes

Based on a 16px base size with perfect fourth scale (1.333):

```typescript
// Display Sizes
hero: 48px         // Hero sections
display1: 40px     // Major headings
display2: 32px     // Large headings

// Heading Hierarchy
h1: 28px          // Main page titles
h2: 24px          // Section headers
h3: 20px          // Subsections
h4: 18px          // Card titles
h5: 16px          // Small headers
h6: 14px          // Micro headers

// Body Text
large: 18px       // Important content
regular: 16px     // Standard body
small: 14px       // Secondary content

// UI Elements
caption: 12px     // Captions and labels
micro: 10px       // Very small text

// Sports-Specific
scoreMain: 36px   // Main match scores
scoreSecondary: 24px // Secondary scores
timer: 16px       // Match timers
stats: 14px       // Statistics
```

## Text Components

### Basic Text Components

#### Display & Hero Text
```tsx
import { HeroText, Display1Text, Display2Text } from './ProfessionalText';

<HeroText align="center">Champions League</HeroText>
<Display1Text>Manchester United</Display1Text>
<Display2Text>Premier League</Display2Text>
```

#### Headings (H1-H6)
```tsx
import { H1Text, H2Text, H3Text, H4Text, H5Text, H6Text } from './ProfessionalText';

<H1Text>Match Overview</H1Text>
<H2Text>Team Statistics</H2Text>
<H3Text>Player Performance</H3Text>
<H4Text>Recent Matches</H4Text>
<H5Text>Last 5 Games</H5Text>
<H6Text>Formation</H6Text>
```

#### Body Text
```tsx
import { BodyLargeText, BodyText, BodySmallText, BodyBoldText } from './ProfessionalText';

<BodyLargeText>Important content that needs emphasis</BodyLargeText>
<BodyText>Standard body text for general content</BodyText>
<BodySmallText>Secondary information and descriptions</BodySmallText>
<BodyBoldText>Bold emphasis within paragraphs</BodyBoldText>
```

#### Captions & Labels
```tsx
import { CaptionText, CaptionBoldText, LabelText, LabelSmallText } from './ProfessionalText';

<CaptionText>Image caption or additional information</CaptionText>
<CaptionBoldText>Important metadata</CaptionBoldText>
<LabelText>Field Label</LabelText>
<LabelSmallText>Micro Label</LabelSmallText>
```

#### Button Text
```tsx
import { ButtonPrimaryText, ButtonSecondaryText, ButtonSmallText } from './ProfessionalText';

<ButtonPrimaryText>Start Match</ButtonPrimaryText>
<ButtonSecondaryText>View Details</ButtonSecondaryText>
<ButtonSmallText>Edit</ButtonSmallText>
```

### Sports-Specific Components

#### Score Display
```tsx
import { ScoreMainText, ScoreSecondaryText } from './ProfessionalText';

<ScoreMainText>3</ScoreMainText>  // Main match score
<ScoreSecondaryText>1</ScoreSecondaryText>  // Secondary score
```

#### Timer Display
```tsx
import { TimerText, TimerLargeText } from './ProfessionalText';

<TimerText>45'</TimerText>  // Standard timer
<TimerLargeText>75'</TimerLargeText>  // Large timer for emphasis
```

#### Statistics
```tsx
import { StatValueText, StatLabelText } from './ProfessionalText';

<StatValueText>15</StatValueText>
<StatLabelText>Goals</StatLabelText>
```

#### Team & Player Names
```tsx
import { TeamNameText, TeamNameLargeText, PlayerNameText, PlayerNameLargeText } from './ProfessionalText';

<TeamNameText>Manchester United</TeamNameText>
<TeamNameLargeText>Liverpool</TeamNameLargeText>
<PlayerNameText>Cristiano Ronaldo</PlayerNameText>
<PlayerNameLargeText>Lionel Messi</PlayerNameLargeText>
```

#### Match Events & Competition
```tsx
import { MatchEventText, LiveIndicatorText, CompetitionText, PositionText } from './ProfessionalText';

<MatchEventText>15' - Goal by Marcus Rashford</MatchEventText>
<LiveIndicatorText>LIVE</LiveIndicatorText>
<CompetitionText>Premier League 2023/24</CompetitionText>
<PositionText>1</PositionText>
```

## Advanced Features

### Responsive Typography

Text automatically scales based on screen size:

```tsx
// Responsive scaling enabled (default)
<BodyText responsive={true}>
  This text scales with screen size
</BodyText>

// Fixed size
<BodyText responsive={false}>
  This text maintains fixed size
</BodyText>
```

### Accessibility Features

Enhanced accessibility with minimum font sizes and improved line heights:

```tsx
// Accessibility improvements enabled (default)
<BodyText accessible={true}>
  WCAG AA compliant text with enhanced readability
</BodyText>

// Standard accessibility
<BodyText accessible={false}>
  Standard text without accessibility enhancements
</BodyText>
```

### Custom Colors

All components accept custom colors while maintaining the design system:

```tsx
import DesignSystem from '../../theme/designSystem';
const { colors } = DesignSystem;

<H2Text color={colors.primary.main}>Primary colored heading</H2Text>
<BodyText color={colors.semantic.success.main}>Success message</BodyText>
<CaptionText color={colors.text.secondary}>Secondary caption</CaptionText>
```

### Text Alignment

```tsx
<H1Text align="left">Left aligned</H1Text>
<H1Text align="center">Center aligned</H1Text>
<H1Text align="right">Right aligned</H1Text>
<BodyText align="justify">Justified text</BodyText>
```

## Best Practices

### Hierarchy Guidelines

1. **Use one H1 per screen** - Clear page hierarchy
2. **Don't skip heading levels** - H1 → H2 → H3, not H1 → H3
3. **Limit heading levels** - Rarely go beyond H4 in mobile apps
4. **Use display text sparingly** - For hero sections and major impact only

### Color Usage

1. **Primary text** (`colors.text.primary`) - Main content, headings
2. **Secondary text** (`colors.text.secondary`) - Supporting information
3. **Tertiary text** (`colors.text.tertiary`) - Labels, captions, metadata
4. **Brand colors** - Use for emphasis and interactive elements
5. **Semantic colors** - Success (green), Error (red), Warning (orange)

### Accessibility Guidelines

1. **Maintain contrast ratios** - Minimum 4.5:1 for normal text, 3:1 for large text
2. **Use accessible text sizes** - Enable `accessible={true}` for better readability
3. **Provide adequate line spacing** - System automatically optimizes line heights
4. **Consider reading patterns** - Left-align body text, center-align headings sparingly

### Performance Tips

1. **Use semantic components** - Pre-optimized for performance
2. **Enable responsive scaling** - Better user experience across devices
3. **Limit font weight variations** - Stick to system-defined weights
4. **Use consistent spacing** - Leverage built-in spacing system

## Sports App Specific Patterns

### Match Card Layout
```tsx
<View style={styles.matchCard}>
  <CompetitionText>Premier League</CompetitionText>
  
  <View style={styles.teamsContainer}>
    <TeamNameText>Manchester United</TeamNameText>
    <ScoreMainText>3</ScoreMainText>
    <TimerText>FT</TimerText>
    <ScoreMainText>1</ScoreMainText>
    <TeamNameText>Liverpool</TeamNameText>
  </View>
  
  <CaptionText>Old Trafford • Yesterday</CaptionText>
</View>
```

### Player Statistics Card
```tsx
<View style={styles.statsCard}>
  <PlayerNameLargeText>Cristiano Ronaldo</PlayerNameLargeText>
  
  <View style={styles.statsGrid}>
    <View style={styles.statItem}>
      <StatValueText>15</StatValueText>
      <StatLabelText>Goals</StatLabelText>
    </View>
    <View style={styles.statItem}>
      <StatValueText>8</StatValueText>
      <StatLabelText>Assists</StatLabelText>
    </View>
    <View style={styles.statItem}>
      <StatValueText>28</StatValueText>
      <StatLabelText>Matches</StatLabelText>
    </View>
  </View>
</View>
```

### Live Match Header
```tsx
<View style={styles.liveHeader}>
  <View style={styles.liveIndicator}>
    <LiveIndicatorText>LIVE</LiveIndicatorText>
  </View>
  <TimerLargeText color={colors.status.live}>75'</TimerLargeText>
  <CompetitionText>Champions League Final</CompetitionText>
</View>
```

## Migration Guide

### From Existing Typography

If you're migrating from the existing typography system:

1. **Replace generic Text components** with semantic components
2. **Update font size references** to use the new scale
3. **Apply consistent colors** using the design system
4. **Enable responsive features** for better mobile experience
5. **Test accessibility** with screen readers and high contrast modes

### Common Replacements

```tsx
// Old approach
<Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>
  Title
</Text>

// New approach
<H2Text color={colors.text.primary}>
  Title
</H2Text>
```

```tsx
// Old approach
<Text style={{ fontSize: 16, color: '#666' }}>
  Description
</Text>

// New approach
<BodyText color={colors.text.secondary}>
  Description
</BodyText>
```

## Testing & Quality Assurance

### Typography Checklist

- [ ] All text uses semantic components
- [ ] Proper heading hierarchy (H1 → H2 → H3)
- [ ] Accessible color contrast ratios
- [ ] Responsive scaling works on all devices
- [ ] Sports-specific data uses appropriate components
- [ ] Button text uses button-specific styles
- [ ] No hardcoded font sizes or colors
- [ ] Consistent spacing and alignment

### Browser/Device Testing

Test typography on:
- iOS devices (iPhone SE, iPhone 14, iPad)
- Android devices (various screen sizes)
- Different system font size settings
- High contrast mode
- Screen readers (VoiceOver, TalkBack)

## Support & Updates

This typography system is designed to be maintainable and extensible. For updates or new components:

1. Follow the established patterns
2. Maintain accessibility standards
3. Test across platforms
4. Update documentation
5. Consider backward compatibility

For questions or feature requests, refer to the design system documentation or contact the development team.