import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { STADIUM_GRADIENTS } from '../../utils/gradients';

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

  useFocusEffect(
    React.useCallback(() => {
      loadTeams();
    }, [selectedTab])
  );

  const handleTabChange = (tab: 'my' | 'all') => {
    setSelectedTab(tab);
  };

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const response = selectedTab === 'my' 
        ? await apiService.getTeams()
        : await apiService.getAllTeams();
      setTeams(response.teams || []);
    } catch (error: any) {
      console.error('Error loading teams:', error);
      Alert.alert('Error', 'Failed to load teams. Please check your connection.');
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

  const renderTeam = ({ item, index }: { item: Team; index: number }) => {
    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('TeamDetails', { teamId: item.id })}
        activeOpacity={0.8}
        style={{ marginBottom: 16 }}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.teamCard}
        >
          <View style={styles.glowOverlay} />
          
          <View style={styles.teamHeader}>
            <LinearGradient
              colors={getTeamGradient(item.name)}
              style={styles.teamIconContainer}
            >
              <Ionicons name="shield" size={28} color="#fff" />
            </LinearGradient>
            
            <View style={styles.teamInfo}>
              <Text style={styles.teamName} numberOfLines={1}>{item.name}</Text>
              {item.description && (
                <Text style={styles.teamDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
            
            <View style={styles.teamStats}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={16} color="#4CAF50" />
                <Text style={styles.statText}>{item.players?.length || 0}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.teamFooter}>
            <View style={styles.badges}>
              {item.players?.some(p => p.role === 'CAPTAIN') && (
                <LinearGradient
                  colors={STADIUM_GRADIENTS.GOLD_CAPTAIN}
                  style={styles.badge}
                >
                  <Ionicons name="star" size={12} color="#fff" />
                  <Text style={styles.badgeText}>Captain</Text>
                </LinearGradient>
              )}
            </View>
            
            <LinearGradient
              colors={STADIUM_GRADIENTS.GREEN_SUCCESS}
              style={styles.viewButton}
            >
              <Text style={styles.viewButtonText}>View</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </LinearGradient>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={STADIUM_GRADIENTS.DARK_HEADER}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Teams</Text>
            <Text style={styles.subtitle}>
              {selectedTab === 'my' ? 'Manage your squads' : 'Discover teams to join'}
            </Text>
          </View>
          
          {selectedTab === 'my' && (
            <TouchableOpacity 
              onPress={() => navigation.navigate('CreateTeam')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={STADIUM_GRADIENTS.GREEN_PRIMARY}
                style={styles.createButton}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'my' && styles.activeTab]}
            onPress={() => handleTabChange('my')}
            activeOpacity={0.8}
          >
            {selectedTab === 'my' ? (
              <LinearGradient
                colors={STADIUM_GRADIENTS.GREEN_PRIMARY}
                style={styles.tabGradient}
              >
                <Ionicons name="people" size={16} color="#fff" />
                <Text style={styles.activeTabText}>My Teams</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabContent}>
                <Ionicons name="people-outline" size={16} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.tabText}>My Teams</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
            onPress={() => handleTabChange('all')}
            activeOpacity={0.8}
          >
            {selectedTab === 'all' ? (
              <LinearGradient
                colors={STADIUM_GRADIENTS.GREEN_PRIMARY}
                style={styles.tabGradient}
              >
                <Ionicons name="globe" size={16} color="#fff" />
                <Text style={styles.activeTabText}>All Teams</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabContent}>
                <Ionicons name="globe-outline" size={16} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.tabText}>All Teams</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

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
            tintColor="#4CAF50"
            colors={['#4CAF50']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={STADIUM_GRADIENTS.CARD_DARK}
              style={styles.emptyContainer}
            >
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
                      colors={['#4CAF50', '#2E7D32']}
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
            </LinearGradient>
          </View>
        )}
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={['rgba(10, 14, 39, 0.9)', 'rgba(26, 31, 58, 0.9)']}
            style={styles.loadingContainer}
          >
            <ActivityIndicator size="large" color="#4CAF50" />
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 4,
  },
  tab: {
    flex: 1,
  },
  activeTab: {
    // Handled by gradient
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 26,
    gap: 8,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  activeTabText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 20,
  },
  teamCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: 'rgba(76, 175, 80, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4CAF50',
    opacity: 0.6,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  teamStats: {
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginHorizontal: 20,
  },
  emptyState: {
    flex: 1,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createTeamButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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