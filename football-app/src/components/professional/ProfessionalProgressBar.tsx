import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ProfessionalProgressBarProps {
  value: number; // 0-100 percentage
  maxValue?: number;
  label?: string;
  showPercentage?: boolean;
  showValue?: boolean;
  color?: string;
  backgroundColor?: string;
  height?: number;
  animated?: boolean;
  animationDuration?: number;
  variant?: 'default' | 'gradient' | 'minimal' | 'thick';
  style?: ViewStyle;
  labelStyle?: ViewStyle;
  unit?: string; // e.g., '%', 'goals', 'assists'
  subtitle?: string;
}

export const ProfessionalProgressBar: React.FC<ProfessionalProgressBarProps> = ({
  value,
  maxValue = 100,
  label,
  showPercentage = true,
  showValue = false,
  color = colors.primary.main,
  backgroundColor = colors.surface.tertiary,
  height = 8,
  animated = true,
  animationDuration = 1000,
  variant = 'default',
  style,
  labelStyle,
  unit = '%',
  subtitle,
}) => {
  // Validate and normalize value
  const normalizedValue = Math.max(0, Math.min(value, maxValue));
  const percentage = (normalizedValue / maxValue) * 100;
  
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(progressAnimation, {
          toValue: percentage,
          duration: animationDuration,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      progressAnimation.setValue(percentage);
      fadeAnimation.setValue(1);
    }
  }, [percentage, animated, animationDuration]);

  const getBarHeight = () => {
    switch (variant) {
      case 'thick':
        return Math.max(height, 12);
      case 'minimal':
        return Math.max(height, 4);
      default:
        return height;
    }
  };

  const getProgressColor = () => {
    // Color coding based on performance
    if (percentage >= 80) return colors.semantic.success;
    if (percentage >= 60) return colors.primary.main;
    if (percentage >= 40) return colors.semantic.warning;
    return colors.semantic.error;
  };

  const progressColor = color === colors.primary.main ? getProgressColor() : color;
  const barHeight = getBarHeight();

  const renderProgressBar = () => {
    const progressWidth = animated 
      ? progressAnimation.interpolate({
          inputRange: [0, 100],
          outputRange: ['0%', '100%'],
          extrapolate: 'clamp',
        })
      : `${percentage}%`;

    if (variant === 'gradient') {
      return (
        <View style={[styles.progressContainer, { height: barHeight, backgroundColor }, style]}>
          <Animated.View style={[styles.progressWrapper, { width: progressWidth }]}>
            <LinearGradient
              colors={[progressColor, progressColor + 'CC', progressColor + '88']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientProgress}
            />
          </Animated.View>
          {variant === 'thick' && (
            <View style={[styles.progressGlow, { backgroundColor: progressColor + '20' }]} />
          )}
        </View>
      );
    }

    return (
      <View style={[styles.progressContainer, { height: barHeight, backgroundColor }, style]}>
        <Animated.View 
          style={[
            styles.progressBar, 
            { 
              width: progressWidth, 
              backgroundColor: progressColor,
              height: barHeight,
            }
          ]} 
        />
        {variant === 'thick' && (
          <View style={[styles.progressGlow, { backgroundColor: progressColor + '20' }]} />
        )}
      </View>
    );
  };

  const renderLabel = () => {
    if (!label && !showPercentage && !showValue) return null;

    return (
      <Animated.View style={[styles.labelContainer, { opacity: fadeAnimation }, labelStyle]}>
        <View style={styles.labelRow}>
          {label && (
            <Text style={styles.label}>{label}</Text>
          )}
          <View style={styles.valueContainer}>
            {showValue && (
              <Text style={styles.value}>
                {normalizedValue}{unit !== '%' ? ` ${unit}` : ''}
              </Text>
            )}
            {showPercentage && (
              <Text style={[styles.percentage, { color: progressColor }]}>
                {percentage.toFixed(0)}%
              </Text>
            )}
          </View>
        </View>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {renderLabel()}
      {renderProgressBar()}
    </View>
  );
};

// Multiple progress bars component for comparing stats
interface MultiProgressData {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
  unit?: string;
}

interface ProfessionalMultiProgressProps {
  data: MultiProgressData[];
  title?: string;
  variant?: 'default' | 'gradient' | 'minimal' | 'thick';
  style?: ViewStyle;
  showValues?: boolean;
  showPercentages?: boolean;
  animated?: boolean;
}

export const ProfessionalMultiProgress: React.FC<ProfessionalMultiProgressProps> = ({
  data,
  title,
  variant = 'default',
  style,
  showValues = true,
  showPercentages = true,
  animated = true,
}) => {
  if (!data || data.length === 0) return null;

  return (
    <View style={[styles.multiProgressContainer, style]}>
      {title && (
        <Text style={styles.multiProgressTitle}>{title}</Text>
      )}
      
      <View style={styles.progressList}>
        {data.map((item, index) => (
          <View key={index} style={styles.progressItem}>
            <ProfessionalProgressBar
              value={item.value}
              maxValue={item.maxValue || 100}
              label={item.label}
              color={item.color}
              unit={item.unit}
              showValue={showValues}
              showPercentage={showPercentages}
              variant={variant}
              animated={animated}
              animationDuration={1000 + (index * 200)} // Stagger animations
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  labelContainer: {
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  percentage: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    minWidth: 35,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
  progressContainer: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.sm,
  },
  progressWrapper: {
    height: '100%',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: borderRadius.sm,
  },
  gradientProgress: {
    flex: 1,
    borderRadius: borderRadius.sm,
  },
  progressGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: borderRadius.md,
    zIndex: -1,
  },
  
  // Multi-progress styles
  multiProgressContainer: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  multiProgressTitle: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  progressList: {
    gap: spacing.md,
  },
  progressItem: {
    // Individual progress bar item spacing handled by component
  },
});