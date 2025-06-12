import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { PlayerStats } from '../../types';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  navigation: any;
}

interface SkillVideo {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  date: string;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'videos' | 'achievements'>('stats');
  const [skillVideos, setSkillVideos] = useState<SkillVideo[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchStats();
    loadSkillVideos();
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await apiService.getCurrentUserStats();
      setStats(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load stats');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSkillVideos = () => {
    // Mock data for skill videos
    setSkillVideos([
      {
        id: '1',
        title: 'Amazing Bicycle Kick Goal',
        thumbnail: 'https://via.placeholder.com/150',
        views: 1234,
        likes: 89,
        date: '2 days ago',
      },
      {
        id: '2',
        title: 'Perfect Free Kick Technique',
        thumbnail: 'https://via.placeholder.com/150',
        views: 892,
        likes: 67,
        date: '5 days ago',
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const calculateGoalsPerGame = () => {
    if (!stats || stats.matchesPlayed === 0) return '0.0';
    return (stats.goals / stats.matchesPlayed).toFixed(1);
  };

  const calculateAssistsPerGame = () => {
    if (!stats || stats.matchesPlayed === 0) return '0.0';
    return (stats.assists / stats.matchesPlayed).toFixed(1);
  };

  const calculatePlayerRating = () => {
    if (!stats || stats.matchesPlayed === 0) return '0.0';
    const goalsWeight = 1.5;
    const assistsWeight = 1.2;
    const rating = ((stats.goals * goalsWeight + stats.assists * assistsWeight) / stats.matchesPlayed) * 2;
    return Math.min(10, rating).toFixed(1);
  };

  const getPlayerLevel = () => {
    if (!stats) return 'Rookie';
    const totalContributions = stats.goals + stats.assists;
    if (totalContributions >= 100) return 'Legend';
    if (totalContributions >= 50) return 'Elite';
    if (totalContributions >= 25) return 'Professional';
    if (totalContributions >= 10) return 'Rising Star';
    return 'Rookie';
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
          },
          style: 'destructive',
        },
      ],
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerBackground}>
        <View style={styles.headerPattern} />
      </View>
      
      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Debug')} style={styles.debugButton}>
              <Ionicons name="bug-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowShareModal(true)}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://via.placeholder.com/120' }}
              style={styles.avatar}
            />
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{getPlayerLevel()}</Text>
            </View>
          </View>
          
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          {stats && (
            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{stats.matchesPlayed}</Text>
                <Text style={styles.profileStatLabel}>Matches</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{calculatePlayerRating()}</Text>
                <Text style={styles.profileStatLabel}>Rating</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{stats.position}</Text>
                <Text style={styles.profileStatLabel}>Position</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabs}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
        onPress={() => setActiveTab('stats')}
      >
        <Ionicons 
          name="stats-chart" 
          size={20} 
          color={activeTab === 'stats' ? '#2E7D32' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
          Stats
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
        onPress={() => setActiveTab('videos')}
      >
        <Ionicons 
          name="videocam" 
          size={20} 
          color={activeTab === 'videos' ? '#2E7D32' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
          Skills
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
        onPress={() => setActiveTab('achievements')}
      >
        <Ionicons 
          name="trophy" 
          size={20} 
          color={activeTab === 'achievements' ? '#2E7D32' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
          Achievements
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatsContent = () => (
    <View style={styles.statsContent}>
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>⚽ Goal Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.goals || 0}</Text>
            <Text style={styles.statLabel}>Total Goals</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{calculateGoalsPerGame()}</Text>
            <Text style={styles.statLabel}>Goals/Game</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>🎯 Playmaking</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.assists || 0}</Text>
            <Text style={styles.statLabel}>Total Assists</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{calculateAssistsPerGame()}</Text>
            <Text style={styles.statLabel}>Assists/Game</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>🃏 Discipline</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#FFD700' }]}>
              {stats?.yellowCards || 0}
            </Text>
            <Text style={styles.statLabel}>Yellow Cards</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#dc3545' }]}>
              {stats?.redCards || 0}
            </Text>
            <Text style={styles.statLabel}>Red Cards</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.performanceCard}>
        <Text style={styles.cardTitle}>📊 Performance Overview</Text>
        <View style={styles.performanceMetrics}>
          <View style={styles.metricItem}>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: '75%', backgroundColor: '#4CAF50' }]} />
            </View>
            <Text style={styles.metricLabel}>Attack</Text>
          </View>
          <View style={styles.metricItem}>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: '60%', backgroundColor: '#2196F3' }]} />
            </View>
            <Text style={styles.metricLabel}>Defense</Text>
          </View>
          <View style={styles.metricItem}>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: '85%', backgroundColor: '#FF9800' }]} />
            </View>
            <Text style={styles.metricLabel}>Fitness</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderVideosContent = () => (
    <View style={styles.videosContent}>
      <TouchableOpacity style={styles.uploadVideoButton}>
        <Ionicons name="cloud-upload" size={24} color="#fff" />
        <Text style={styles.uploadVideoText}>Upload New Skill Video</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Your Skills Showcase</Text>
      
      {skillVideos.map((video) => (
        <TouchableOpacity key={video.id} style={styles.videoCard}>
          <Image source={{ uri: video.thumbnail }} style={styles.videoThumbnail} />
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle}>{video.title}</Text>
            <View style={styles.videoStats}>
              <Text style={styles.videoStat}>
                <Ionicons name="eye" size={14} color="#666" /> {video.views}
              </Text>
              <Text style={styles.videoStat}>
                <Ionicons name="heart" size={14} color="#ff4444" /> {video.likes}
              </Text>
              <Text style={styles.videoStat}>{video.date}</Text>
            </View>
          </View>
          <Ionicons name="play-circle" size={32} color="#2E7D32" />
        </TouchableOpacity>
      ))}
      
      {skillVideos.length === 0 && (
        <View style={styles.emptyVideos}>
          <Ionicons name="videocam-off" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No skill videos yet</Text>
          <Text style={styles.emptySubtext}>Show off your best moves!</Text>
        </View>
      )}
    </View>
  );

  const renderAchievementsContent = () => (
    <View style={styles.achievementsContent}>
      <View style={styles.achievementCard}>
        <View style={styles.achievementIcon}>
          <Ionicons name="football" size={32} color="#FFD700" />
        </View>
        <View style={styles.achievementInfo}>
          <Text style={styles.achievementTitle}>Goal Machine</Text>
          <Text style={styles.achievementDescription}>Score 50 goals</Text>
          <View style={styles.achievementProgress}>
            <View style={[styles.achievementProgressFill, { width: '46%' }]} />
          </View>
          <Text style={styles.achievementProgressText}>23/50</Text>
        </View>
      </View>
      
      <View style={styles.achievementCard}>
        <View style={styles.achievementIcon}>
          <Ionicons name="people" size={32} color="#4169E1" />
        </View>
        <View style={styles.achievementInfo}>
          <Text style={styles.achievementTitle}>Team Player</Text>
          <Text style={styles.achievementDescription}>Get 30 assists</Text>
          <View style={styles.achievementProgress}>
            <View style={[styles.achievementProgressFill, { width: '40%' }]} />
          </View>
          <Text style={styles.achievementProgressText}>12/30</Text>
        </View>
      </View>
      
      <View style={[styles.achievementCard, styles.achievementCompleted]}>
        <View style={styles.achievementIcon}>
          <Ionicons name="star" size={32} color="#2E7D32" />
        </View>
        <View style={styles.achievementInfo}>
          <Text style={styles.achievementTitle}>Rising Star</Text>
          <Text style={styles.achievementDescription}>Play 10 matches</Text>
          <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
        </View>
      </View>
    </View>
  );

  const renderShareModal = () => (
    <Modal
      visible={showShareModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowShareModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.shareModal}>
          <Text style={styles.shareModalTitle}>Share Your Profile</Text>
          
          <View style={styles.shareOptions}>
            <TouchableOpacity style={styles.shareOption}>
              <View style={[styles.shareIconContainer, { backgroundColor: '#1877F2' }]}>
                <Ionicons name="logo-facebook" size={24} color="#fff" />
              </View>
              <Text style={styles.shareOptionText}>Facebook</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareOption}>
              <View style={[styles.shareIconContainer, { backgroundColor: '#1DA1F2' }]}>
                <Ionicons name="logo-twitter" size={24} color="#fff" />
              </View>
              <Text style={styles.shareOptionText}>Twitter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareOption}>
              <View style={[styles.shareIconContainer, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              </View>
              <Text style={styles.shareOptionText}>WhatsApp</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareOption}>
              <View style={[styles.shareIconContainer, { backgroundColor: '#E4405F' }]}>
                <Ionicons name="logo-instagram" size={24} color="#fff" />
              </View>
              <Text style={styles.shareOptionText}>Instagram</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setShowShareModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeader()}
        {renderTabs()}
        
        {activeTab === 'stats' && renderStatsContent()}
        {activeTab === 'videos' && renderVideosContent()}
        {activeTab === 'achievements' && renderAchievementsContent()}
        
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#dc3545" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {renderShareModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    height: 320,
    backgroundColor: '#2E7D32',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#fff',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  profileStat: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  profileStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#2E7D32',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#2E7D32',
  },
  statsContent: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  performanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  performanceMetrics: {
    gap: 16,
  },
  metricItem: {
    marginBottom: 12,
  },
  metricBar: {
    height: 8,
    backgroundColor: '#f0f2f5',
    borderRadius: 4,
    marginBottom: 8,
  },
  metricFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  videosContent: {
    padding: 20,
  },
  uploadVideoButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  uploadVideoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  videoThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  videoStats: {
    flexDirection: 'row',
    gap: 12,
  },
  videoStat: {
    fontSize: 12,
    color: '#666',
  },
  emptyVideos: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  achievementsContent: {
    padding: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementCompleted: {
    backgroundColor: '#E8F5E9',
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  achievementProgress: {
    height: 6,
    backgroundColor: '#f0f2f5',
    borderRadius: 3,
    marginBottom: 4,
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 3,
  },
  achievementProgressText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  bottomActions: {
    padding: 20,
    paddingBottom: 40,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  shareModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  shareModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  shareOption: {
    alignItems: 'center',
  },
  shareIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shareOptionText: {
    fontSize: 12,
    color: '#666',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  debugButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 6,
    borderRadius: 15,
  },
});