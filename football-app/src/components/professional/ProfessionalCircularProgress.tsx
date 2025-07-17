import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, LinearGradient as SvgLinearGradient, Defs, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, shadows } = DesignSystem;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProfessionalCircularProgressProps {
  value: number; // 0-100 percentage
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  showValue?: boolean;
  label?: string;
  icon?: string;
  animated?: boolean;
  animationDuration?: number;
  variant?: 'default' | 'gradient' | 'rating' | 'minimal';
  style?: ViewStyle;
  unit?: string;
  maxValue?: number;
  centerContent?: React.ReactNode;
}

export const ProfessionalCircularProgress: React.FC<ProfessionalCircularProgressProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  color = colors.primary.main,
  backgroundColor = colors.surface.tertiary,
  showPercentage = true,
  showValue = false,
  label,
  icon,
  animated = true,
  animationDuration = 1500,
  variant = 'default',
  style,
  unit = '%',
  maxValue = 100,
  centerContent,
}) => {
  // Validate and normalize value
  const normalizedValue = Math.max(0, Math.min(value, maxValue));
  const percentage = (normalizedValue / maxValue) * 100;
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: percentage,
          duration: animationDuration,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      animatedValue.setValue(percentage);
      fadeAnimation.setValue(1);
      scaleAnimation.setValue(1);
    }
  }, [percentage, animated, animationDuration]);

  const getProgressColor = () => {
    if (variant === 'rating') {
      if (percentage >= 90) return colors.semantic.success.main;
      if (percentage >= 80) return colors.primary.main;
      if (percentage >= 70) return colors.semantic.info.main;
      if (percentage >= 60) return colors.semantic.warning.main;
      return colors.semantic.error.main;
    }
    
    // Performance-based coloring
    if (percentage >= 80) return colors.semantic.success.main;
    if (percentage >= 60) return colors.primary.main;
    if (percentage >= 40) return colors.semantic.warning.main;
    return colors.semantic.error.main;
  };

  const progressColor = color === colors.primary.main ? getProgressColor() : color;
  
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  const renderCenterContent = () => {
    if (centerContent) return centerContent;

    const centerSize = size * 0.6;
    
    return (
      <View style={[styles.centerContent, { width: centerSize, height: centerSize }]}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: progressColor + '15' }]}>
            <Ionicons 
              name={icon as any} 
              size={size * 0.15} 
              color={progressColor} 
            />
          </View>
        )}
        
        {(showPercentage || showValue) && (
          <Animated.View style={[styles.valueContainer, { opacity: fadeAnimation }]}>
            {showValue && (
              <Text style={[styles.value, { fontSize: size * 0.12 }]}>
                {normalizedValue}
              </Text>
            )}
            {showPercentage && (
              <Text style={[styles.percentage, { 
                fontSize: size * (showValue ? 0.08 : 0.15),
                color: progressColor 
              }]}>
                {percentage.toFixed(0)}{unit}
              </Text>
            )}
          </Animated.View>
        )}
        
        {label && (
          <Text style={[styles.centerLabel, { fontSize: size * 0.08 }]}>
            {label}
          </Text>
        )}
      </View>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size,
          transform: [{ scale: scaleAnimation }],
          opacity: fadeAnimation,
        }, 
        style
      ]}
    >
      <Svg width={size} height={size} style={styles.svg}>
        {variant === 'gradient' && (
          <Defs>
            <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={progressColor} stopOpacity="1" />
              <Stop offset="100%" stopColor={progressColor + 'CC'} stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
        )}
        
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />
        
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={variant === 'gradient' ? 'url(#progressGradient)' : progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      <View style={styles.overlay}>
        {renderCenterContent()}
      </View>
    </Animated.View>
  );
};

// Multi-circular progress component for team/player stats
interface CircularProgressData {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
  icon?: string;
  unit?: string;
}

interface ProfessionalMultiCircularProgressProps {
  data: CircularProgressData[];
  title?: string;
  size?: number;
  columns?: number;
  style?: ViewStyle;
  variant?: 'default' | 'gradient' | 'rating' | 'minimal';
  animated?: boolean;
}

export const ProfessionalMultiCircularProgress: React.FC<ProfessionalMultiCircularProgressProps> = ({
  data,
  title,
  size = 80,
  columns = 2,
  style,
  variant = 'default',
  animated = true,
}) => {
  if (!data || data.length === 0) return null;

  return (
    <View style={[styles.multiContainer, style]}>
      {title && (
        <Text style={styles.multiTitle}>{title}</Text>
      )}
      
      <View style={[styles.grid, { flexDirection: columns === 1 ? 'column' : 'row' }]}>
        {data.map((item, index) => (
          <View 
            key={index} 
            style={[
              styles.gridItem,
              {
                width: columns === 1 ? '100%' : `${100 / columns}%`,
                marginBottom: spacing.md,
              }
            ]}
          >
            <ProfessionalCircularProgress
              value={item.value}
              maxValue={item.maxValue || 100}
              size={size}
              color={item.color}
              icon={item.icon}
              unit={item.unit}
              variant={variant}
              animated={animated}
              animationDuration={1000 + (index * 300)} // Stagger animations
            />
            <Text style={styles.gridItemLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Player rating component using circular progress
interface ProfessionalPlayerRatingProps {
  rating: number; // 0-10 scale
  size?: number;
  showLabel?: boolean;
  animated?: boolean;
  style?: ViewStyle;
}

export const ProfessionalPlayerRating: React.FC<ProfessionalPlayerRatingProps> = ({
  rating,
  size = 100,
  showLabel = true,
  animated = true,
  style,
}) => {
  const normalizedRating = Math.max(0, Math.min(rating, 10));
  const percentage = (normalizedRating / 10) * 100;

  const getRatingColor = () => {
    if (normalizedRating >= 8.5) return colors.semantic.success.main;
    if (normalizedRating >= 7.5) return colors.primary.main;
    if (normalizedRating >= 6.5) return colors.semantic.info.main;
    if (normalizedRating >= 5.5) return colors.semantic.warning.main;
    return colors.semantic.error.main;
  };

  const getRatingText = () => {
    if (normalizedRating >= 9) return 'Exceptional';
    if (normalizedRating >= 8) return 'Excellent';
    if (normalizedRating >= 7) return 'Good';
    if (normalizedRating >= 6) return 'Average';
    return 'Poor';
  };

  return (
    <View style={[styles.ratingContainer, style]}>
      <ProfessionalCircularProgress
        value={percentage}
        size={size}
        color={getRatingColor()}
        variant="rating"
        animated={animated}
        strokeWidth={size * 0.08}
        centerContent={
          <View style={styles.ratingCenter}>
            <Text style={[styles.ratingValue, { fontSize: size * 0.18 }]}>
              {normalizedRating.toFixed(1)}
            </Text>
            <Text style={[styles.ratingScale, { fontSize: size * 0.08 }]}>
              /10
            </Text>
          </View>
        }
      />
      {showLabel && (
        <Text style={[styles.ratingLabel, { fontSize: size * 0.1 }]}>
          {getRatingText()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    borderRadius: 50,
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  percentage: {
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  centerLabel: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xxs,
  },
  
  // Multi-progress styles
  multiContainer: {
    backgroundColor: colors.surface.primary,
    borderRadius: 16,
    padding: spacing.md,
    ...shadows.sm,
  },
  multiTitle: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  grid: {
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  gridItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  gridItemLabel: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  
  // Rating styles
  ratingContainer: {
    alignItems: 'center',
  },
  ratingCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  ratingScale: {
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.medium,
  },
  ratingLabel: {
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});