import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;
const { width: screenWidth } = Dimensions.get('window');

interface BarData {
  label: string;
  value: number;
  color?: string;
  icon?: string;
  subtitle?: string;
  maxValue?: number;
}

interface ProfessionalBarChartProps {
  data: BarData[];
  title?: string;
  maxValue?: number;
  height?: number;
  showValues?: boolean;
  showPercentages?: boolean;
  animated?: boolean;
  animationDuration?: number;
  variant?: 'horizontal' | 'vertical';
  style?: ViewStyle;
  barWidth?: number;
  spacing?: number;
  unit?: string;
  colorScheme?: 'default' | 'gradient' | 'performance' | 'team';
}

export const ProfessionalBarChart: React.FC<ProfessionalBarChartProps> = ({
  data,
  title,
  maxValue,
  height = 200,
  showValues = true,
  showPercentages = false,
  animated = true,
  animationDuration = 1000,
  variant = 'vertical',
  style,
  barWidth = 40,
  spacing: barSpacing = 8,
  unit = '',
  colorScheme = 'default',
}) => {
  if (!data || data.length === 0) return null;

  // Calculate max value from data if not provided
  const calculatedMaxValue = maxValue || Math.max(...data.map(item => item.value));
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnimation.setValue(1);
    }
  }, [animated]);

  const getBarColor = (value: number, index: number, customColor?: string) => {
    if (customColor) return customColor;

    switch (colorScheme) {
      case 'performance':
        const percentage = (value / calculatedMaxValue) * 100;
        if (percentage >= 80) return colors.semantic.success;
        if (percentage >= 60) return colors.primary.main;
        if (percentage >= 40) return colors.semantic.warning;
        return colors.semantic.error;
      
      case 'team':
        const teamColors = [
          colors.primary.main,
          colors.secondary.main,
          colors.semantic.info,
          colors.semantic.warning,
          colors.semantic.success,
        ];
        return teamColors[index % teamColors.length];
      
      case 'gradient':
        return colors.primary.main;
      
      default:
        return colors.primary.main;
    }
  };

  if (variant === 'horizontal') {
    return (
      <HorizontalBarChart
        data={data}
        title={title}
        maxValue={calculatedMaxValue}
        height={height}
        showValues={showValues}
        showPercentages={showPercentages}
        animated={animated}
        animationDuration={animationDuration}
        style={style}
        unit={unit}
        colorScheme={colorScheme}
        getBarColor={getBarColor}
        fadeAnimation={fadeAnimation}
      />
    );
  }

  return (
    <VerticalBarChart
      data={data}
      title={title}
      maxValue={calculatedMaxValue}
      height={height}
      showValues={showValues}
      showPercentages={showPercentages}
      animated={animated}
      animationDuration={animationDuration}
      style={style}
      barWidth={barWidth}
      spacing={barSpacing}
      unit={unit}
      colorScheme={colorScheme}
      getBarColor={getBarColor}
      fadeAnimation={fadeAnimation}
    />
  );
};

// Horizontal Bar Chart Component
const HorizontalBarChart: React.FC<any> = ({
  data,
  title,
  maxValue,
  height,
  showValues,
  showPercentages,
  animated,
  animationDuration,
  style,
  unit,
  colorScheme,
  getBarColor,
  fadeAnimation,
}) => {
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnimation }, style]}>
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}
      
      <ScrollView style={styles.horizontalScrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.horizontalChart}>
          {data.map((item: BarData, index: number) => (
            <HorizontalBar
              key={index}
              data={item}
              index={index}
              maxValue={maxValue}
              showValues={showValues}
              showPercentages={showPercentages}
              animated={animated}
              animationDuration={animationDuration + (index * 200)}
              unit={unit}
              color={getBarColor(item.value, index, item.color)}
              colorScheme={colorScheme}
            />
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

// Vertical Bar Chart Component
const VerticalBarChart: React.FC<any> = ({
  data,
  title,
  maxValue,
  height,
  showValues,
  showPercentages,
  animated,
  animationDuration,
  style,
  barWidth,
  spacing,
  unit,
  colorScheme,
  getBarColor,
  fadeAnimation,
}) => {
  const chartWidth = data.length * (barWidth + spacing) - spacing;
  const shouldScroll = chartWidth > screenWidth - (spacing * 4);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnimation }, style]}>
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}
      
      <ScrollView 
        horizontal 
        style={styles.verticalScrollContainer}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.verticalChartContainer}
      >
        <View style={[styles.verticalChart, { height, minWidth: chartWidth }]}>
          {data.map((item: BarData, index: number) => (
            <VerticalBar
              key={index}
              data={item}
              index={index}
              maxValue={maxValue}
              height={height - 60} // Reserve space for labels
              width={barWidth}
              showValues={showValues}
              showPercentages={showPercentages}
              animated={animated}
              animationDuration={animationDuration + (index * 200)}
              unit={unit}
              color={getBarColor(item.value, index, item.color)}
              colorScheme={colorScheme}
            />
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

// Individual Horizontal Bar Component
const HorizontalBar: React.FC<any> = ({
  data,
  index,
  maxValue,
  showValues,
  showPercentages,
  animated,
  animationDuration,
  unit,
  color,
  colorScheme,
}) => {
  const widthAnimation = useRef(new Animated.Value(0)).current;
  const percentage = (data.value / maxValue) * 100;

  useEffect(() => {
    if (animated) {
      Animated.timing(widthAnimation, {
        toValue: percentage,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    } else {
      widthAnimation.setValue(percentage);
    }
  }, [percentage, animated, animationDuration]);

  const animatedWidth = widthAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.horizontalBarContainer}>
      <View style={styles.horizontalBarHeader}>
        {data.icon && (
          <View style={[styles.barIcon, { backgroundColor: color + '15' }]}>
            <Ionicons name={data.icon as any} size={16} color={color} />
          </View>
        )}
        <View style={styles.horizontalBarLabels}>
          <Text style={styles.horizontalBarLabel}>{data.label}</Text>
          {data.subtitle && (
            <Text style={styles.horizontalBarSubtitle}>{data.subtitle}</Text>
          )}
        </View>
        {showValues && (
          <Text style={[styles.barValue, { color }]}>
            {data.value}{unit}
            {showPercentages && ` (${percentage.toFixed(0)}%)`}
          </Text>
        )}
      </View>
      
      <View style={styles.horizontalBarTrack}>
        <Animated.View style={[styles.horizontalBarFill, { width: animatedWidth }]}>
          {colorScheme === 'gradient' ? (
            <LinearGradient
              colors={[color, color + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.horizontalBarGradient}
            />
          ) : (
            <View style={[styles.horizontalBarSolid, { backgroundColor: color }]} />
          )}
        </Animated.View>
      </View>
    </View>
  );
};

// Individual Vertical Bar Component
const VerticalBar: React.FC<any> = ({
  data,
  index,
  maxValue,
  height,
  width,
  showValues,
  showPercentages,
  animated,
  animationDuration,
  unit,
  color,
  colorScheme,
}) => {
  const heightAnimation = useRef(new Animated.Value(0)).current;
  const percentage = (data.value / maxValue) * 100;
  const barHeight = (percentage / 100) * height;

  useEffect(() => {
    if (animated) {
      Animated.timing(heightAnimation, {
        toValue: barHeight,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    } else {
      heightAnimation.setValue(barHeight);
    }
  }, [barHeight, animated, animationDuration]);

  return (
    <View style={[styles.verticalBarContainer, { width }]}>
      <View style={styles.verticalBarWrapper}>
        {/* Value label above bar */}
        {showValues && (
          <Text style={[styles.verticalBarValue, { color }]}>
            {data.value}{unit}
          </Text>
        )}
        
        {/* Bar track */}
        <View style={[styles.verticalBarTrack, { height }]}>
          <Animated.View 
            style={[
              styles.verticalBarFill, 
              { 
                height: heightAnimation,
                position: 'absolute',
                bottom: 0,
                width: '100%',
              }
            ]}
          >
            {colorScheme === 'gradient' ? (
              <LinearGradient
                colors={[color + 'CC', color]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.verticalBarGradient}
              />
            ) : (
              <View style={[styles.verticalBarSolid, { backgroundColor: color }]} />
            )}
          </Animated.View>
        </View>
        
        {/* Icon and label below bar */}
        <View style={styles.verticalBarFooter}>
          {data.icon && (
            <View style={[styles.barIcon, { backgroundColor: color + '15' }]}>
              <Ionicons name={data.icon as any} size={14} color={color} />
            </View>
          )}
          <Text style={styles.verticalBarLabel} numberOfLines={2}>
            {data.label}
          </Text>
          {data.subtitle && (
            <Text style={styles.verticalBarSubtitle} numberOfLines={1}>
              {data.subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  title: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  
  // Horizontal chart styles
  horizontalScrollContainer: {
    maxHeight: 400,
  },
  horizontalChart: {
    gap: spacing.sm,
  },
  horizontalBarContainer: {
    marginBottom: spacing.sm,
  },
  horizontalBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  horizontalBarLabels: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  horizontalBarLabel: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  horizontalBarSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
  },
  horizontalBarTrack: {
    height: 20,
    backgroundColor: colors.surface.tertiary,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  horizontalBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  horizontalBarGradient: {
    flex: 1,
    borderRadius: borderRadius.sm,
  },
  horizontalBarSolid: {
    flex: 1,
    borderRadius: borderRadius.sm,
  },
  
  // Vertical chart styles
  verticalScrollContainer: {
    flexGrow: 0,
  },
  verticalChartContainer: {
    paddingHorizontal: spacing.sm,
  },
  verticalChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: spacing.xs,
  },
  verticalBarContainer: {
    alignItems: 'center',
  },
  verticalBarWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  verticalBarValue: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  verticalBarTrack: {
    width: '80%',
    backgroundColor: colors.surface.tertiary,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  verticalBarFill: {
    borderRadius: borderRadius.sm,
  },
  verticalBarGradient: {
    flex: 1,
    borderRadius: borderRadius.sm,
  },
  verticalBarSolid: {
    flex: 1,
    borderRadius: borderRadius.sm,
  },
  verticalBarFooter: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  verticalBarLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.xxs,
  },
  verticalBarSubtitle: {
    fontSize: typography.fontSize.micro,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  
  // Common styles
  barIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barValue: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'right',
    minWidth: 50,
  },
});