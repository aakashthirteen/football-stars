/**
 * FootballStars Professional Design System
 * Based on UEFA Champions League & Premier League app references
 * 
 * Design Principles:
 * 1. Professional dark mode with sophisticated color palette
 * 2. Team visual identity (badges, colors, jerseys)
 * 3. Clean spacing with 8px grid system
 * 4. Professional sports broadcast typography
 * 5. Smooth animations and micro-interactions
 */

// Professional Color Palette - Refined and Balanced
export const ProfessionalColors = {
  // Dark Mode Backgrounds - Sophisticated dark blues
  background: {
    primary: '#0A0E13',    // Darker main background
    secondary: '#111720',  // Card background with blue tint
    tertiary: '#1A2332',   // Elevated elements
    accent: '#242B3D',     // Hover states
    overlay: 'rgba(0, 0, 0, 0.85)',
    glass: 'rgba(17, 23, 32, 0.7)',
  },
  
  // Primary Colors - Refined green
  primary: {
    main: '#00D757',     // Slightly muted professional green
    light: '#00FF66',    
    dark: '#00B348',
    muted: '#009940',
    glow: 'rgba(0, 215, 87, 0.25)',
  },
  
  // Accent Colors - Balanced palette
  accent: {
    blue: '#3B82F6',     // Professional blue
    purple: '#7C3AED',   // Rich purple
    gold: '#F59E0B',     // Trophy/achievement gold
    coral: '#EF4444',    // Alert red
    teal: '#10B981',     // Success teal
    orange: '#F97316',   // Vibrant orange
  },
  
  // Team Colors - Professional Contrast
  team: {
    home: {
      primary: '#4A9FFF',
      secondary: '#3B82F6',
      text: '#FFFFFF',
    },
    away: {
      primary: '#FF6B6B',
      secondary: '#FF5252',
      text: '#FFFFFF',
    },
  },
  
  // Text Colors - High Contrast
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.8)',
    tertiary: 'rgba(255, 255, 255, 0.6)',
    muted: 'rgba(255, 255, 255, 0.4)',
    inverse: '#0A0E13',
  },
  
  // Semantic Colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // Status Indicators - More variety
  status: {
    live: '#FF6B6B',      // Coral for live
    scheduled: '#4A9FFF',  // Blue for scheduled
    completed: '#14B8A6',  // Teal for completed
    cancelled: '#6B7280',
    success: '#10B981',
    error: '#EF4444',
    info: '#3B82F6',
    warning: '#F59E0B',
  },
  
  // Surface Colors - for cards and containers
  surface: {
    primary: '#111720',
    secondary: '#1A2332',
    tertiary: '#242B3D',
    border: 'rgba(255, 255, 255, 0.1)',
    subtle: 'rgba(255, 255, 255, 0.05)',
  },
};

// Typography System - Sports Broadcast Style
export const Typography = {
  // Font Families
  fontFamily: {
    display: 'System',  // Will use SF Pro Display on iOS
    body: 'System',
    mono: 'Courier New',
  },
  
  // Font Sizes - UEFA/Premier League scale
  fontSize: {
    // Display
    hero: 32,
    title1: 28,
    title2: 24,
    title3: 20,
    
    // Body
    large: 18,
    regular: 16,
    small: 14,
    caption: 12,
    micro: 10,
  },
  
  // Font Weights
  fontWeight: {
    black: '900',
    bold: '700',
    semibold: '600',
    medium: '500',
    regular: '400',
    light: '300',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing System - 8px Grid
export const Spacing = {
  // Base unit: 8px
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  
  // Component specific
  cardPadding: 16,
  screenPadding: 20,
  sectionGap: 32,
  tabGap: 24, // Increased for better visual hierarchy
};

// Border Radius - Modern Sports App
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
  
  // Component specific
  card: 16,
  button: 12,
  input: 8,
  badge: 20,
};

// Shadows - Subtle depth
export const Shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#00D757', // Refined green
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 0,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
};

// Professional Gradients
export const ProfessionalGradients = {
  // Main gradients
  primary: [ProfessionalColors.primary.main, ProfessionalColors.primary.dark],
  dark: [ProfessionalColors.background.secondary, ProfessionalColors.background.primary],
  
  // Team gradients
  homeTeam: ['#4A9FFF', '#3B82F6'],
  awayTeam: ['#FF6B6B', '#FF5252'],
  
  // Status gradients
  live: ['#FF6B6B', '#FF8C42'],
  scheduled: ['#4A9FFF', '#3B82F6'],
  completed: ['#14B8A6', '#0D9488'],
  
  // Special effects
  glass: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)'],
  goldShine: ['#FFB800', '#FFC933', '#FFD700'],
  
  // Overlays
  headerOverlay: ['rgba(10, 14, 19, 0)', 'rgba(10, 14, 19, 0.9)'],
  cardOverlay: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)'],
  
  // Quick action gradients
  quickMatch: ['#00D757', '#00B348'],
  quickTeam: ['#8B5CF6', '#7C3AED'],
  quickTournament: ['#FFB800', '#F59E0B'],
  quickDiscover: ['#14B8A6', '#0D9488'],
};

// Animation Timings
export const Animations = {
  // Durations
  duration: {
    instant: 150,
    fast: 250,
    normal: 350,
    slow: 500,
  },
  
  // Easing
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
};

// Component Styles - Reusable patterns
export const ComponentStyles = {
  // UEFA-style header
  matchHeader: {
    height: 180,
    backgroundColor: ProfessionalColors.background.secondary,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 50,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  
  // Professional card
  card: {
    backgroundColor: ProfessionalColors.background.secondary,
    borderRadius: BorderRadius.card,
    padding: Spacing.cardPadding,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  
  // Stats card
  statsCard: {
    backgroundColor: ProfessionalColors.background.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Team badge
  teamBadge: {
    size: {
      small: 24,
      medium: 40,
      large: 60,
      xlarge: 80,
    },
  },
  
  // Live indicator
  liveIndicator: {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: ProfessionalColors.status.live,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xxs,
      borderRadius: BorderRadius.badge,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFFFFF',
      marginRight: Spacing.xxs,
    },
    text: {
      color: '#FFFFFF',
      fontSize: Typography.fontSize.caption,
      fontWeight: Typography.fontWeight.bold,
    },
  },
  
  // Professional button
  button: {
    primary: {
      backgroundColor: ProfessionalColors.primary.main,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.button,
      ...Shadows.md,
    },
    secondary: {
      backgroundColor: ProfessionalColors.background.tertiary,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.button,
    },
  },
};

// Layout Patterns
export const Layouts = {
  // Screen container
  screen: {
    flex: 1,
    backgroundColor: ProfessionalColors.background.primary,
  },
  
  // Centered content
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Row with space between
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  
  // Tab layout
  tabBar: {
    flexDirection: 'row',
    backgroundColor: ProfessionalColors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
};

// Match Card Styles - UEFA/Premier League inspired
export const MatchCardStyles = {
  // Live match card
  live: {
    container: {
      backgroundColor: ProfessionalColors.background.secondary,
      borderWidth: 1,
      borderColor: ProfessionalColors.status.live,
      borderRadius: BorderRadius.card,
    },
    header: {
      backgroundColor: ProfessionalColors.status.live,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      borderTopLeftRadius: BorderRadius.card,
      borderTopRightRadius: BorderRadius.card,
    },
  },
  
  // Team section
  teamSection: {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    badge: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: ProfessionalColors.background.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    name: {
      fontSize: Typography.fontSize.regular,
      fontWeight: Typography.fontWeight.semibold,
      color: ProfessionalColors.text.primary,
    },
    score: {
      fontSize: Typography.fontSize.title2,
      fontWeight: Typography.fontWeight.bold,
      color: ProfessionalColors.text.primary,
      marginLeft: 'auto',
    },
  },
};

// Export all as a single design system object
export const DesignSystem = {
  colors: ProfessionalColors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  gradients: ProfessionalGradients,
  animations: Animations,
  components: ComponentStyles,
  layouts: Layouts,
  matchCard: MatchCardStyles,
};

export default DesignSystem;