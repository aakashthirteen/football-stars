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
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Svg, { 
  Path, 
  Circle, 
  Defs, 
  LinearGradient as SvgLinearGradient, 
  Stop,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;
const { width: screenWidth } = Dimensions.get('window');

interface LineChartData {
  x: number | string;
  y: number;
  label?: string;
  date?: Date;
}

interface ProfessionalLineChartProps {
  data: LineChartData[];
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  showPoints?: boolean;
  showGrid?: boolean;
  showArea?: boolean;
  animated?: boolean;
  animationDuration?: number;
  style?: ViewStyle;
  unit?: string;
  formatYLabel?: (value: number) => string;
  formatXLabel?: (value: number | string) => string;
  minY?: number;
  maxY?: number;
  strokeWidth?: number;
  pointRadius?: number;
  interactive?: boolean;
}

export const ProfessionalLineChart: React.FC<ProfessionalLineChartProps> = ({
  data,
  title,
  subtitle,
  width = screenWidth - (spacing.screenPadding * 2),
  height = 200,
  color = colors.primary.main,
  backgroundColor = colors.surface.primary,
  showPoints = true,
  showGrid = true,
  showArea = false,
  animated = true,
  animationDuration = 1500,
  style,
  unit = '',
  formatYLabel,
  formatXLabel,
  minY,
  maxY,
  strokeWidth = 3,
  pointRadius = 4,
  interactive = false,
}) => {
  if (!data || data.length === 0) return null;

  const animatedValue = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  
  // Calculate dimensions
  const padding = 40;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  // Calculate min/max values
  const yValues = data.map(d => d.y);
  const calculatedMinY = minY !== undefined ? minY : Math.min(...yValues);
  const calculatedMaxY = maxY !== undefined ? maxY : Math.max(...yValues);
  const yRange = calculatedMaxY - calculatedMinY;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      animatedValue.setValue(1);
      fadeAnimation.setValue(1);
    }
  }, [animated, animationDuration]);

  // Generate path for line
  const generatePath = () => {
    if (data.length < 2) return '';

    let path = '';
    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - ((point.y - calculatedMinY) / yRange) * chartHeight;
      
      if (index === 0) {
        path += `M ${x},${y}`;
      } else {
        // Smooth curve using quadratic Bezier curves
        const prevPoint = data[index - 1];
        const prevX = ((index - 1) / (data.length - 1)) * chartWidth;
        const prevY = chartHeight - ((prevPoint.y - calculatedMinY) / yRange) * chartHeight;
        
        const cpX = (prevX + x) / 2;
        path += ` Q ${cpX},${prevY} ${x},${y}`;
      }
    });
    
    return path;
  };

  // Generate area path for filled area under line
  const generateAreaPath = () => {
    if (data.length < 2) return '';

    let path = generatePath();
    
    // Close the path at the bottom
    const lastX = ((data.length - 1) / (data.length - 1)) * chartWidth;
    path += ` L ${lastX},${chartHeight} L 0,${chartHeight} Z`;
    
    return path;
  };

  // Generate grid lines
  const generateGridLines = () => {
    const lines = [];
    const gridCount = 5;
    
    // Horizontal grid lines
    for (let i = 0; i <= gridCount; i++) {
      const y = (i / gridCount) * chartHeight;
      lines.push(
        <Line
          key={`h-${i}`}
          x1={0}
          y1={y}
          x2={chartWidth}
          y2={y}
          stroke={colors.border.light}
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }
    
    // Vertical grid lines
    const verticalGridCount = Math.min(data.length - 1, 6);
    for (let i = 0; i <= verticalGridCount; i++) {
      const x = (i / verticalGridCount) * chartWidth;
      lines.push(
        <Line
          key={`v-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={chartHeight}
          stroke={colors.border.light}
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }
    
    return lines;
  };

  // Generate Y-axis labels
  const generateYLabels = () => {
    const labels = [];
    const labelCount = 5;
    
    for (let i = 0; i <= labelCount; i++) {
      const value = calculatedMinY + (yRange * (labelCount - i) / labelCount);
      const y = (i / labelCount) * chartHeight;
      const displayValue = formatYLabel ? formatYLabel(value) : `${value.toFixed(0)}${unit}`;
      
      labels.push(
        <Text
          key={i}
          style={[styles.yAxisLabel, { top: y - 8, left: -35 }]}
        >
          {displayValue}
        </Text>
      );
    }
    
    return labels;
  };

  // Generate X-axis labels
  const generateXLabels = () => {
    const labels = [];
    const labelCount = Math.min(data.length, 6);
    const step = Math.floor(data.length / labelCount) || 1;
    
    for (let i = 0; i < data.length; i += step) {
      const point = data[i];
      const x = (i / (data.length - 1)) * chartWidth;
      const displayValue = formatXLabel ? formatXLabel(point.x) : point.x.toString();
      
      labels.push(
        <Text
          key={i}
          style={[styles.xAxisLabel, { left: x - 20, top: chartHeight + 10 }]}
          numberOfLines={1}
        >
          {displayValue}
        </Text>
      );
    }
    
    return labels;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnimation }, style]}>
      {/* Header */}
      <View style={styles.header}>
        {title && (
          <Text style={styles.title}>{title}</Text>
        )}
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      {/* Chart Container */}
      <View style={[styles.chartContainer, { width, height }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxisContainer}>
          {generateYLabels()}
        </View>

        {/* Chart SVG */}
        <View style={[styles.svgContainer, { marginLeft: padding, marginTop: padding / 2 }]}>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <SvgLinearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={color} stopOpacity="1" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.1" />
              </SvgLinearGradient>
            </Defs>

            {/* Grid */}
            {showGrid && generateGridLines()}

            {/* Area fill */}
            {showArea && (
              <Path
                d={generateAreaPath()}
                fill="url(#lineGradient)"
                fillOpacity={0.3}
              />
            )}

            {/* Line path */}
            <Path
              d={generatePath()}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {showPoints && data.map((point, index) => {
              const x = (index / (data.length - 1)) * chartWidth;
              const y = chartHeight - ((point.y - calculatedMinY) / yRange) * chartHeight;
              
              return (
                <Circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={pointRadius}
                  fill={backgroundColor}
                  stroke={color}
                  strokeWidth={2}
                />
              );
            })}
          </Svg>

          {/* X-axis labels */}
          <View style={styles.xAxisContainer}>
            {generateXLabels()}
          </View>
        </View>
      </View>

      {/* Legend/Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={[styles.statValue, { color }]}>
            {data[data.length - 1]?.y.toFixed(1)}{unit}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Peak</Text>
          <Text style={[styles.statValue, { color: colors.semantic.success.main }]}>
            {calculatedMaxY.toFixed(1)}{unit}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={[styles.statValue, { color: colors.text.secondary }]}>
            {(yValues.reduce((a, b) => a + b, 0) / yValues.length).toFixed(1)}{unit}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Multi-line chart for comparing multiple datasets
interface MultiLineData {
  name: string;
  data: LineChartData[];
  color: string;
  icon?: string;
}

interface ProfessionalMultiLineChartProps {
  datasets: MultiLineData[];
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  showLegend?: boolean;
  style?: ViewStyle;
  unit?: string;
  formatYLabel?: (value: number) => string;
  formatXLabel?: (value: number | string) => string;
}

export const ProfessionalMultiLineChart: React.FC<ProfessionalMultiLineChartProps> = ({
  datasets,
  title,
  subtitle,
  width = screenWidth - (spacing.screenPadding * 2),
  height = 250,
  showLegend = true,
  style,
  unit = '',
  formatYLabel,
  formatXLabel,
}) => {
  if (!datasets || datasets.length === 0) return null;

  // Combine all data to find min/max
  const allData = datasets.flatMap(d => d.data);
  const yValues = allData.map(d => d.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  return (
    <View style={[styles.multiContainer, style]}>
      {/* Header */}
      <View style={styles.header}>
        {title && (
          <Text style={styles.title}>{title}</Text>
        )}
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      {/* Legend */}
      {showLegend && (
        <View style={styles.legend}>
          {datasets.map((dataset, index) => (
            <View key={index} style={styles.legendItem}>
              {dataset.icon ? (
                <View style={[styles.legendIcon, { backgroundColor: dataset.color + '15' }]}>
                  <Ionicons name={dataset.icon as any} size={12} color={dataset.color} />
                </View>
              ) : (
                <View style={[styles.legendDot, { backgroundColor: dataset.color }]} />
              )}
              <Text style={styles.legendLabel}>{dataset.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Render each line chart overlaid */}
      <View style={styles.multiChartContainer}>
        {datasets.map((dataset, index) => (
          <View key={index} style={StyleSheet.absoluteFillObject}>
            <ProfessionalLineChart
              data={dataset.data}
              width={width}
              height={height - 80} // Account for legend
              color={dataset.color}
              minY={minY}
              maxY={maxY}
              unit={unit}
              formatYLabel={formatYLabel}
              formatXLabel={formatXLabel}
              showGrid={index === 0} // Only show grid for first chart
              style={{ backgroundColor: 'transparent' }}
            />
          </View>
        ))}
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
  multiContainer: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  header: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xxs,
  },
  chartContainer: {
    position: 'relative',
  },
  yAxisContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 1,
  },
  yAxisLabel: {
    position: 'absolute',
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    textAlign: 'right',
    width: 35,
  },
  svgContainer: {
    position: 'relative',
  },
  xAxisContainer: {
    position: 'relative',
    height: 30,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  statValue: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
  },
  
  // Multi-chart styles
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  legendIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  legendLabel: {
    fontSize: typography.fontSize.small,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  multiChartContainer: {
    position: 'relative',
  },
});