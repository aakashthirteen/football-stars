import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user, logout } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [trendingMatches, setTrendingMatches] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    loadDashboardData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load player stats
      const stats = await apiService.getCurrentUserStats();
      setPlayerStats(stats);
      
      // Load recent matches (mock for now)
      setTrendingMatches([
        { id: '1', title: 'City Derby', viewers: '2.3k', live: true },
        { id: '2', title: 'League Final', viewers: '1.8k', live: false },
      ]);
      
      setUpcomingMatches([
        { id: '1', homeTeam: 'Your Team', awayTeam: 'Rivals FC', time: '2h' },
        { id: '2', homeTeam: 'United', awayTeam: 'City', time: '5h' },
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const renderPlayerCard = () => (
    <Animated.View style={[styles.playerCard, { opacity: fadeAnim }]}>
      <View style={styles.playerCardHeader}>
        <View style={styles.playerAvatar}>
          <Text style={styles.playerAvatarText}>
            {user?.name?.split(' ').map(n => n[0]).join('') || 'P'}
          </Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{user?.name}</Text>
          <View style={styles.playerBadges}>
            <View style={styles.badge}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.badgeText}>Rising Star</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {playerStats?.position || 'FWD'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="create-outline" size={20} color="#2E7D32" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{playerStats?.goals || 0}</Text>
          <Text style={styles.statLabel}>Goals</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{playerStats?.assists || 0}</Text>
          <Text style={styles.statLabel}>Assists</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{playerStats?.matchesPlayed || 0}</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {playerStats ? ((playerStats.goals + playerStats.assists) / Math.max(playerStats.matchesPlayed, 1)).toFixed(1) : '0.0'}
          </Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => navigation.navigate('SkillsUpload')}
      >
        <Ionicons name="videocam" size={20} color="#fff" />
        <Text style={styles.uploadButtonText}>Upload Skills Video</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity 
          style={[styles.actionCard, styles.liveMatchCard]}
          onPress={() => navigation.navigate('Matches')}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="football" size={28} color="#fff" />
          </View>
          <Text style={styles.actionTitle}>Live Match</Text>
          <Text style={styles.actionSubtitle}>Score now</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, styles.findPlayersCard]}
          onPress={() => navigation.navigate('PlayerDiscovery')}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="search" size={28} color="#fff" />
          </View>
          <Text style={styles.actionTitle}>Find Players</Text>
          <Text style={styles.actionSubtitle}>Build squad</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, styles.tournamentCard]}
          onPress={() => navigation.navigate('Tournaments')}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="trophy" size={28} color="#fff" />
          </View>
          <Text style={styles.actionTitle}>Tournaments</Text>
          <Text style={styles.actionSubtitle}>Join now</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, styles.trainingCard]}
          onPress={() => navigation.navigate('Training')}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="fitness" size={28} color="#fff" />
          </View>
          <Text style={styles.actionTitle}>Training</Text>
          <Text style={styles.actionSubtitle}>Improve skills</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderTrendingSection = () => (
    <View style={styles.trendingSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 Trending Matches</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Matches')}>
          <Text style={styles.seeAllText}>See all →</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {trendingMatches.map((match) => (
          <TouchableOpacity key={match.id} style={styles.trendingCard}>
            {match.live && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            <Image 
              source={{ uri: 'https://via.placeholder.com/200x120' }} 
              style={styles.trendingImage}
            />
            <View style={styles.trendingInfo}>
              <Text style={styles.trendingTitle}>{match.title}</Text>
              <Text style={styles.trendingViewers}>
                <Ionicons name="eye" size={12} color="#666" /> {match.viewers} watching
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderUpcomingMatches = () => (
    <View style={styles.upcomingSection}>
      <Text style={styles.sectionTitle}>📅 Upcoming Matches</Text>
      {upcomingMatches.map((match) => (
        <TouchableOpacity key={match.id} style={styles.upcomingCard}>
          <View style={styles.matchTeams}>
            <Text style={styles.teamName}>{match.homeTeam}</Text>
            <Text style={styles.vsText}>VS</Text>
            <Text style={styles.teamName}>{match.awayTeam}</Text>
          </View>
          <View style={styles.matchTime}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.timeText}>{match.time}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSkillOfTheDay = () => (
    <TouchableOpacity style={styles.skillCard}>
      <View style={styles.skillHeader}>
        <Text style={styles.skillTitle}>⭐ Skill of the Day</Text>
        <Ionicons name="play-circle" size={24} color="#2E7D32" />
      </View>
      <Text style={styles.skillName}>Ronaldo Chop</Text>
      <Text style={styles.skillDescription}>
        Master this move to leave defenders behind!
      </Text>
      <View style={styles.skillStats}>
        <Text style={styles.skillStat}>
          <Ionicons name="heart" size={14} color="#ff4444" /> 2.3k
        </Text>
        <Text style={styles.skillStat}>
          <Ionicons name="chatbubble" size={14} color="#666" /> 145
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>Welcome back, Champion! 👋</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <View style={styles.notificationIcon}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <View style={styles.notificationBadge} />
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.motivationalText}>
          "Every champion was once a contender who refused to give up"
        </Text>
      </View>

      {renderPlayerCard()}
      {renderQuickActions()}
      {renderTrendingSection()}
      {renderSkillOfTheDay()}
      {renderUpcomingMatches()}

      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => navigation.navigate('CreateMatch')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  motivationalText: {
    fontSize: 14,
    color: '#e8f5e8',
    fontStyle: 'italic',
  },
  playerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  playerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  playerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  editProfileButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  uploadButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    marginTop: 24,
    paddingLeft: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
    paddingRight: 24,
  },
  actionCard: {
    width: 100,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  liveMatchCard: {
    backgroundColor: '#ff4444',
  },
  findPlayersCard: {
    backgroundColor: '#4169E1',
  },
  tournamentCard: {
    backgroundColor: '#FFD700',
  },
  trainingCard: {
    backgroundColor: '#9C27B0',
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  trendingSection: {
    marginTop: 24,
    paddingLeft: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 24,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  trendingCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  liveIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  trendingImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e0e0e0',
  },
  trendingInfo: {
    padding: 12,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  trendingViewers: {
    fontSize: 12,
    color: '#666',
  },
  skillCard: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  skillName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  skillDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  skillStats: {
    flexDirection: 'row',
    gap: 16,
  },
  skillStat: {
    fontSize: 14,
    color: '#666',
  },
  upcomingSection: {
    marginTop: 24,
    paddingHorizontal: 24,
    marginBottom: 100,
  },
  upcomingCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  vsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  matchTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});