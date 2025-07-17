import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;
const { width: screenWidth } = Dimensions.get('window');

// Shimmer loading animation component
const ShimmerEffect: React.FC<{ 
  width: number | string; 
  height: number; 
  borderRadius?: number;
  style?: ViewStyle;
}> = ({ width, height, borderRadius = 8, style }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(animate);
    };
    animate();
  }, [shimmerAnimation]);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.surface.tertiary,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Progress bar loading component
export const ProfessionalProgressBarLoading: React.FC<{
  count?: number;
  style?: ViewStyle;
}> = ({ count = 3, style }) => (
  <View style={[styles.container, style]}>
    <View style={styles.header}>
      <ShimmerEffect width="60%" height={20} />
    </View>
    
    {Array.from({ length: count }).map((_, index) => (
      <View key={index} style={styles.progressBarItem}>
        <View style={styles.progressBarHeader}>
          <ShimmerEffect width="40%" height={16} />
          <ShimmerEffect width="20%" height={16} />
        </View>
        <ShimmerEffect width="100%" height={8} borderRadius={4} />
      </View>
    ))}
  </View>
);

// Circular progress loading component
export const ProfessionalCircularProgressLoading: React.FC<{
  count?: number;
  size?: number;
  style?: ViewStyle;
}> = ({ count = 3, size = 120, style }) => (
  <View style={[styles.container, style]}>
    <View style={styles.header}>
      <ShimmerEffect width="60%" height={20} />
    </View>
    
    <View style={styles.circularGrid}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.circularItem}>
          <ShimmerEffect width={size} height={size} borderRadius={size / 2} />
          <View style={styles.circularLabel}>
            <ShimmerEffect width="80%" height={14} />
          </View>
        </View>
      ))}
    </View>
  </View>
);

// Bar chart loading component
export const ProfessionalBarChartLoading: React.FC<{
  count?: number;
  variant?: 'horizontal' | 'vertical';
  style?: ViewStyle;
}> = ({ count = 5, variant = 'vertical', style }) => (
  <View style={[styles.container, style]}>
    <View style={styles.header}>
      <ShimmerEffect width="50%" height={20} />
    </View>
    
    {variant === 'horizontal' ? (
      <View style={styles.horizontalChart}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.horizontalBarItem}>
            <View style={styles.horizontalBarHeader}>
              <ShimmerEffect width="30%" height={14} />
              <ShimmerEffect width="15%" height={14} />
            </View>
            <ShimmerEffect width="100%" height={20} borderRadius={4} />
          </View>
        ))}
      </View>
    ) : (
      <View style={styles.verticalChart}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.verticalBarItem}>
            <ShimmerEffect width={40} height={Math.random() * 100 + 50} borderRadius={4} />
            <View style={styles.verticalBarLabel}>
              <ShimmerEffect width="100%" height={12} />
            </View>
          </View>
        ))}
      </View>
    )}
  </View>
);

// Line chart loading component
export const ProfessionalLineChartLoading: React.FC<{
  style?: ViewStyle;
}> = ({ style }) => (
  <View style={[styles.container, style]}>
    <View style={styles.header}>
      <ShimmerEffect width="50%" height={20} />
    </View>
    
    <View style={styles.lineChartContainer}>
      <ShimmerEffect width="100%" height={200} borderRadius={8} />
      
      <View style={styles.lineChartLegend}>
        <View style={styles.legendItem}>
          <ShimmerEffect width="25%" height={14} />
        </View>
        <View style={styles.legendItem}>
          <ShimmerEffect width="20%" height={14} />
        </View>
        <View style={styles.legendItem}>
          <ShimmerEffect width="30%" height={14} />
        </View>
      </View>
    </View>
  </View>
);

// League table loading component
export const ProfessionalLeagueTableLoading: React.FC<{
  rows?: number;
  style?: ViewStyle;
}> = ({ rows = 8, style }) => (
  <View style={[styles.container, style]}>
    <View style={styles.header}>
      <ShimmerEffect width="40%" height={20} />
    </View>
    
    {/* Table Header */}
    <View style={styles.tableHeader}>
      <ShimmerEffect width="10%" height={16} />
      <ShimmerEffect width="30%" height={16} />
      <ShimmerEffect width="15%" height={16} />
      <ShimmerEffect width="15%" height={16} />
      <ShimmerEffect width="15%" height={16} />
      <ShimmerEffect width="15%" height={16} />
    </View>
    
    {/* Table Rows */}
    {Array.from({ length: rows }).map((_, index) => (
      <View key={index} style={styles.tableRow}>
        <ShimmerEffect width={20} height={20} borderRadius={10} />
        <View style={styles.teamInfo}>
          <ShimmerEffect width={24} height={24} borderRadius={12} />
          <ShimmerEffect width="60%" height={16} />
        </View>
        <ShimmerEffect width="10%" height={16} />
        <ShimmerEffect width="10%" height={16} />
        <ShimmerEffect width="10%" height={16} />
        <ShimmerEffect width="10%" height={16} />
      </View>
    ))}
  </View>
);

// Player comparison loading component
export const ProfessionalPlayerComparisonLoading: React.FC<{
  style?: ViewStyle;
}> = ({ style }) => (
  <View style={[styles.container, style]}>
    <View style={styles.header}>
      <ShimmerEffect width="60%" height={20} />
    </View>
    
    {/* Player Headers */}
    <View style={styles.playersHeader}>
      <View style={styles.playerHeaderItem}>
        <ShimmerEffect width={60} height={60} borderRadius={30} />
        <View style={styles.playerHeaderInfo}>
          <ShimmerEffect width="80%" height={16} />
          <ShimmerEffect width="60%" height={14} />
        </View>
      </View>
      
      <View style={styles.vsContainer}>
        <ShimmerEffect width={40} height={20} borderRadius={10} />
      </View>
      
      <View style={styles.playerHeaderItem}>
        <ShimmerEffect width={60} height={60} borderRadius={30} />
        <View style={styles.playerHeaderInfo}>
          <ShimmerEffect width="80%" height={16} />
          <ShimmerEffect width="60%" height={14} />
        </View>
      </View>
    </View>
    
    {/* Comparison Stats */}
    {Array.from({ length: 6 }).map((_, index) => (
      <View key={index} style={styles.comparisonRow}>
        <ShimmerEffect width="15%" height={16} />
        <View style={styles.comparisonCenter}>
          <ShimmerEffect width="100%" height={8} borderRadius={4} />
          <ShimmerEffect width="60%" height={14} />
        </View>
        <ShimmerEffect width="15%" height={16} />
      </View>
    ))}
  </View>
);

// Match stats loading component
export const ProfessionalMatchStatsLoading: React.FC<{
  style?: ViewStyle;
}> = ({ style }) => (
  <View style={[styles.container, style]}>
    {/* Match Header */}
    <View style={styles.matchHeader}>
      <View style={styles.matchTeam}>
        <ShimmerEffect width={48} height={48} borderRadius={24} />
        <ShimmerEffect width="70%" height={16} />
      </View>
      
      <View style={styles.matchScore}>
        <View style={styles.scoreDisplay}>
          <ShimmerEffect width={40} height={32} />
          <ShimmerEffect width={20} height={24} />
          <ShimmerEffect width={40} height={32} />
        </View>
        <ShimmerEffect width={60} height={16} borderRadius={8} />
      </View>
      
      <View style={styles.matchTeam}>
        <ShimmerEffect width={48} height={48} borderRadius={24} />
        <ShimmerEffect width="70%" height={16} />
      </View>
    </View>
    
    {/* Tab Navigation */}
    <View style={styles.tabNavigation}>
      {Array.from({ length: 4 }).map((_, index) => (
        <ShimmerEffect key={index} width="20%" height={16} />
      ))}
    </View>
    
    {/* Stats Content */}
    <View style={styles.statsContent}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.statRow}>
          <ShimmerEffect width="15%" height={16} />
          <View style={styles.statCenter}>
            <ShimmerEffect width="60%" height={14} />
            <ShimmerEffect width="100%" height={8} borderRadius={4} />
          </View>
          <ShimmerEffect width="15%" height={16} />
        </View>
      ))}
    </View>
  </View>
);

// Team performance loading component
export const ProfessionalTeamPerformanceLoading: React.FC<{
  style?: ViewStyle;
}> = ({ style }) => (
  <View style={[styles.container, style]}>
    {/* Team Header */}
    <View style={styles.teamHeader}>
      <View style={styles.teamHeaderLeft}>
        <ShimmerEffect width={60} height={60} borderRadius={30} />
        <View style={styles.teamHeaderInfo}>
          <ShimmerEffect width="80%" height={20} />
          <ShimmerEffect width="60%" height={16} />
        </View>
      </View>
      
      <View style={styles.teamHeaderMetrics}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.metricItem}>
            <ShimmerEffect width={30} height={24} />
            <ShimmerEffect width={40} height={12} />
          </View>
        ))}
      </View>
    </View>
    
    {/* Tab Navigation */}
    <View style={styles.tabNavigation}>
      {Array.from({ length: 4 }).map((_, index) => (
        <ShimmerEffect key={index} width="20%" height={16} />
      ))}
    </View>
    
    {/* Content */}
    <View style={styles.teamContent}>
      {/* Circular Charts */}
      <View style={styles.circularChartsRow}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.circularChartItem}>
            <ShimmerEffect width={80} height={80} borderRadius={40} />
            <ShimmerEffect width="60%" height={12} />
          </View>
        ))}
      </View>
      
      {/* Progress Bars */}
      <View style={styles.progressSection}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <ShimmerEffect width="40%" height={14} />
              <ShimmerEffect width="15%" height={14} />
            </View>
            <ShimmerEffect width="100%" height={8} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  </View>
);

// Empty state components
export const ProfessionalEmptyState: React.FC<{
  icon?: string;
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
}> = ({ icon = 'document', title, subtitle, actionText, onAction, style }) => (
  <View style={[styles.emptyState, style]}>
    <View style={styles.emptyStateIcon}>
      <Ionicons name={icon as any} size={48} color={colors.text.tertiary} />
    </View>
    <Text style={styles.emptyStateTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>}
    {actionText && onAction && (
      <LinearGradient
        colors={[colors.primary.main, colors.primary.dark]}
        style={styles.emptyStateButton}
      >
        <Text style={styles.emptyStateButtonText} onPress={onAction}>
          {actionText}
        </Text>
      </LinearGradient>
    )}
  </View>
);

// Error state component
export const ProfessionalErrorState: React.FC<{
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}> = ({ 
  title = 'Something went wrong', 
  subtitle = 'Please try again or contact support if the problem persists.',
  onRetry,
  style 
}) => (
  <View style={[styles.errorState, style]}>
    <View style={styles.errorStateIcon}>
      <Ionicons name="alert-circle" size={48} color={colors.semantic.error.main} />
    </View>
    <Text style={styles.errorStateTitle}>{title}</Text>
    <Text style={styles.errorStateSubtitle}>{subtitle}</Text>
    {onRetry && (
      <LinearGradient
        colors={[colors.semantic.error.main, colors.semantic.error.main + 'CC']}
        style={styles.errorStateButton}
      >
        <Text style={styles.errorStateButtonText} onPress={onRetry}>
          Try Again
        </Text>
      </LinearGradient>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  
  // Progress bar loading styles
  progressBarItem: {
    marginBottom: spacing.md,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  
  // Circular progress loading styles
  circularGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  circularItem: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  circularLabel: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  
  // Chart loading styles
  horizontalChart: {
    gap: spacing.md,
  },
  horizontalBarItem: {
    marginBottom: spacing.sm,
  },
  horizontalBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  verticalChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
  },
  verticalBarItem: {
    alignItems: 'center',
    flex: 1,
  },
  verticalBarLabel: {
    marginTop: spacing.sm,
    width: '80%',
  },
  
  // Line chart loading styles
  lineChartContainer: {
    gap: spacing.md,
  },
  lineChartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  // Table loading styles
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.sm,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  
  // Player comparison loading styles
  playersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  playerHeaderItem: {
    flex: 1,
    alignItems: 'center',
  },
  playerHeaderInfo: {
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  comparisonCenter: {
    flex: 1,
    marginHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  
  // Match stats loading styles
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.md,
  },
  matchTeam: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  matchScore: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tabNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.md,
  },
  statsContent: {
    gap: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statCenter: {
    flex: 1,
    marginHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  
  // Team performance loading styles
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.md,
  },
  teamHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamHeaderInfo: {
    marginLeft: spacing.md,
    gap: spacing.xs,
  },
  teamHeaderMetrics: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metricItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamContent: {
    gap: spacing.lg,
  },
  circularChartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  circularChartItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressSection: {
    gap: spacing.md,
  },
  progressItem: {
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  emptyStateIcon: {
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  emptyStateButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
  },
  emptyStateButtonText: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  
  // Error state styles
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  errorStateIcon: {
    marginBottom: spacing.md,
  },
  errorStateTitle: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorStateSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  errorStateButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
  },
  errorStateButtonText: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
});