import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ViewStyle,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface TeamData {
  id: string;
  position: number;
  name: string;
  shortName?: string;
  badge?: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string[]; // Last 5 matches: 'W', 'L', 'D'
  trend?: 'up' | 'down' | 'same'; // Position trend
}

interface ProfessionalLeagueTableProps {
  teams: TeamData[];
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  onTeamPress?: (team: TeamData) => void;
  showForm?: boolean;
  showTrend?: boolean;
  showGoalDifference?: boolean;
  compactMode?: boolean;
  animated?: boolean;
  highlightPositions?: {
    champions?: number[];
    europeanCompetition?: number[];
    relegation?: number[];
  };
}

export const ProfessionalLeagueTable: React.FC<ProfessionalLeagueTableProps> = ({
  teams,
  title = 'League Table',
  subtitle,
  style,
  onTeamPress,
  showForm = true,
  showTrend = true,
  showGoalDifference = true,
  compactMode = false,
  animated = true,
  highlightPositions = {
    champions: [1],
    europeanCompetition: [2, 3, 4, 5],
    relegation: [18, 19, 20],
  },
}) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnimation.setValue(1);
      slideAnimation.setValue(0);
    }
  }, [animated]);

  const getPositionColor = (position: number) => {
    if (highlightPositions.champions?.includes(position)) {
      return colors.semantic.success.main;
    }
    if (highlightPositions.europeanCompetition?.includes(position)) {
      return colors.primary.main;
    }
    if (highlightPositions.relegation?.includes(position)) {
      return colors.semantic.error.main;
    }
    return colors.border.medium;
  };

  const getPositionIcon = (position: number) => {
    if (highlightPositions.champions?.includes(position)) {
      return 'trophy';
    }
    if (highlightPositions.europeanCompetition?.includes(position)) {
      return 'football';
    }
    if (highlightPositions.relegation?.includes(position)) {
      return 'arrow-down';
    }
    return null;
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up':
        return { name: 'trending-up', color: colors.semantic.success.main };
      case 'down':
        return { name: 'trending-down', color: colors.semantic.error.main };
      case 'same':
        return { name: 'remove', color: colors.text.tertiary };
      default:
        return null;
    }
  };

  const getFormColor = (result: string) => {
    switch (result) {
      case 'W':
        return colors.semantic.success.main;
      case 'L':
        return colors.semantic.error.main;
      case 'D':
        return colors.semantic.warning.main;
      default:
        return colors.text.tertiary;
    }
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={styles.positionColumn}>
        <Text style={styles.headerText}>#</Text>
      </View>
      <View style={styles.teamColumn}>
        <Text style={styles.headerText}>Team</Text>
      </View>
      {!compactMode && (
        <>
          <View style={styles.statsColumn}>
            <Text style={styles.headerText}>MP</Text>
          </View>
          <View style={styles.statsColumn}>
            <Text style={styles.headerText}>W</Text>
          </View>
          <View style={styles.statsColumn}>
            <Text style={styles.headerText}>D</Text>
          </View>
          <View style={styles.statsColumn}>
            <Text style={styles.headerText}>L</Text>
          </View>
          {showGoalDifference && (
            <View style={styles.statsColumn}>
              <Text style={styles.headerText}>GD</Text>
            </View>
          )}
        </>
      )}
      <View style={styles.pointsColumn}>
        <Text style={styles.headerText}>Pts</Text>
      </View>
      {showForm && (
        <View style={styles.formColumn}>
          <Text style={styles.headerText}>Form</Text>
        </View>
      )}
    </View>
  );

  const renderTeamRow = (team: TeamData, index: number) => {
    const positionColor = getPositionColor(team.position);
    const positionIcon = getPositionIcon(team.position);
    const trendIcon = showTrend ? getTrendIcon(team.trend) : null;

    return (
      <Animated.View
        key={team.id}
        style={[
          {
            opacity: fadeAnimation,
            transform: [{ translateY: slideAnimation }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.teamRow,
            index % 2 === 0 && styles.alternateRow,
          ]}
          onPress={() => onTeamPress?.(team)}
          activeOpacity={0.7}
        >
          {/* Position */}
          <View style={styles.positionColumn}>
            <View style={styles.positionContainer}>
              <View style={[styles.positionIndicator, { backgroundColor: positionColor }]} />
              <Text style={[styles.positionText, { color: positionColor }]}>
                {team.position}
              </Text>
              {positionIcon && (
                <Ionicons 
                  name={positionIcon as any} 
                  size={12} 
                  color={positionColor}
                  style={styles.positionIcon}
                />
              )}
            </View>
          </View>

          {/* Team */}
          <View style={styles.teamColumn}>
            <View style={styles.teamInfo}>
              {team.badge ? (
                <Image source={{ uri: team.badge }} style={styles.teamBadge} />
              ) : (
                <View style={styles.teamBadgePlaceholder}>
                  <Ionicons name="shield" size={20} color={colors.text.tertiary} />
                </View>
              )}
              <View style={styles.teamNames}>
                <Text style={styles.teamName} numberOfLines={1}>
                  {compactMode && team.shortName ? team.shortName : team.name}
                </Text>
                {showTrend && trendIcon && (
                  <Ionicons 
                    name={trendIcon.name as any} 
                    size={12} 
                    color={trendIcon.color}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Stats */}
          {!compactMode && (
            <>
              <View style={styles.statsColumn}>
                <Text style={styles.statsText}>{team.matches}</Text>
              </View>
              <View style={styles.statsColumn}>
                <Text style={[styles.statsText, { color: colors.semantic.success.main }]}>
                  {team.wins}
                </Text>
              </View>
              <View style={styles.statsColumn}>
                <Text style={[styles.statsText, { color: colors.semantic.warning.main }]}>
                  {team.draws}
                </Text>
              </View>
              <View style={styles.statsColumn}>
                <Text style={[styles.statsText, { color: colors.semantic.error.main }]}>
                  {team.losses}
                </Text>
              </View>
              {showGoalDifference && (
                <View style={styles.statsColumn}>
                  <Text style={[
                    styles.statsText,
                    { 
                      color: team.goalDifference > 0 
                        ? colors.semantic.success.main 
                        : team.goalDifference < 0 
                        ? colors.semantic.error.main 
                        : colors.text.primary 
                    }
                  ]}>
                    {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Points */}
          <View style={styles.pointsColumn}>
            <Text style={styles.pointsText}>{team.points}</Text>
          </View>

          {/* Form */}
          {showForm && team.form && (
            <View style={styles.formColumn}>
              <View style={styles.formContainer}>
                {team.form.map((result, formIndex) => (
                  <View
                    key={formIndex}
                    style={[
                      styles.formDot,
                      { backgroundColor: getFormColor(result) }
                    ]}
                  >
                    <Text style={styles.formText}>{result}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderLegend = () => (
    <View style={styles.legend}>
      <View style={styles.legendRow}>
        {highlightPositions.champions && highlightPositions.champions.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.semantic.success.main }]} />
            <Text style={styles.legendText}>Champions League</Text>
          </View>
        )}
        {highlightPositions.europeanCompetition && highlightPositions.europeanCompetition.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary.main }]} />
            <Text style={styles.legendText}>European Competition</Text>
          </View>
        )}
        {highlightPositions.relegation && highlightPositions.relegation.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.semantic.error.main }]} />
            <Text style={styles.legendText}>Relegation</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (!teams || teams.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="list" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyStateText}>No teams data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {renderTableHeader()}
          <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
            {teams.map((team, index) => renderTeamRow(team, index))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Legend */}
      {renderLegend()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
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
  
  // Table styles
  table: {
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surface.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: colors.border.medium,
  },
  headerText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  tableBody: {
    maxHeight: 400,
  },
  teamRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    alignItems: 'center',
  },
  alternateRow: {
    backgroundColor: colors.surface.tertiary + '40',
  },
  
  // Column styles
  positionColumn: {
    width: 50,
    alignItems: 'center',
  },
  teamColumn: {
    width: 180,
    paddingRight: spacing.sm,
  },
  statsColumn: {
    width: 40,
    alignItems: 'center',
  },
  pointsColumn: {
    width: 50,
    alignItems: 'center',
  },
  formColumn: {
    width: 120,
    alignItems: 'center',
  },
  
  // Position styles
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionIndicator: {
    width: 3,
    height: 20,
    borderRadius: 2,
    marginRight: spacing.xs,
  },
  positionText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
  },
  positionIcon: {
    marginLeft: spacing.xxs,
  },
  
  // Team styles
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  teamBadgePlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  teamNames: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamName: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    flex: 1,
  },
  
  // Stats styles
  statsText: {
    fontSize: typography.fontSize.small,
    color: colors.text.primary,
    textAlign: 'center',
  },
  pointsText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  
  // Form styles
  formContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  formDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formText: {
    fontSize: 8,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  
  // Legend styles
  legend: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.tertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});