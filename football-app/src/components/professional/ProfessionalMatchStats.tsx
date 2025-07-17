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
import { ProfessionalProgressBar } from './ProfessionalProgressBar';
import { ProfessionalCircularProgress } from './ProfessionalCircularProgress';
import { ProfessionalBarChart } from './ProfessionalBarChart';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;
const { width: screenWidth } = Dimensions.get('window');

interface TeamMatchStats {
  teamId: string;
  teamName: string;
  teamBadge?: string;
  formation: string;
  goals: number;
  shots: number;
  shotsOnTarget: number;
  possession: number; // percentage
  passes: number;
  passAccuracy: number; // percentage
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  offsides: number;
  saves: number;
  tackles: number;
  interceptions: number;
  aerialDuels: number;
  aerialDuelsWon: number;
  crossAccuracy: number; // percentage
  longBalls: number;
  longBallAccuracy: number; // percentage
}

interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'var' | 'penalty';
  teamId: string;
  playerName: string;
  description: string;
  icon?: string;
}

interface MatchData {
  id: string;
  homeTeam: TeamMatchStats;
  awayTeam: TeamMatchStats;
  events: MatchEvent[];
  status: 'live' | 'completed' | 'scheduled';
  minute?: number;
  venue?: string;
  referee?: string;
  attendance?: number;
  weather?: string;
  temperature?: number;
}

interface ProfessionalMatchStatsProps {
  matchData: MatchData;
  style?: ViewStyle;
  onTeamPress?: (team: TeamMatchStats) => void;
  showDetailedStats?: boolean;
  compactMode?: boolean;
  activeTab?: 'overview' | 'events' | 'lineups' | 'heatmap';
  onTabChange?: (tab: string) => void;
}

export const ProfessionalMatchStats: React.FC<ProfessionalMatchStatsProps> = ({
  matchData,
  style,
  onTeamPress,
  showDetailedStats = true,
  compactMode = false,
  activeTab = 'overview',
  onTabChange,
}) => {
  if (!matchData) return null;

  const { homeTeam, awayTeam, events, status, minute } = matchData;
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

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal': return 'football';
      case 'yellow_card': return 'square';
      case 'red_card': return 'stop';
      case 'substitution': return 'swap-horizontal';
      case 'var': return 'tv';
      case 'penalty': return 'radio-button-on';
      default: return 'information-circle';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'goal': return colors.semantic.success.main;
      case 'yellow_card': return colors.semantic.warning.main;
      case 'red_card': return colors.semantic.error.main;
      case 'substitution': return colors.primary.main;
      case 'var': return colors.secondary.main;
      case 'penalty': return colors.semantic.info.main;
      default: return colors.text.secondary;
    }
  };

  const renderMatchHeader = () => (
    <View style={styles.matchHeader}>
      <LinearGradient
        colors={[colors.surface.secondary, colors.surface.primary]}
        style={styles.matchHeaderGradient}
      >
        {/* Score Section */}
        <View style={styles.scoreSection}>
          {/* Home Team */}
          <TouchableOpacity 
            style={styles.teamContainer}
            onPress={() => onTeamPress?.(homeTeam)}
            activeOpacity={0.8}
          >
            {homeTeam.teamBadge ? (
              <Image source={{ uri: homeTeam.teamBadge }} style={styles.teamBadge} />
            ) : (
              <View style={styles.teamBadgePlaceholder}>
                <Ionicons name="shield" size={32} color={colors.text.secondary} />
              </View>
            )}
            <Text style={styles.teamName} numberOfLines={1}>{homeTeam.teamName}</Text>
            <Text style={styles.formation}>{homeTeam.formation}</Text>
          </TouchableOpacity>

          {/* Score */}
          <View style={styles.scoreContainer}>
            <View style={styles.scoreDisplay}>
              <Text style={styles.score}>{homeTeam.goals}</Text>
              <Text style={styles.scoreSeparator}>-</Text>
              <Text style={styles.score}>{awayTeam.goals}</Text>
            </View>
            
            {/* Match Status */}
            <View style={[
              styles.statusBadge,
              { backgroundColor: status === 'live' ? colors.semantic.success.main : colors.text.secondary }
            ]}>
              {status === 'live' && <View style={styles.liveDot} />}
              <Text style={styles.statusText}>
                {status === 'live' ? `${minute}'` : status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Away Team */}
          <TouchableOpacity 
            style={styles.teamContainer}
            onPress={() => onTeamPress?.(awayTeam)}
            activeOpacity={0.8}
          >
            {awayTeam.teamBadge ? (
              <Image source={{ uri: awayTeam.teamBadge }} style={styles.teamBadge} />
            ) : (
              <View style={styles.teamBadgePlaceholder}>
                <Ionicons name="shield" size={32} color={colors.text.secondary} />
              </View>
            )}
            <Text style={styles.teamName} numberOfLines={1}>{awayTeam.teamName}</Text>
            <Text style={styles.formation}>{awayTeam.formation}</Text>
          </TouchableOpacity>
        </View>

        {/* Match Info */}
        <View style={styles.matchInfo}>
          {matchData.venue && (
            <Text style={styles.matchInfoText}>
              <Ionicons name="location" size={12} color={colors.text.tertiary} /> {matchData.venue}
            </Text>
          )}
          {matchData.referee && (
            <Text style={styles.matchInfoText}>
              <Ionicons name="person" size={12} color={colors.text.tertiary} /> {matchData.referee}
            </Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {['overview', 'events', 'lineups', 'heatmap'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => onTabChange?.(tab)}
        >
          <Text style={[
            styles.tabText,
            activeTab === tab && styles.activeTabText
          ]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStatsComparison = () => {
    const statsConfig = [
      { key: 'shots', label: 'Shots', icon: 'radio-button-on' },
      { key: 'shotsOnTarget', label: 'Shots on Target', icon: 'checkmark-circle' },
      { key: 'possession', label: 'Possession', icon: 'pie-chart', unit: '%' },
      { key: 'passAccuracy', label: 'Pass Accuracy', icon: 'checkmark', unit: '%' },
      { key: 'corners', label: 'Corners', icon: 'flag' },
      { key: 'fouls', label: 'Fouls', icon: 'warning' },
      { key: 'tackles', label: 'Tackles', icon: 'shield' },
      { key: 'interceptions', label: 'Interceptions', icon: 'hand-left' },
    ];

    return (
      <View style={styles.statsComparison}>
        <Text style={styles.sectionTitle}>Match Statistics</Text>
        
        {statsConfig.map((stat) => {
          const homeStat = homeTeam[stat.key as keyof TeamMatchStats] as number;
          const awayStat = awayTeam[stat.key as keyof TeamMatchStats] as number;
          const maxValue = Math.max(homeStat, awayStat, 1);
          
          const homePercentage = (homeStat / maxValue) * 100;
          const awayPercentage = (awayStat / maxValue) * 100;

          return (
            <View key={stat.key} style={styles.statRow}>
              {/* Home Team Value */}
              <Text style={styles.statValue}>
                {homeStat}{stat.unit || ''}
              </Text>

              {/* Stat Bar */}
              <View style={styles.statBarContainer}>
                <View style={styles.statInfo}>
                  <Ionicons name={stat.icon as any} size={14} color={colors.text.secondary} />
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                
                <View style={styles.statBars}>
                  {/* Home Team Bar (Left) */}
                  <View style={styles.statBarLeft}>
                    <ProfessionalProgressBar
                      value={homePercentage}
                      maxValue={100}
                      color={colors.primary.main}
                      height={8}
                      showPercentage={false}
                      showValue={false}
                      animated={true}
                      style={styles.statProgressBar}
                    />
                  </View>
                  
                  {/* Away Team Bar (Right) */}
                  <View style={styles.statBarRight}>
                    <ProfessionalProgressBar
                      value={awayPercentage}
                      maxValue={100}
                      color={colors.secondary.main}
                      height={8}
                      showPercentage={false}
                      showValue={false}
                      animated={true}
                      style={styles.statProgressBar}
                    />
                  </View>
                </View>
              </View>

              {/* Away Team Value */}
              <Text style={styles.statValue}>
                {awayStat}{stat.unit || ''}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderPossessionChart = () => {
    const possessionData = [
      {
        label: homeTeam.teamName,
        value: homeTeam.possession,
        color: colors.primary.main,
        icon: 'home',
      },
      {
        label: awayTeam.teamName,
        value: awayTeam.possession,
        color: colors.secondary.main,
        icon: 'airplane',
      },
    ];

    return (
      <View style={styles.possessionSection}>
        <Text style={styles.sectionTitle}>Ball Possession</Text>
        <View style={styles.possessionCharts}>
          {possessionData.map((team, index) => (
            <View key={index} style={styles.possessionChart}>
              <ProfessionalCircularProgress
                value={team.value}
                size={120}
                color={team.color}
                strokeWidth={10}
                showPercentage={true}
                unit="%"
                variant="gradient"
                centerContent={
                  <View style={styles.possessionCenter}>
                    <Ionicons name={team.icon as any} size={24} color={team.color} />
                  </View>
                }
              />
              <Text style={styles.possessionTeamName}>{team.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMatchEvents = () => {
    const sortedEvents = [...events].sort((a, b) => a.minute - b.minute);

    return (
      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>Match Events</Text>
        <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
          {sortedEvents.map((event) => {
            const isHomeTeam = event.teamId === homeTeam.teamId;
            
            return (
              <View key={event.id} style={styles.eventItem}>
                <View style={[
                  styles.eventContainer,
                  { flexDirection: isHomeTeam ? 'row' : 'row-reverse' }
                ]}>
                  {/* Event Details */}
                  <View style={[
                    styles.eventDetails,
                    { alignItems: isHomeTeam ? 'flex-start' : 'flex-end' }
                  ]}>
                    <Text style={styles.eventPlayer}>{event.playerName}</Text>
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  </View>

                  {/* Event Icon */}
                  <View style={[
                    styles.eventIcon,
                    { backgroundColor: getEventColor(event.type) + '15' }
                  ]}>
                    <Ionicons 
                      name={getEventIcon(event.type) as any} 
                      size={16} 
                      color={getEventColor(event.type)} 
                    />
                  </View>

                  {/* Event Minute */}
                  <View style={styles.eventMinute}>
                    <Text style={styles.eventMinuteText}>{event.minute}'</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderKeyStats = () => {
    const keyStats = [
      {
        home: homeTeam.goals,
        away: awayTeam.goals,
        label: 'Goals',
        icon: 'football',
        color: colors.semantic.success.main,
      },
      {
        home: homeTeam.shots,
        away: awayTeam.shots,
        label: 'Shots',
        icon: 'radio-button-on',
        color: colors.primary.main,
      },
      {
        home: homeTeam.shotsOnTarget,
        away: awayTeam.shotsOnTarget,
        label: 'On Target',
        icon: 'checkmark-circle',
        color: colors.secondary.main,
      },
      {
        home: homeTeam.yellowCards,
        away: awayTeam.yellowCards,
        label: 'Yellow Cards',
        icon: 'square',
        color: colors.semantic.warning.main,
      },
    ];

    return (
      <View style={styles.keyStatsGrid}>
        {keyStats.map((stat, index) => (
          <View key={index} style={styles.keyStatCard}>
            <View style={[styles.keyStatIcon, { backgroundColor: stat.color + '15' }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={styles.keyStatLabel}>{stat.label}</Text>
            <View style={styles.keyStatValues}>
              <Text style={styles.keyStatValue}>{stat.home}</Text>
              <Text style={styles.keyStatSeparator}>-</Text>
              <Text style={styles.keyStatValue}>{stat.away}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'events':
        return renderMatchEvents();
      case 'lineups':
        return (
          <View style={styles.comingSoon}>
            <Ionicons name="people" size={48} color={colors.text.tertiary} />
            <Text style={styles.comingSoonText}>Team Lineups Coming Soon</Text>
          </View>
        );
      case 'heatmap':
        return (
          <View style={styles.comingSoon}>
            <Ionicons name="map" size={48} color={colors.text.tertiary} />
            <Text style={styles.comingSoonText}>Player Heatmap Coming Soon</Text>
          </View>
        );
      default:
        return (
          <>
            {renderKeyStats()}
            {renderPossessionChart()}
            {showDetailedStats && renderStatsComparison()}
          </>
        );
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
      {renderMatchHeader()}
      {renderTabNavigation()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
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
  
  // Match header styles
  matchHeader: {
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    overflow: 'hidden',
  },
  matchHeaderGradient: {
    padding: spacing.md,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: spacing.xs,
  },
  teamBadgePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  teamName: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  formation: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  score: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  scoreSeparator: {
    fontSize: typography.fontSize.title2,
    color: colors.text.secondary,
    marginHorizontal: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badge,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text.inverse,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  matchInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  matchInfoText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
  },
  
  // Tab navigation styles
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: colors.surface.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary.main,
  },
  tabText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Content styles
  content: {
    maxHeight: 500,
  },
  
  // Key stats styles
  keyStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: spacing.md,
    gap: spacing.sm,
  },
  keyStatCard: {
    alignItems: 'center',
    minWidth: '22%',
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  keyStatIcon: {
    borderRadius: 20,
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  keyStatLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  keyStatValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyStatValue: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  keyStatSeparator: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    marginHorizontal: spacing.xs,
  },
  
  // Possession styles
  possessionSection: {
    padding: spacing.md,
  },
  possessionCharts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  possessionChart: {
    alignItems: 'center',
  },
  possessionCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  possessionTeamName: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  
  // Stats comparison styles
  statsComparison: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    width: 50,
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  statBarContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  statInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.small,
    color: colors.text.primary,
    marginLeft: spacing.xs,
  },
  statBars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBarLeft: {
    flex: 1,
    marginRight: spacing.xs,
  },
  statBarRight: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  statProgressBar: {
    marginVertical: 0,
  },
  
  // Events styles
  eventsSection: {
    padding: spacing.md,
  },
  eventsList: {
    maxHeight: 300,
  },
  eventItem: {
    marginBottom: spacing.sm,
  },
  eventContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  eventDetails: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  eventPlayer: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  eventDescription: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
  },
  eventMinute: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  eventMinuteText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  
  // Coming soon styles
  comingSoon: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  comingSoonText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.tertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});