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

const { colors, typography, spacing, borderRadius, shadows, gradients } = DesignSystem;

interface Stat {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  subtitle?: string;
}

interface ProfessionalStatsCardProps {
  title: string;
  stats: Stat[];
  variant?: 'default' | 'gradient' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: ViewStyle;
  headerIcon?: string;
  headerColor?: string;
}

export const ProfessionalStatsCard: React.FC<ProfessionalStatsCardProps> = ({
  title,
  stats,
  variant = 'default',
  size = 'medium',
  onPress,
  style,
  headerIcon,
  headerColor = colors.primary.main,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          title: styles.smallTitle,
          stat: styles.smallStat,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          title: styles.largeTitle,
          stat: styles.largeStat,
        };
      default:
        return {
          container: styles.mediumContainer,
          title: styles.mediumTitle,
          stat: styles.mediumStat,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const isInteractive = !!onPress;

  const renderContent = () => (
    <View style={[styles.container, sizeStyles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        {headerIcon && (
          <View style={[styles.headerIconContainer, { backgroundColor: headerColor + '20' }]}>
            <Ionicons name={headerIcon as any} size={20} color={headerColor} />
          </View>
        )}
        <Text style={[styles.title, sizeStyles.title]}>{title}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statItem, sizeStyles.stat]}>
            {stat.icon && (
              <View style={[styles.statIconContainer, { backgroundColor: (stat.color || colors.primary.main) + '15' }]}>
                <Ionicons 
                  name={stat.icon as any} 
                  size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
                  color={stat.color || colors.primary.main} 
                />
              </View>
            )}
            
            <View style={styles.statContent}>
              <Text style={[
                styles.statValue,
                size === 'small' && styles.smallStatValue,
                size === 'large' && styles.largeStatValue,
              ]}>
                {stat.value}
              </Text>
              <Text style={[
                styles.statLabel,
                size === 'small' && styles.smallStatLabel,
                size === 'large' && styles.largeStatLabel,
              ]}>
                {stat.label}
              </Text>
              {stat.subtitle && (
                <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Interactive indicator */}
      {isInteractive && (
        <View style={styles.interactiveIndicator}>
          <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
        </View>
      )}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={isInteractive ? 0.8 : 1}
        disabled={!isInteractive}
      >
        <LinearGradient
          colors={[headerColor + '15', headerColor + '05']}
          style={[styles.gradientContainer, sizeStyles.container]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const Container = isInteractive ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={isInteractive ? 0.8 : 1}
      style={[
        styles.cardContainer,
        variant === 'minimal' && styles.minimalContainer,
        sizeStyles.container,
        style,
      ]}
    >
      {renderContent()}
    </Container>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  gradientContainer: {
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  minimalContainer: {
    backgroundColor: 'transparent',
    ...shadows.none,
  },
  container: {
    position: 'relative',
  },
  smallContainer: {
    padding: spacing.sm,
  },
  mediumContainer: {
    padding: spacing.md,
  },
  largeContainer: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  smallStat: {
    minWidth: '45%',
  },
  mediumStat: {
    minWidth: '48%',
  },
  largeStat: {
    minWidth: '100%',
    marginBottom: spacing.md,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  smallStatValue: {
    fontSize: typography.fontSize.large,
  },
  mediumStatValue: {
    fontSize: typography.fontSize.title3,
  },
  largeStatValue: {
    fontSize: typography.fontSize.title2,
  },
  statLabel: {
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smallStatLabel: {
    fontSize: typography.fontSize.caption,
  },
  mediumStatLabel: {
    fontSize: typography.fontSize.small,
  },
  largeStatLabel: {
    fontSize: typography.fontSize.regular,
  },
  statSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
  interactiveIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
});