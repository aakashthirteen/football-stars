import { StyleSheet, Platform } from 'react-native';
import { Colors, Gradients } from './colors';

export const GlobalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
  },
  
  // Modern Card Styles with Glassmorphism
  glassCard: {
    backgroundColor: Colors.glass.background,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.glow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
    overflow: 'hidden',
  },
  
  // Elevated Card (for important content)
  elevatedCard: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  
  // Stadium Effect Card (kept but modernized)
  stadiumCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary.glow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  
  // Modern Glow Effects
  glowGreen: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.glow.green,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  
  glowGold: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.glow.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  
  // Typography - Modern & Bold
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  
  titleWithGlow: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
    textShadowColor: Colors.glow.white,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.secondary,
    letterSpacing: 0.1,
  },
  
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  
  caption: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text.tertiary,
    letterSpacing: 0.2,
  },
  
  // Modern Button Styles
  primaryButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary.glow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  
  primaryButtonText: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Glass Button
  glassButton: {
    backgroundColor: Colors.glass.background,
    borderWidth: 1,
    borderColor: Colors.glass.borderLight,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  glassButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Secondary Button
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary.main,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  secondaryButtonText: {
    color: Colors.primary.main,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Live Match Badge
  liveBadge: {
    backgroundColor: Colors.live.background,
    borderWidth: 1,
    borderColor: Colors.live.main,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.live.main,
  },
  
  liveText: {
    color: Colors.live.main,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Tab Bar Styles (Modern with proper spacing)
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background.elevated,
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 4, // Proper spacing between tabs
  },
  
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tabItemActive: {
    backgroundColor: Colors.primary.main,
  },
  
  tabItemInactive: {
    backgroundColor: 'transparent',
  },
  
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  
  tabTextActive: {
    color: Colors.text.primary,
  },
  
  tabTextInactive: {
    color: Colors.text.tertiary,
  },
  
  // Input Styles
  input: {
    backgroundColor: Colors.background.elevated,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.text.primary,
  },
  
  inputFocused: {
    borderColor: Colors.primary.main,
    borderWidth: 2,
  },
  
  // List Item Styles
  listItem: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  listItemPressed: {
    backgroundColor: Colors.background.elevated,
    transform: [{ scale: 0.98 }],
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.glass.border,
    marginVertical: 16,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  
  emptyText: {
    fontSize: 16,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: 16,
  },
  
  // Gradient Overlay (for images)
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
    backgroundColor: 'transparent',
  },
});

// Spacing System
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border Radius System
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  round: 999,
};

// Animation Durations
export const AnimationDuration = {
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

// Z-Index Levels
export const ZIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  splash: 800,
  notification: 900,
};

// Typography Scale
export const Typography = {
  hero: {
    fontSize: 48,
    fontWeight: '900' as const,
    letterSpacing: -1,
  },
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};
