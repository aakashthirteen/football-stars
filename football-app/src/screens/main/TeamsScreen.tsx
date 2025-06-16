import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '../../theme/colors';
import { FloatingActionButton } from '../../components/FloatingActionButton';

const { width } = Dimensions.get('window');

interface TeamsScreenProps {
  navigation: any;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  players: any[];
  createdBy: string;
}

export default function TeamsScreen({ navigation }: TeamsScreenProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'my' | 'all'>('my');
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      loadTeams();
      
      // Start entrance animations
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
    }, [selectedTab])
  );

  const handleTabChange = (tab: 'my' | 'all') => {
    setSelectedTab(tab);
    
    // Animate tab indicator
    Animated.spring(tabIndicatorAnim, {
      toValue: tab === 'my' ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const response = selectedTab === 'my' 
        ? await apiService.getTeams()
        : await apiService.getAllTeams();
      
      if (response?.teams) {
        setTeams(response.teams);
      } else {
        setTeams([]);
      }
    } catch (error: any) {
      console.error('Error loading teams:', error);
      Alert.alert('Error', 'Failed to load teams. Please try again.');
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeams();
    setRefreshing(false);
  };

  const getTeamGradient = (teamName: string) => {
    const gradients = [
      ['#1B5E20', '#2E7D32'],
      ['#0D47A1', '#1976D2'],
      ['#B71C1C', '#D32F2F'],
      ['#E65100', '#FF9800'],
      ['#4A148C', '#7B1FA2'],
    ];
    const index = teamName.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const TeamCard = ({ item, index }: { item: Team; index: number }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
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
          { marginBottom: 16 },
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <TouchableOpacity 
          onPress={() => navigation.navigate('TeamDetails', { teamId: item.id })}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={styles.teamCardContainer}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.teamCard}
          >
            {/* Glassmorphism backdrop */}
            <View style={styles.glassBackdrop} />
            
            <View style={styles.teamHeader}>
              <LinearGradient
                colors={getTeamGradient(item.name)}
                style={styles.teamIconContainer}
              >
                <Ionicons name="shield-checkmark" size={24} color="#fff" />
              </LinearGradient>
              
              <View style={styles.teamInfo}>
                <Text style={styles.teamName} numberOfLines={1}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.teamDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : (
                  <Text style={styles.teamDescriptionPlaceholder}>
                    No description available
                  </Text>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.moreButton}
                onPress={(e) => {
                  e.stopPropagation();
                  // Could show team options menu
                }}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#B0BEC5" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.teamStats}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="people" size={16} color="#4FC3F7" />
                </View>
                <View>
                  <Text style={styles.statValue}>{item.players?.length || 0}</Text>
                  <Text style={styles.statLabel}>Players</Text>
                </View>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="trophy" size={16} color="#FFD700" />
                </View>
                <View>
                  <Text style={styles.statValue}>
                    {item.players?.filter(p => p.role === 'CAPTAIN').length || 0}
                  </Text>
                  <Text style={styles.statLabel}>Captains</Text>
                </View>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="football" size={16} color="#81C784" />
                </View>
                <View>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Matches</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.teamFooter}>
              <View style={styles.badges}>
                {item.players?.some(p => p.role === 'CAPTAIN') && (
                  <View style={styles.captainBadge}>
                    <Ionicons name="star" size={10} color="#FFD700" />
                    <Text style={styles.badgeText}>Captain Set</Text>
                  </View>
                )}
                
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: item.players?.length > 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)' }
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: item.players?.length > 0 ? '#4CAF50' : '#9E9E9E' }
                  ]} />
                  <Text style={[
                    styles.badgeText,
                    { color: item.players?.length > 0 ? '#4CAF50' : '#9E9E9E' }
                  ]}>
                    {item.players?.length > 0 ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate('TeamDetails', { teamId: item.id });
                }}
              >
                <Text style={styles.actionButtonText}>View Team</Text>
                <Ionicons name="chevron-forward" size={16} color="#4FC3F7" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderTeam = ({ item, index }: { item: Team; index: number }) => {
    return <TeamCard item={item} index={index} />;
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
            <Text style={styles.headerTitle}>Teams</Text>
            <Text style={styles.headerSubtitle}>
              {teams.length} {teams.length === 1 ? 'team' : 'teams'} available
            </Text>
          </View>
        </LinearGradient>

        {/* Modern Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab]}
            onPress={() => handleTabChange('my')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, selectedTab === 'my' && styles.activeTabText]}>
              My Teams
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab]}
            onPress={() => handleTabChange('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
              All Teams
            </Text>
          </TouchableOpacity>
          
          {/* Animated Tab Indicator */}
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [{
                  translateX: tabIndicatorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, width / 2],
                  }),
                }],
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Teams List */}
      <FlatList
        data={teams}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, teams.length === 0 && styles.emptyContainer]}
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
              <View style={styles.emptyIconContainer}>
                <Ionicons name="shield-outline" size={80} color="rgba(255, 255, 255, 0.3)" />
              </View>
              
              {selectedTab === 'my' ? (
                <>
                  <Text style={styles.emptyText}>No teams yet</Text>
                  <Text style={styles.emptySubtext}>
                    Create your first team to organize matches,{'\n'}
                    track stats, and build your squad!
                  </Text>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('CreateTeam')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#4FC3F7', '#0288D1']}
                      style={styles.createTeamButton}
                    >
                      <Ionicons name="add-circle" size={24} color="#fff" />
                      <Text style={styles.createTeamButtonText}>Create Your First Team</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.emptyText}>No teams available</Text>
                  <Text style={styles.emptySubtext}>
                    No teams are currently visible.{'\n'}
                    Check back later for new teams to join!
                  </Text>
                </>
              )}
            </View>
          </View>
        )}
      />
      
      {/* Floating Action Button */}
      {selectedTab === 'my' && (
        <FloatingActionButton
          onPress={() => navigation.navigate('CreateTeam')}
          icon="add"
          style={{ bottom: 100 }}
        />
      )}
      
      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={['rgba(10, 14, 39, 0.9)', 'rgba(26, 31, 58, 0.9)']}
            style={styles.loadingContainer}
          >
            <ActivityIndicator size="large" color="#4FC3F7" />
            <Text style={styles.loadingText}>Loading teams...</Text>
          </LinearGradient>
        </View>
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
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
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
    width: (width - 48) / 2,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    zIndex: 0,
  },
  list: {
    padding: 20,
    paddingBottom: 120,
  },
  teamCardContainer: {},
  teamCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
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
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  teamIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  teamDescriptionPlaceholder: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
  teamStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
  },
  statIcon: {
    marginRight: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  teamFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  captainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFD700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4FC3F7',
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
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createTeamButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingContainer: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
  },
});