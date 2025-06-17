import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ProfessionalAchievementBadgeProps {
  title: string;
  description: string;
  icon: string;
  progress?: number; // 0-1
  current?: number;
  target?: number;
  completed?: boolean;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: ViewStyle;
}

export const ProfessionalAchievementBadge: React.FC<ProfessionalAchievementBadgeProps> = ({
  title,
  description,
  icon,
  progress,
  current,
  target,
  completed = false,
  rarity = 'common',
  size = 'medium',
  onPress,
  style,
}) => {
  const getRarityColors = () => {
    switch (rarity) {
      case 'common':
        return {
          primary: colors.text.secondary,
          secondary: colors.surface.secondary,
          gradient: [colors.text.secondary + '20', colors.text.secondary + '10'],
        };
      case 'rare':
        return {
          primary: colors.accent.blue,
          secondary: colors.accent.blue + '20',
          gradient: [colors.accent.blue + '30', colors.accent.blue + '10'],
        };
      case 'epic':
        return {
          primary: colors.accent.purple,
          secondary: colors.accent.purple + '20',
          gradient: [colors.accent.purple + '30', colors.accent.purple + '10'],
        };
      case 'legendary':
        return {
          primary: '#FFD700',
          secondary: '#FFD700' + '20',
          gradient: ['#FFD700' + '30', '#FFD700' + '10'],
        };
      default:
        return {
          primary: colors.primary.main,
          secondary: colors.primary.main + '20',
          gradient: [colors.primary.main + '30', colors.primary.main + '10'],
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          icon: styles.smallIcon,
          iconSize: 20,
          title: styles.smallTitle,
          description: styles.smallDescription,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          icon: styles.largeIcon,
          iconSize: 32,
          title: styles.largeTitle,
          description: styles.largeDescription,
        };
      default:
        return {
          container: styles.mediumContainer,
          icon: styles.mediumIcon,
          iconSize: 24,
          title: styles.mediumTitle,
          description: styles.mediumDescription,
        };
    }
  };

  const rarityColors = getRarityColors();
  const sizeStyles = getSizeStyles();
  const isInteractive = !!onPress;
  const showProgress = progress !== undefined && !completed;

  const Container = isInteractive ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={isInteractive ? 0.8 : 1}
      style={[styles.container, sizeStyles.container, style]}
    >
      <LinearGradient
        colors={completed ? ['#FFD700' + '20', '#FFD700' + '10'] : rarityColors.gradient}
        style={styles.gradientContainer}
      >
        {/* Achievement Icon */}
        <View style={[
          styles.iconContainer,
          sizeStyles.icon,
          { backgroundColor: completed ? '#FFD700' + '30' : rarityColors.secondary }
        ]}>
          <Ionicons 
            name={icon as any} 
            size={sizeStyles.iconSize} 
            color={completed ? '#FFD700' : rarityColors.primary} 
          />
          
          {completed && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          )}
          
          {rarity === 'legendary' && (
            <View style={styles.legendaryGlow}>
              <View style={styles.glowRing} />
            </View>
          )}
        </View>

        {/* Achievement Info */}
        <View style={styles.infoContainer}>
          <View style={styles.header}>
            <Text style={[
              styles.title,
              sizeStyles.title,
              completed && styles.completedTitle
            ]}>
              {title}
            </Text>
            
            {rarity !== 'common' && (
              <View style={[styles.rarityBadge, { backgroundColor: rarityColors.primary }]}>
                <Text style={styles.rarityText}>{rarity.toUpperCase()}</Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.description, sizeStyles.description]}>
            {description}
          </Text>

          {/* Progress Bar */}
          {showProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { 
                    width: `${(progress || 0) * 100}%`,
                    backgroundColor: rarityColors.primary 
                  }
                ]} />
              </View>
              
              {current !== undefined && target !== undefined && (
                <Text style={styles.progressText}>
                  {current}/{target}
                </Text>
              )}
            </View>
          )}

          {completed && (
            <View style={styles.completedContainer}>
              <Ionicons name="trophy" size={14} color="#FFD700" />
              <Text style={styles.completedText}>Unlocked!</Text>
            </View>
          )}
        </View>

        {/* Interactive Indicator */}
        {isInteractive && (
          <View style={styles.interactiveIndicator}>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </View>
        )}

        {/* Completed Overlay */}
        {completed && (
          <View style={styles.completedOverlay}>
            <LinearGradient
              colors={['transparent', '#FFD700' + '05']}
              style={styles.completedGradient}
            />
          </View>
        )}
      </LinearGradient>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  smallContainer: {
    minHeight: 80,
  },
  mediumContainer: {
    minHeight: 100,
  },
  largeContainer: {
    minHeight: 120,
  },
  gradientContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    borderRadius: borderRadius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  smallIcon: {
    width: 40,
    height: 40,
  },
  mediumIcon: {
    width: 50,
    height: 50,
  },
  largeIcon: {
    width: 60,
    height: 60,
  },
  completedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  legendaryGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
  },
  glowRing: {
    flex: 1,
    borderRadius: borderRadius.circle,
    borderWidth: 2,
    borderColor: '#FFD700',
    opacity: 0.6,
  },
  infoContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  smallTitle: {
    fontSize: typography.fontSize.regular,
  },
  mediumTitle: {
    fontSize: typography.fontSize.large,
  },
  largeTitle: {
    fontSize: typography.fontSize.title3,
  },
  completedTitle: {
    color: '#FFD700',
  },
  rarityBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.badge,
    marginLeft: spacing.sm,
  },
  rarityText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  description: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  smallDescription: {
    fontSize: typography.fontSize.small,
  },
  mediumDescription: {
    fontSize: typography.fontSize.regular,
  },
  largeDescription: {
    fontSize: typography.fontSize.regular,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surface.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.semibold,
    minWidth: 40,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  completedText: {
    fontSize: typography.fontSize.small,
    color: '#FFD700',
    fontWeight: typography.fontWeight.semibold,
  },
  interactiveIndicator: {
    marginLeft: spacing.sm,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.lg,
  },
  completedGradient: {
    flex: 1,
  },
});