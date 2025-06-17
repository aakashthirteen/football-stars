import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { PlayerStats } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Professional Components
import {
  ProfessionalButton,
} from '../../components/professional';

// Import DesignSystem directly
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows, gradients } = DesignSystem;
const { width } = Dimensions.get('window');

interface LeaderboardScreenProps {
  navigation?: any;
}

type LeaderboardType = 'goals' | 'assists' | 'matches' | 'minutes';

export default function LeaderboardScreen({ navigation }: LeaderboardScreenProps) {
  const { user } = useAuthStore();
  const [activeType, setActiveType] = useState<LeaderboardType>('goals');
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadLeaderboard();
    
    // Beautiful entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeType]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLeaderboard(activeType);
      
      if (response?.leaderboard) {
        // Fix string concatenation bugs by ensuring numeric values
        const fixedLeaderboard = response.leaderboard.map((player: any) => ({
          ...player,
          goals: parseInt(player.goals) || 0,
          assists: parseInt(player.assists) || 0,
          matchesPlayed: parseInt(player.matchesPlayed) || 0,
          minutesPlayed: parseInt(player.minutesPlayed) || 0,
          yellowCards: parseInt(player.yellowCards) || 0,
          redCards: parseInt(player.redCards) || 0,
        }));
        setLeaderboard(fixedLeaderboard);
      } else {
        setLeaderboard([]);
      }
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const handleTypeChange = (type: LeaderboardType) => {
    setActiveType(type);
    
    // Animate tab indicator
    const typeIndex = ['goals', 'assists', 'matches', 'minutes'].indexOf(type);
    Animated.spring(tabIndicatorAnim, {
      toValue: typeIndex,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const getStatValue = (player: PlayerStats): number => {
    if (!player) return 0;
    switch (activeType) {
      case 'goals': return player.goals || 0;
      case 'assists': return player.assists || 0;
      case 'matches': return player.matchesPlayed || 0;
      case 'minutes': return Math.round(player.minutesPlayed || 0);
      default: return 0;
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return colors.status.error;
      case 'DEF': return colors.accent.blue;
      case 'MID': return colors.primary.main;
      case 'FWD': return colors.accent.orange;
      default: return colors.text.secondary;
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1: return { name: 'trophy', color: '#FFD700' };
      case 2: return { name: 'medal', color: '#C0C0C0' };
      case 3: return { name: 'medal', color: '#CD7F32' };
      default: return null;
    }
  };

  const PlayerCard = ({ item, index }: { item: PlayerStats; index: number }) => {
    const position = index + 1;
    const isCurrentUser = item?.playerName === user?.name && user?.name;
    const isTopThree = position <= 3;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const medal = getMedalIcon(position);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 7,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 7,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.playerCardWrapper,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={[
            styles.playerCard,
            isCurrentUser && styles.currentUserCard,
            isTopThree && styles.topPlayerCard,
          ]}
        >
          {/* Position Badge */}
          <View style={[
            styles.positionBadge,
            isTopThree && styles.topPositionBadge,
            isTopThree && { backgroundColor: medal?.color + '20' }
          ]}>
            {medal ? (
              <Ionicons name={medal.name as any} size={24} color={medal.color} />
            ) : (
              <Text style={styles.positionText}>{position}</Text>
            )}
          </View>

          {/* Player Info */}
          <View style={styles.playerInfo}>
            <View style={styles.playerHeader}>
              <View style={[styles.playerAvatar, { backgroundColor: getPositionColor(item.position || 'MID') }]}>
                <Text style={styles.playerInitials}>
                  {item.playerName?.substring(0, 2).toUpperCase() || 'PL'}
                </Text>
              </View>
              
              <View style={styles.playerDetails}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {item.playerName || 'Unknown Player'}
                </Text>
                <View style={styles.playerMeta}>
                  <View style={[styles.positionTag, { backgroundColor: getPositionColor(item.position || 'MID') + '20' }]}>
                    <Text style={[styles.positionTagText, { color: getPositionColor(item.position || 'MID') }]}>
                      {item.position || 'MID'}
                    </Text>
                  </View>
                  <Text style={styles.matchesText}>
                    {item.matchesPlayed || 0} matches
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Main Stat */}
          <View style={styles.mainStatContainer}>
            <Text style={[styles.mainStatValue, isTopThree && styles.topStatValue]}>
              {getStatValue(item)}
            </Text>
            <Text style={styles.mainStatLabel}>
              {activeType === 'minutes' ? 'mins' : activeType}
            </Text>
          </View>

          {/* Current User Indicator */}
          {isCurrentUser && (
            <View style={styles.currentUserIndicator}>
              <Ionicons name="person" size={12} color={colors.primary.main} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderPlayer = ({ item, index }: { item: PlayerStats; index: number }) => {
    return <PlayerCard item={item} index={index} />;
  };

  const getTabIcon = (type: LeaderboardType) => {
    switch (type) {
      case 'goals': return 'football';
      case 'assists': return 'hand-left';
      case 'matches': return 'trophy';
      case 'minutes': return 'time';
      default: return 'stats-chart';
    }
  };

  const renderTabs = () => {
    const tabs: LeaderboardType[] = ['goals', 'assists', 'matches', 'minutes'];
    
    return (
      <View style={styles.tabContainer}>
        {tabs.map((type, index) => (
          <TouchableOpacity
            key={type}
            style={styles.tab}
            onPress={() => handleTypeChange(type)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={getTabIcon(type) as any} 
              size={16} 
              color={activeType === type ? '#FFFFFF' : colors.text.secondary} 
            />
            <Text style={[
              styles.tabText, 
              activeType === type && styles.activeTabText
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Animated Tab Indicator */}
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              transform: [{
                translateX: tabIndicatorAnim.interpolate({
                  inputRange: [0, 1, 2, 3],
                  outputRange: [0, (width - 40 - 8) / 4, ((width - 40 - 8) / 4) * 2, ((width - 40 - 8) / 4) * 3],
                }),
              }],
            },
          ]}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Modern Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={gradients.primary}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <Text style={styles.headerSubtitle}>
              Top {leaderboard.length} players competing
            </Text>
          </View>
        </LinearGradient>

        {/* Modern Tabs */}
        {renderTabs()}
      </Animated.View>

      {/* Leaderboard List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderPlayer}
          keyExtractor={(item, index) => `${item.playerId || index}`}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={colors.primary.main}
              colors={[colors.primary.main]}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={80} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>No stats yet</Text>
                <Text style={styles.emptySubtext}>
                  Player statistics will appear here{'\n'}
                  after matches are played!
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    ...shadows.lg,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.screenPadding,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xxs,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxs,
    zIndex: 1,
  },
  tabText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabIndicator: {
    position: 'absolute',
    top: spacing.xxs,
    left: spacing.xxs,
    width: (width - 40 - 8) / 4,
    height: 40,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    zIndex: 0,
  },
  list: {
    padding: spacing.screenPadding,
    paddingBottom: 100,
  },
  playerCardWrapper: {
    marginBottom: spacing.sm,
  },
  playerCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  topPlayerCard: {
    borderWidth: 1,
    borderColor: '#FFD700' + '30',
  },
  currentUserCard: {
    backgroundColor: colors.primary.main + '10',
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
  },
  positionBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  topPositionBadge: {
    backgroundColor: 'transparent',
  },
  positionText: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  playerInitials: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  positionTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.badge,
  },
  positionTagText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
  },
  matchesText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
  },
  mainStatContainer: {
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  mainStatValue: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  topStatValue: {
    color: '#FFD700',
  },
  mainStatLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
    textTransform: 'uppercase',
  },
  currentUserIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary.main + '20',
    borderRadius: borderRadius.badge,
    padding: spacing.xxs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  loadingText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyState: {
    flex: 1,
    paddingTop: spacing.xxxl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.screenPadding,
  },
  emptyText: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});