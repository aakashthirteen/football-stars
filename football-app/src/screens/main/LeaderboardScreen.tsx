import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { PlayerStats } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { STADIUM_GRADIENTS, getPositionGradient } from '../../utils/gradients';

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
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadLeaderboard();
    // Beautiful entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
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
      const response = await apiService.getLeaderboard(activeType, 20);
      setLeaderboard(response?.leaderboard || []);
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const leaderboardTypes = [
    { value: 'goals', label: 'Goals', icon: 'football', gradient: ['#FF6B35', '#E55100'] },
    { value: 'assists', label: 'Assists', icon: 'hand-left', gradient: ['#4ECDC4', '#26A69A'] },
    { value: 'matches', label: 'Matches', icon: 'trophy', gradient: ['#45B7D1', '#1976D2'] },
    { value: 'minutes', label: 'Minutes', icon: 'time', gradient: ['#96CEB4', '#4CAF50'] },
  ];

  const getPositionGradient = (position: number) => {
    switch (position) {
      case 1: return ['#FFD700', '#FFA500', '#FF8C00']; // Gold
      case 2: return ['#C0C0C0', '#A9A9A9', '#808080']; // Silver
      case 3: return ['#CD7F32', '#B87333', '#A0522D']; // Bronze
      default: return ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)'];
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${position}`;
    }
  };

  const getStatValue = (player: PlayerStats) => {
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
      case 'GK': return STADIUM_GRADIENTS.GOALKEEPER;
      case 'DEF': return STADIUM_GRADIENTS.DEFENDER;
      case 'MID': return STADIUM_GRADIENTS.MIDFIELDER;
      case 'FWD': return STADIUM_GRADIENTS.FORWARD;
      default: return STADIUM_GRADIENTS.SCHEDULED_MATCH;
    }
  };

  const renderPlayer = ({ item, index }: { item: PlayerStats; index: number }) => {
    const position = index + 1;
    const isCurrentUser = item?.playerName === user?.name && user?.name;
    const isTopThree = position <= 3;

    return (
      <Animated.View
        style={[
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity activeOpacity={0.8}>
          <LinearGradient
            colors={isTopThree ? getPositionGradient(position) : STADIUM_GRADIENTS.CARD_DARK}
            style={[
              styles.playerCard,
              isCurrentUser && styles.currentUserCard,
              isTopThree && styles.topPlayerCard,
            ]}
          >
            {/* Glow effect for top players */}
            {isTopThree && (
              <LinearGradient
                colors={getPositionGradient(position)}
                style={styles.topPlayerGlow}
              />
            )}
            
            <View style={styles.playerRank}>
              <View style={[
                styles.rankContainer,
                isTopThree && styles.topRankContainer
              ]}>
                <Text style={[
                  styles.rankText,
                  isTopThree && styles.topRankText
                ]}>
                  {typeof getPositionIcon(position) === 'string' && getPositionIcon(position).includes('🥇') ? 
                    getPositionIcon(position) : position}
                </Text>
              </View>
            </View>

            <View style={styles.playerInfo}>
              <View style={styles.playerHeader}>
                <Text style={[
                  styles.playerName,
                  isTopThree && styles.topPlayerName
                ]} numberOfLines={1}>
                  {item?.playerName || 'Unknown Player'}
                </Text>
                
                {item?.position && (
                  <LinearGradient
                    colors={getPositionColor(item.position)}
                    style={styles.positionBadge}
                  >
                    <Text style={styles.positionText}>{item.position}</Text>
                  </LinearGradient>
                )}
              </View>
              
              {item?.teamName && (
                <Text style={[
                  styles.playerTeam,
                  isTopThree && styles.topPlayerTeam
                ]}>
                  {item.teamName}
                </Text>
              )}
              
              {/* Mini stats */}
              <View style={styles.miniStats}>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>{item?.goals || 0}</Text>
                  <Text style={styles.miniStatLabel}>Goals</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>{item?.assists || 0}</Text>
                  <Text style={styles.miniStatLabel}>Assists</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>{item?.matchesPlayed || 0}</Text>
                  <Text style={styles.miniStatLabel}>Matches</Text>
                </View>
              </View>
            </View>

            <View style={styles.playerStat}>
              <Text style={[
                styles.statValue,
                isTopThree && styles.topStatValue,
                { color: leaderboardTypes.find(t => t.value === activeType)?.gradient[0] }
              ]}>
                {getStatValue(item).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>
                {leaderboardTypes.find(t => t.value === activeType)?.label}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderTypeSelector = () => (
    <Animated.View 
      style={[
        styles.typeSelector,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {leaderboardTypes.map((type) => (
        <TouchableOpacity
          key={type.value}
          onPress={() => setActiveType(type.value as LeaderboardType)}
          activeOpacity={0.8}
        >
          {activeType === type.value ? (
            <LinearGradient
              colors={[...type.gradient, type.gradient[1] + '80']}
              style={styles.typeButton}
            >
              <Ionicons name={type.icon as any} size={20} color="#fff" />
              <Text style={styles.activeTypeLabel}>{type.label}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.typeButton, { borderColor: type.gradient[0] }]}>
              <Ionicons name={type.icon as any} size={20} color={type.gradient[0]} />
              <Text style={[styles.typeLabel, { color: type.gradient[0] }]}>{type.label}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Stadium Background Pattern */}
      <View style={styles.backgroundPattern} />
      
      {/* Header with Stadium Lighting Effect */}
      <LinearGradient
        colors={STADIUM_GRADIENTS.DARK_HEADER}
        style={styles.header}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <Text style={styles.headerSubtitle}>Top performers this season</Text>
          </View>
          
          <View style={styles.headerIcon}>
            <LinearGradient
              colors={STADIUM_GRADIENTS.GOLD_CAPTAIN}
              style={styles.trophyContainer}
            >
              <Ionicons name="trophy" size={24} color="#fff" />
            </LinearGradient>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#4CAF50"
            colors={['#4CAF50']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Type Selector */}
        {renderTypeSelector()}

        {/* Current Selection Info */}
        <Animated.View 
          style={[
            styles.selectionInfo,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={STADIUM_GRADIENTS.CARD_DARK}
            style={styles.selectionCard}
          >
            <Text style={styles.selectionTitle}>
              🏆 Top Players by {leaderboardTypes.find(t => t.value === activeType)?.label}
            </Text>
            <Text style={styles.selectionSubtitle}>
              See who's leading the competition
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Leaderboard */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.loadingCard}
            >
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </LinearGradient>
          </View>
        ) : leaderboard.length > 0 ? (
          <Animated.View 
            style={[
              styles.leaderboardContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <FlatList
              data={leaderboard}
              renderItem={renderPlayer}
              keyExtractor={(item, index) => `${item.playerId}-${index}`}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.leaderboardList}
            />
          </Animated.View>
        ) : (
          <Animated.View 
            style={[
              styles.emptyState,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.emptyContainer}
            >
              <Ionicons name="trophy-outline" size={80} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.emptyTitle}>No Data Yet</Text>
              <Text style={styles.emptySubtitle}>
                Play some matches to see leaderboard stats
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Footer Info */}
        <Animated.View 
          style={[
            styles.footerInfo,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.footerText}>
            🔥 Rankings are updated in real-time based on match results
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: '#0A0E27',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  headerIcon: {
    marginLeft: 16,
  },
  trophyContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    padding: 20,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  activeTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  selectionInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  selectionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  leaderboardContainer: {
    paddingHorizontal: 20,
  },
  leaderboardList: {
    paddingBottom: 20,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  topPlayerCard: {
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    shadowColor: 'rgba(255, 215, 0, 0.5)',
    shadowOpacity: 0.5,
  },
  topPlayerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.8,
  },
  currentUserCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  playerRank: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRankContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  topRankText: {
    fontSize: 18,
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
    flex: 1,
  },
  topPlayerName: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  positionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  playerTeam: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  topPlayerTeam: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  miniStats: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  miniStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  playerStat: {
    alignItems: 'center',
    minWidth: 60,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  topStatValue: {
    fontSize: 24,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  emptyState: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  footerInfo: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});