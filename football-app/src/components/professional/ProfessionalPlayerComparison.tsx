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

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;
const { width: screenWidth } = Dimensions.get('window');

interface PlayerStats {
  goals: number;
  assists: number;
  matches: number;
  rating: number;
  minutesPlayed: number;
  passAccuracy: number;
  tackleSucess: number;
  aerialWins: number;
  speed: number;
  strength: number;
  dribbles: number;
  shots: number;
  shotsOnTarget: number;
  keyPasses: number;
  crossAccuracy: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
}

interface PlayerData {
  id: string;
  name: string;
  position: string;
  age: number;
  nationality: string;
  club: string;
  photo?: string;
  clubBadge?: string;
  stats: PlayerStats;
  marketValue?: number;
  jerseyNumber?: number;
}

interface ProfessionalPlayerComparisonProps {
  players: [PlayerData, PlayerData]; // Exactly 2 players
  title?: string;
  style?: ViewStyle;
  onPlayerPress?: (player: PlayerData) => void;
  compactMode?: boolean;
  showRadarChart?: boolean;
  categoryFilter?: 'all' | 'attacking' | 'defending' | 'general';
}

export const ProfessionalPlayerComparison: React.FC<ProfessionalPlayerComparisonProps> = ({
  players,
  title = 'Player Comparison',
  style,
  onPlayerPress,
  compactMode = false,
  showRadarChart = true,
  categoryFilter = 'all',
}) => {
  if (!players || players.length !== 2) return null;

  const [player1, player2] = players;
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

  const getStatCategories = () => {
    const attacking = [
      { key: 'goals', label: 'Goals', icon: 'football', unit: '' },
      { key: 'assists', label: 'Assists', icon: 'trending-up', unit: '' },
      { key: 'shots', label: 'Shots', icon: 'radio-button-on', unit: '' },
      { key: 'shotsOnTarget', label: 'Shots on Target', icon: 'checkmark-circle', unit: '' },
      { key: 'keyPasses', label: 'Key Passes', icon: 'arrow-forward', unit: '' },
      { key: 'dribbles', label: 'Dribbles', icon: 'shuffle', unit: '' },
    ];

    const defending = [
      { key: 'tackleSucess', label: 'Tackle Success', icon: 'shield', unit: '%' },
      { key: 'aerialWins', label: 'Aerial Wins', icon: 'arrow-up', unit: '%' },
      { key: 'fouls', label: 'Fouls', icon: 'warning', unit: '' },
      { key: 'yellowCards', label: 'Yellow Cards', icon: 'square', unit: '' },
      { key: 'redCards', label: 'Red Cards', icon: 'square', unit: '' },
    ];

    const general = [
      { key: 'rating', label: 'Rating', icon: 'star', unit: '', maxValue: 10 },
      { key: 'matches', label: 'Matches', icon: 'calendar', unit: '' },
      { key: 'minutesPlayed', label: 'Minutes', icon: 'time', unit: '' },
      { key: 'passAccuracy', label: 'Pass Accuracy', icon: 'checkmark', unit: '%' },
      { key: 'crossAccuracy', label: 'Cross Accuracy', icon: 'git-branch', unit: '%' },
    ];

    switch (categoryFilter) {
      case 'attacking': return attacking;
      case 'defending': return defending;
      case 'general': return general;
      default: return [...attacking, ...defending, ...general];
    }
  };

  const renderPlayerHeader = (player: PlayerData, isLeft: boolean) => (
    <TouchableOpacity 
      style={[styles.playerHeader, isLeft ? styles.playerHeaderLeft : styles.playerHeaderRight]}
      onPress={() => onPlayerPress?.(player)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[colors.surface.secondary, colors.surface.primary]}
        style={styles.playerHeaderGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.playerHeaderContent, { flexDirection: isLeft ? 'row' : 'row-reverse' }]}>
          {/* Player Photo */}
          <View style={styles.playerPhotoContainer}>
            {player.photo ? (
              <Image source={{ uri: player.photo }} style={styles.playerPhoto} />
            ) : (
              <LinearGradient
                colors={[colors.surface.tertiary, colors.surface.secondary]}
                style={styles.playerPhotoPlaceholder}
              >
                <Ionicons name="person" size={32} color={colors.text.secondary} />
              </LinearGradient>
            )}
            
            {/* Jersey Number */}
            {player.jerseyNumber && (
              <View style={styles.jerseyNumber}>
                <Text style={styles.jerseyNumberText}>{player.jerseyNumber}</Text>
              </View>
            )}
          </View>

          {/* Player Info */}
          <View style={[styles.playerInfo, { alignItems: isLeft ? 'flex-start' : 'flex-end' }]}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerPosition}>{player.position}</Text>
            <View style={[styles.playerDetails, { flexDirection: isLeft ? 'row' : 'row-reverse' }]}>
              <Text style={styles.playerAge}>Age: {player.age}</Text>
              <Text style={styles.playerClub}>{player.club}</Text>
            </View>
            
            {/* Overall Rating */}
            <View style={styles.overallRatingContainer}>
              <ProfessionalCircularProgress
                value={(player.stats.rating / 10) * 100}
                size={60}
                strokeWidth={4}
                color={colors.primary.main}
                variant="rating"
                showPercentage={false}
                centerContent={
                  <View style={styles.ratingCenter}>
                    <Text style={styles.ratingValue}>{player.stats.rating.toFixed(1)}</Text>
                    <Text style={styles.ratingLabel}>OVR</Text>
                  </View>
                }
              />
            </View>
          </View>

          {/* Club Badge */}
          {player.clubBadge && (
            <View style={styles.clubBadgeContainer}>
              <Image source={{ uri: player.clubBadge }} style={styles.clubBadge} />
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderStatComparison = (statConfig: any) => {
    const stat1 = player1.stats[statConfig.key as keyof PlayerStats] || 0;
    const stat2 = player2.stats[statConfig.key as keyof PlayerStats] || 0;
    const maxValue = statConfig.maxValue || Math.max(stat1, stat2, 1);
    
    // Determine who's better
    const player1Better = stat1 > stat2;
    const player2Better = stat2 > stat1;
    const isEqual = stat1 === stat2;

    return (
      <View key={statConfig.key} style={styles.statComparisonRow}>
        {/* Player 1 Value */}
        <View style={styles.statValueContainer}>
          <Text style={[
            styles.statValue,
            player1Better ? styles.statValueBetter : styles.statValueNormal
          ]}>
            {typeof stat1 === 'number' ? stat1.toFixed(statConfig.unit === '%' ? 1 : 0) : stat1}
            {statConfig.unit}
          </Text>
          {player1Better && <Ionicons name="chevron-up" size={12} color={colors.semantic.success} />}
        </View>

        {/* Progress Bars */}
        <View style={styles.statProgressContainer}>
          <View style={styles.statLabelContainer}>
            <View style={styles.statIconContainer}>
              <Ionicons name={statConfig.icon as any} size={16} color={colors.text.secondary} />
            </View>
            <Text style={styles.statLabel}>{statConfig.label}</Text>
          </View>
          
          <View style={styles.progressBarsContainer}>
            {/* Player 1 Progress (Left) */}
            <View style={styles.progressBarLeft}>
              <ProfessionalProgressBar
                value={stat1}
                maxValue={maxValue}
                color={player1Better ? colors.semantic.success : colors.primary.main}
                height={6}
                showPercentage={false}
                showValue={false}
                animated={true}
                style={styles.comparisonProgressBar}
              />
            </View>
            
            {/* Player 2 Progress (Right) */}
            <View style={styles.progressBarRight}>
              <ProfessionalProgressBar
                value={stat2}
                maxValue={maxValue}
                color={player2Better ? colors.semantic.success : colors.secondary.main}
                height={6}
                showPercentage={false}
                showValue={false}
                animated={true}
                style={styles.comparisonProgressBar}
              />
            </View>
          </View>
        </View>

        {/* Player 2 Value */}
        <View style={styles.statValueContainer}>
          <Text style={[
            styles.statValue,
            player2Better ? styles.statValueBetter : styles.statValueNormal
          ]}>
            {typeof stat2 === 'number' ? stat2.toFixed(statConfig.unit === '%' ? 1 : 0) : stat2}
            {statConfig.unit}
          </Text>
          {player2Better && <Ionicons name="chevron-up" size={12} color={colors.semantic.success} />}
        </View>
      </View>
    );
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      {['all', 'attacking', 'defending', 'general'].map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryButton,
            categoryFilter === category && styles.categoryButtonActive
          ]}
          // onPress={() => setCategoryFilter(category as any)}
        >
          <Text style={[
            styles.categoryButtonText,
            categoryFilter === category && styles.categoryButtonTextActive
          ]}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderKeyStats = () => {
    const keyStats = [
      { player1: player1.stats.goals, player2: player2.stats.goals, label: 'Goals', icon: 'football' },
      { player1: player1.stats.assists, player2: player2.stats.assists, label: 'Assists', icon: 'trending-up' },
      { player1: player1.stats.rating, player2: player2.stats.rating, label: 'Rating', icon: 'star' },
      { player1: player1.stats.matches, player2: player2.stats.matches, label: 'Matches', icon: 'calendar' },
    ];

    return (
      <View style={styles.keyStatsContainer}>
        <Text style={styles.keyStatsTitle}>Key Statistics</Text>
        <View style={styles.keyStatsGrid}>
          {keyStats.map((stat, index) => (
            <View key={index} style={styles.keyStatItem}>
              <View style={styles.keyStatIcon}>
                <Ionicons name={stat.icon as any} size={20} color={colors.primary.main} />
              </View>
              <Text style={styles.keyStatLabel}>{stat.label}</Text>
              <View style={styles.keyStatValues}>
                <Text style={[
                  styles.keyStatValue,
                  stat.player1 > stat.player2 ? styles.keyStatValueBetter : {}
                ]}>
                  {stat.player1}
                </Text>
                <Text style={styles.keyStatSeparator}>vs</Text>
                <Text style={[
                  styles.keyStatValue,
                  stat.player2 > stat.player1 ? styles.keyStatValueBetter : {}
                ]}>
                  {stat.player2}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
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
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Player Headers */}
        <View style={styles.playersContainer}>
          {renderPlayerHeader(player1, true)}
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          {renderPlayerHeader(player2, false)}
        </View>

        {/* Key Stats Summary */}
        {renderKeyStats()}

        {/* Category Filter */}
        {!compactMode && renderCategoryFilter()}

        {/* Detailed Stats Comparison */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Detailed Comparison</Text>
          <View style={styles.statsHeader}>
            <Text style={styles.statsHeaderText}>{player1.name}</Text>
            <Text style={styles.statsHeaderText}>Statistics</Text>
            <Text style={styles.statsHeaderText}>{player2.name}</Text>
          </View>
          
          {getStatCategories().map(statConfig => renderStatComparison(statConfig))}
        </View>
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
  titleContainer: {
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
  
  // Player header styles
  playersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerHeader: {
    flex: 1,
    margin: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  playerHeaderLeft: {
    marginRight: spacing.xs,
  },
  playerHeaderRight: {
    marginLeft: spacing.xs,
  },
  playerHeaderGradient: {
    padding: spacing.md,
  },
  playerHeaderContent: {
    alignItems: 'center',
  },
  playerPhotoContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  playerPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  playerPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border.medium,
  },
  jerseyNumber: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: colors.primary.main,
    borderRadius: 10,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  jerseyNumberText: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  playerInfo: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  playerName: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  playerPosition: {
    fontSize: typography.fontSize.small,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  playerDetails: {
    marginBottom: spacing.sm,
  },
  playerAge: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  playerClub: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  overallRatingContainer: {
    alignItems: 'center',
  },
  ratingCenter: {
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  ratingLabel: {
    fontSize: typography.fontSize.micro,
    color: colors.text.tertiary,
  },
  clubBadgeContainer: {
    padding: spacing.xs,
  },
  clubBadge: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  
  // VS styles
  vsContainer: {
    backgroundColor: colors.primary.main,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.xs,
    ...shadows.md,
  },
  vsText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  
  // Key stats styles
  keyStatsContainer: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.md,
  },
  keyStatsTitle: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  keyStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  keyStatItem: {
    alignItems: 'center',
    minWidth: '22%',
    marginBottom: spacing.sm,
  },
  keyStatIcon: {
    backgroundColor: colors.primary.main + '15',
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
  keyStatValueBetter: {
    color: colors.semantic.success,
  },
  keyStatSeparator: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    marginHorizontal: spacing.xs,
  },
  
  // Category filter styles
  categoryFilter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: spacing.md,
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary.main,
  },
  categoryButtonText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
  },
  categoryButtonTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Stats comparison styles
  statsContainer: {
    margin: spacing.md,
  },
  statsTitle: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  statsHeaderText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  statComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  statValueContainer: {
    width: 80,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  statValueNormal: {
    color: colors.text.primary,
  },
  statValueBetter: {
    color: colors.semantic.success,
  },
  statProgressContainer: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  statLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statIconContainer: {
    marginRight: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.small,
    color: colors.text.primary,
    textAlign: 'center',
  },
  progressBarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarLeft: {
    flex: 1,
    marginRight: spacing.xs,
  },
  progressBarRight: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  comparisonProgressBar: {
    marginVertical: 0,
  },
});