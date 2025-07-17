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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';
import { ProfessionalProgressBar, ProfessionalMultiProgress } from './ProfessionalProgressBar';
import { ProfessionalCircularProgress, ProfessionalMultiCircularProgress } from './ProfessionalCircularProgress';
import { ProfessionalBarChart } from './ProfessionalBarChart';
import { ProfessionalLineChart } from './ProfessionalLineChart';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;
const { width: screenWidth } = Dimensions.get('window');

interface TeamSeasonStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
  homeWins: number;
  homeDraws: number;
  homeLosses: number;
  awayWins: number;
  awayDraws: number;
  awayLosses: number;
  cleanSheets: number;
  failedToScore: number;
  averageGoalsPerGame: number;
  averageGoalsConcededPerGame: number;
  winPercentage: number;
  formLast5: string[]; // 'W', 'D', 'L'
  formLast10: string[];
}

interface PlayerPerformance {
  playerId: string;
  name: string;
  position: string;
  goals: number;
  assists: number;
  appearances: number;
  rating: number;
  photo?: string;
}

interface MonthlyPerformance {
  month: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface TeamData {
  id: string;
  name: string;
  shortName: string;
  badge?: string;
  primaryColor: string;
  secondaryColor: string;
  seasonStats: TeamSeasonStats;
  topPlayers: PlayerPerformance[];
  monthlyPerformance: MonthlyPerformance[];
  strengths: string[];
  weaknesses: string[];
  recentMatches: any[];
}

interface ProfessionalTeamPerformanceProps {
  teamData: TeamData;
  style?: ViewStyle;
  onPlayerPress?: (player: PlayerPerformance) => void;
  onMatchPress?: (match: any) => void;
  compactMode?: boolean;
  activeSection?: 'overview' | 'players' | 'form' | 'analytics';
  onSectionChange?: (section: string) => void;
}

export const ProfessionalTeamPerformance: React.FC<ProfessionalTeamPerformanceProps> = ({
  teamData,
  style,
  onPlayerPress,
  onMatchPress,
  compactMode = false,
  activeSection = 'overview',
  onSectionChange,
}) => {
  if (!teamData) return null;

  const { seasonStats, topPlayers, monthlyPerformance } = teamData;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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
  }, []);

  const getFormColor = (result: string) => {
    switch (result) {
      case 'W': return colors.semantic.success;
      case 'D': return colors.semantic.warning;
      case 'L': return colors.semantic.error;
      default: return colors.text.tertiary;
    }
  };

  const renderTeamHeader = () => (
    <View style={styles.teamHeader}>
      <LinearGradient
        colors={[teamData.primaryColor + 'CC', teamData.primaryColor + '88']}
        style={styles.teamHeaderGradient}
      >
        <View style={styles.teamHeaderContent}>
          {/* Team Badge and Info */}
          <View style={styles.teamInfo}>
            {teamData.badge ? (
              <Image source={{ uri: teamData.badge }} style={styles.teamBadge} />
            ) : (
              <View style={styles.teamBadgePlaceholder}>
                <Ionicons name="shield" size={48} color={colors.text.inverse} />
              </View>
            )}
            
            <View style={styles.teamDetails}>
              <Text style={styles.teamName}>{teamData.name}</Text>
              <View style={styles.teamMeta}>
                <View style={styles.positionBadge}>
                  <Text style={styles.positionText}>#{seasonStats.position}</Text>
                </View>
                <Text style={styles.pointsText}>{seasonStats.points} pts</Text>
              </View>
            </View>
          </View>

          {/* Key Metrics */}
          <View style={styles.keyMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{seasonStats.wins}</Text>
              <Text style={styles.metricLabel}>Wins</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{seasonStats.goalDifference > 0 ? '+' : ''}{seasonStats.goalDifference}</Text>
              <Text style={styles.metricLabel}>GD</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{seasonStats.winPercentage.toFixed(0)}%</Text>
              <Text style={styles.metricLabel}>Win Rate</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderSectionNavigation = () => (
    <View style={styles.sectionNavigation}>
      {['overview', 'players', 'form', 'analytics'].map((section) => (
        <TouchableOpacity
          key={section}
          style={[styles.sectionTab, activeSection === section && styles.activeSectionTab]}
          onPress={() => onSectionChange?.(section)}
        >
          <Text style={[
            styles.sectionTabText,
            activeSection === section && styles.activeSectionTabText
          ]}>
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewSection = () => (
    <View style={styles.overviewSection}>
      {/* Win/Draw/Loss Distribution */}
      <View style={styles.recordSection}>
        <Text style={styles.sectionTitle}>Season Record</Text>
        <View style={styles.recordCharts}>
          <View style={styles.recordChart}>
            <ProfessionalCircularProgress
              value={(seasonStats.wins / seasonStats.matchesPlayed) * 100}
              size={100}
              color={colors.semantic.success}
              strokeWidth={8}
              showPercentage={true}
              centerContent={
                <View style={styles.recordCenter}>
                  <Text style={styles.recordValue}>{seasonStats.wins}</Text>
                  <Text style={styles.recordLabel}>Wins</Text>
                </View>
              }
            />
          </View>
          <View style={styles.recordChart}>
            <ProfessionalCircularProgress
              value={(seasonStats.draws / seasonStats.matchesPlayed) * 100}
              size={100}
              color={colors.semantic.warning}
              strokeWidth={8}
              showPercentage={true}
              centerContent={
                <View style={styles.recordCenter}>
                  <Text style={styles.recordValue}>{seasonStats.draws}</Text>
                  <Text style={styles.recordLabel}>Draws</Text>
                </View>
              }
            />
          </View>
          <View style={styles.recordChart}>
            <ProfessionalCircularProgress
              value={(seasonStats.losses / seasonStats.matchesPlayed) * 100}
              size={100}
              color={colors.semantic.error}
              strokeWidth={8}
              showPercentage={true}
              centerContent={
                <View style={styles.recordCenter}>
                  <Text style={styles.recordValue}>{seasonStats.losses}</Text>
                  <Text style={styles.recordLabel}>Losses</Text>
                </View>
              }
            />
          </View>
        </View>
      </View>

      {/* Home vs Away Performance */}
      <View style={styles.homeAwaySection}>
        <Text style={styles.sectionTitle}>Home vs Away</Text>
        <ProfessionalMultiProgress
          data={[
            {
              label: 'Home Wins',
              value: seasonStats.homeWins,
              maxValue: Math.max(seasonStats.homeWins, seasonStats.awayWins),
              color: colors.primary.main,
              unit: '',
            },
            {
              label: 'Away Wins',
              value: seasonStats.awayWins,
              maxValue: Math.max(seasonStats.homeWins, seasonStats.awayWins),
              color: colors.secondary.main,
              unit: '',
            },
            {
              label: 'Clean Sheets',
              value: seasonStats.cleanSheets,
              maxValue: seasonStats.matchesPlayed,
              color: colors.semantic.success,
              unit: '',
            },
            {
              label: 'Failed to Score',
              value: seasonStats.failedToScore,
              maxValue: seasonStats.matchesPlayed,
              color: colors.semantic.error,
              unit: '',
            },
          ]}
          showValues={true}
          showPercentages={false}
          variant="default"
        />
      </View>

      {/* Goal Statistics */}
      <View style={styles.goalStatsSection}>
        <Text style={styles.sectionTitle}>Goal Statistics</Text>
        <View style={styles.goalStatsGrid}>
          <View style={styles.goalStatCard}>
            <View style={[styles.goalStatIcon, { backgroundColor: colors.semantic.success + '15' }]}>
              <Ionicons name="football" size={24} color={colors.semantic.success} />
            </View>
            <Text style={styles.goalStatValue}>{seasonStats.goalsFor}</Text>
            <Text style={styles.goalStatLabel}>Goals For</Text>
            <Text style={styles.goalStatAverage}>
              {seasonStats.averageGoalsPerGame.toFixed(1)} per game
            </Text>
          </View>
          
          <View style={styles.goalStatCard}>
            <View style={[styles.goalStatIcon, { backgroundColor: colors.semantic.error + '15' }]}>
              <Ionicons name="shield" size={24} color={colors.semantic.error} />
            </View>
            <Text style={styles.goalStatValue}>{seasonStats.goalsAgainst}</Text>
            <Text style={styles.goalStatLabel}>Goals Against</Text>
            <Text style={styles.goalStatAverage}>
              {seasonStats.averageGoalsConcededPerGame.toFixed(1)} per game
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Recent Form</Text>
        <View style={styles.formContainer}>
          <View style={styles.formRow}>
            <Text style={styles.formRowLabel}>Last 5 games:</Text>
            <View style={styles.formDots}>
              {seasonStats.formLast5.map((result, index) => (
                <View
                  key={index}
                  style={[styles.formDot, { backgroundColor: getFormColor(result) }]}
                >
                  <Text style={styles.formDotText}>{result}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formRowLabel}>Last 10 games:</Text>
            <View style={styles.formDots}>
              {seasonStats.formLast10.map((result, index) => (
                <View
                  key={index}
                  style={[styles.formDotSmall, { backgroundColor: getFormColor(result) }]}
                >
                  <Text style={styles.formDotTextSmall}>{result}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPlayersSection = () => (
    <View style={styles.playersSection}>
      <Text style={styles.sectionTitle}>Top Performers</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.playersGrid}>
          {topPlayers.map((player) => (
            <TouchableOpacity
              key={player.playerId}
              style={styles.playerCard}
              onPress={() => onPlayerPress?.(player)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.surface.secondary, colors.surface.primary]}
                style={styles.playerCardGradient}
              >
                {/* Player Photo */}
                <View style={styles.playerPhotoContainer}>
                  {player.photo ? (
                    <Image source={{ uri: player.photo }} style={styles.playerPhoto} />
                  ) : (
                    <View style={styles.playerPhotoPlaceholder}>
                      <Ionicons name="person" size={24} color={colors.text.secondary} />
                    </View>
                  )}
                  
                  {/* Rating Badge */}
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>{player.rating.toFixed(1)}</Text>
                  </View>
                </View>

                {/* Player Info */}
                <View style={styles.playerCardInfo}>
                  <Text style={styles.playerCardName} numberOfLines={1}>{player.name}</Text>
                  <Text style={styles.playerCardPosition}>{player.position}</Text>
                  
                  {/* Player Stats */}
                  <View style={styles.playerCardStats}>
                    <View style={styles.playerCardStat}>
                      <Text style={styles.playerCardStatValue}>{player.goals}</Text>
                      <Text style={styles.playerCardStatLabel}>Goals</Text>
                    </View>
                    <View style={styles.playerCardStat}>
                      <Text style={styles.playerCardStatValue}>{player.assists}</Text>
                      <Text style={styles.playerCardStatLabel}>Assists</Text>
                    </View>
                    <View style={styles.playerCardStat}>
                      <Text style={styles.playerCardStatValue}>{player.appearances}</Text>
                      <Text style={styles.playerCardStatLabel}>Apps</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Team Strengths and Weaknesses */}
      <View style={styles.strengthsWeaknessesSection}>
        <View style={styles.strengthsSection}>
          <Text style={styles.subsectionTitle}>
            <Ionicons name="trending-up" size={16} color={colors.semantic.success} /> Strengths
          </Text>
          {teamData.strengths.map((strength, index) => (
            <View key={index} style={styles.strengthItem}>
              <Ionicons name="checkmark-circle" size={14} color={colors.semantic.success} />
              <Text style={styles.strengthText}>{strength}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.weaknessesSection}>
          <Text style={styles.subsectionTitle}>
            <Ionicons name="trending-down" size={16} color={colors.semantic.warning} /> Areas for Improvement
          </Text>
          {teamData.weaknesses.map((weakness, index) => (
            <View key={index} style={styles.weaknessItem}>
              <Ionicons name="alert-circle" size={14} color={colors.semantic.warning} />
              <Text style={styles.weaknessText}>{weakness}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderFormSection = () => {
    const formData = monthlyPerformance.map(month => ({
      x: month.month,
      y: month.points,
    }));

    const goalsData = monthlyPerformance.map(month => ({
      label: month.month.slice(0, 3),
      value: month.goalsFor,
      color: colors.semantic.success,
    }));

    const goalsConcededData = monthlyPerformance.map(month => ({
      label: month.month.slice(0, 3),
      value: month.goalsAgainst,
      color: colors.semantic.error,
    }));

    return (
      <View style={styles.formAnalysisSection}>
        {/* Points Trend */}
        <View style={styles.chartSection}>
          <ProfessionalLineChart
            data={formData}
            title="Points Per Month"
            width={screenWidth - 60}
            height={200}
            color={colors.primary.main}
            showArea={true}
            showGrid={true}
            unit=" pts"
            formatXLabel={(value) => value.toString().slice(0, 3)}
          />
        </View>

        {/* Goals For vs Against */}
        <View style={styles.chartSection}>
          <ProfessionalBarChart
            data={[...goalsData, ...goalsConcededData]}
            title="Goals For vs Against (Monthly)"
            height={200}
            variant="vertical"
            colorScheme="performance"
            showValues={true}
          />
        </View>
      </View>
    );
  };

  const renderAnalyticsSection = () => (
    <View style={styles.analyticsSection}>
      <View style={styles.comingSoon}>
        <Ionicons name="analytics" size={48} color={colors.text.tertiary} />
        <Text style={styles.comingSoonText}>Advanced Analytics Coming Soon</Text>
        <Text style={styles.comingSoonSubtext}>
          Expected Goals, Heat Maps, Passing Networks, and more detailed performance metrics
        </Text>
      </View>
    </View>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'players':
        return renderPlayersSection();
      case 'form':
        return renderFormSection();
      case 'analytics':
        return renderAnalyticsSection();
      default:
        return renderOverviewSection();
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnimation,
          transform: [{ translateY: slideAnimation }]
        }, 
        style
      ]}
    >
      {renderTeamHeader()}
      {renderSectionNavigation()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSectionContent()}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  
  // Team header styles
  teamHeader: {
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    overflow: 'hidden',
  },
  teamHeaderGradient: {
    padding: spacing.md,
  },
  teamHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
  },
  teamBadgePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface.tertiary + '50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionBadge: {
    backgroundColor: colors.text.inverse + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.badge,
    marginRight: spacing.sm,
  },
  positionText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  pointsText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  keyMetrics: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  metricLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.inverse + 'CC',
    marginTop: spacing.xxs,
  },
  
  // Section navigation styles
  sectionNavigation: {
    flexDirection: 'row',
    backgroundColor: colors.surface.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeSectionTab: {
    borderBottomColor: colors.primary.main,
  },
  sectionTabText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
  },
  activeSectionTabText: {
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Content styles
  content: {
    maxHeight: 600,
  },
  
  // Section styles
  overviewSection: {
    padding: spacing.md,
  },
  playersSection: {
    padding: spacing.md,
  },
  formAnalysisSection: {
    padding: spacing.md,
  },
  analyticsSection: {
    padding: spacing.md,
  },
  
  sectionTitle: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  
  // Record section styles
  recordSection: {
    marginBottom: spacing.lg,
  },
  recordCharts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  recordChart: {
    alignItems: 'center',
  },
  recordCenter: {
    alignItems: 'center',
  },
  recordValue: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  recordLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  
  // Home vs Away section
  homeAwaySection: {
    marginBottom: spacing.lg,
  },
  
  // Goal stats section
  goalStatsSection: {
    marginBottom: spacing.lg,
  },
  goalStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  goalStatCard: {
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minWidth: 120,
  },
  goalStatIcon: {
    borderRadius: 25,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  goalStatValue: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  goalStatLabel: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  goalStatAverage: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
  },
  
  // Form section styles
  formSection: {
    marginBottom: spacing.lg,
  },
  formContainer: {
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  formRowLabel: {
    fontSize: typography.fontSize.small,
    color: colors.text.primary,
    flex: 1,
  },
  formDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  formDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDotText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  formDotSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDotTextSmall: {
    fontSize: 8,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  
  // Players section styles
  playersGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  playerCard: {
    width: 140,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  playerCardGradient: {
    padding: spacing.sm,
  },
  playerPhotoContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  playerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  playerPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border.medium,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: colors.primary.main,
    borderRadius: 10,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  ratingBadgeText: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  playerCardInfo: {
    alignItems: 'center',
  },
  playerCardName: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  playerCardPosition: {
    fontSize: typography.fontSize.caption,
    color: colors.primary.main,
    marginBottom: spacing.sm,
  },
  playerCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  playerCardStat: {
    alignItems: 'center',
  },
  playerCardStatValue: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  playerCardStatLabel: {
    fontSize: typography.fontSize.micro,
    color: colors.text.secondary,
  },
  
  // Strengths and weaknesses
  strengthsWeaknessesSection: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  strengthsSection: {
    flex: 1,
    backgroundColor: colors.semantic.success + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  weaknessesSection: {
    flex: 1,
    backgroundColor: colors.semantic.warning + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  subsectionTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  strengthText: {
    fontSize: typography.fontSize.small,
    color: colors.text.primary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  weaknessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  weaknessText: {
    fontSize: typography.fontSize.small,
    color: colors.text.primary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  
  // Chart section
  chartSection: {
    marginBottom: spacing.lg,
  },
  
  // Coming soon styles
  comingSoon: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  comingSoonText: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  comingSoonSubtext: {
    fontSize: typography.fontSize.small,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});