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
import { Colors, Gradients } from '../../theme/colors';

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
      case 'GK': return ['#FF6B6B', '#FF8E53'];
      case 'DEF': return ['#4ECDC4', '#44A08D'];
      case 'MID': return ['#45B7D1', '#96C93D'];
      case 'FWD': return ['#F093FB', '#F5576C'];
      default: return ['#4FC3F7', '#29B6F6'];
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1: return { name: 'trophy', color: '#FFD700' };
      case 2: return { name: 'medal', color: '#C0C0C0' };
      case 3: return { name: 'medal', color: '#CD7F32' };
      default: return { name: 'star', color: '#4FC3F7' };
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
          { marginBottom: 12 },
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <LinearGradient
            colors={isTopThree ? 
              ['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)'] : 
              ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
            }
            style={[
              styles.playerCard,
              isCurrentUser && styles.currentUserCard,
              isTopThree && styles.topPlayerCard,
            ]}
          >
            {/* Glassmorphism backdrop */}
            <View style={styles.glassBackdrop} />
            
            {/* Position Badge */}
            <View style={[
              styles.positionBadge,
              isTopThree && styles.topPositionBadge
            ]}>
              {isTopThree ? (
                <Ionicons name={medal.name as any} size={24} color={medal.color} />
              ) : (
                <Text style={styles.positionText}>#{position}</Text>
              )}
            </View>

            {/* Player Info */}
            <View style={styles.playerInfo}>
              <View style={styles.playerHeader}>
                <LinearGradient
                  colors={getPositionColor(item.position || 'MID')}
                  style={styles.playerAvatar}
                >
                  <Text style={styles.playerInitials}>
                    {item.playerName?.substring(0, 2).toUpperCase() || 'PL'}
                  </Text>
                </LinearGradient>
                
                <View style={styles.playerDetails}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {item.playerName || 'Unknown Player'}
                  </Text>
                  <View style={styles.playerMeta}>
                    <View style={[styles.positionTag, { backgroundColor: `${getPositionColor(item.position || 'MID')[0]}20` }]}>
                      <Text style={[styles.positionTagText, { color: getPositionColor(item.position || 'MID')[0] }]}>
                        {item.position || 'MID'}
                      </Text>
                    </View>
                    <Text style={styles.matchesText}>
                      {item.matchesPlayed || 0} matches
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{getStatValue(item)}</Text>
                  <Text style={styles.statLabel}>
                    {activeType === 'minutes' ? 'mins' : activeType}
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{item.goals || 0}</Text>
                  <Text style={styles.statLabel}>goals</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{item.assists || 0}</Text>
                  <Text style={styles.statLabel}>assists</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {((item.goals || 0) + (item.assists || 0)) / Math.max(item.matchesPlayed || 1, 1) * 100 / 100}
                  </Text>
                  <Text style={styles.statLabel}>avg</Text>
                </View>
              </View>
            </View>

            {/* Current User Indicator */}
            {isCurrentUser && (
              <View style={styles.currentUserIndicator}>
                <Ionicons name="person" size={16} color="#4FC3F7" />
              </View>
            )}
          </LinearGradient>
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
              color={activeType === type ? '#fff' : 'rgba(255, 255, 255, 0.6)'} 
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
                  outputRange: [0, width / 4, (width / 4) * 2, (width / 4) * 3],
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
          colors={Gradients.field}
          style={styles.headerGradient}
        >
          <StatusBar barStyle="light-content" />
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
          <ActivityIndicator size="large" color="#4FC3F7" />
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
              tintColor="#4FC3F7"
              colors={['#4FC3F7']}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={80} color="rgba(255, 255, 255, 0.3)" />
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
    backgroundColor: Colors.background.primary,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    zIndex: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeTabText: {
    color: '#fff',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: (width - 48) / 4,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    zIndex: 0,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  playerCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  topPlayerCard: {
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  currentUserCard: {
    borderColor: 'rgba(79, 195, 247, 0.5)',
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
  },
  glassBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  positionBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  topPositionBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  positionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerInitials: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  positionTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  positionTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  matchesText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4FC3F7',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  currentUserIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(79, 195, 247, 0.3)',
    borderRadius: 12,
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    paddingTop: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
});