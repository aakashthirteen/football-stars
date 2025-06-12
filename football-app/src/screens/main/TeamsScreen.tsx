import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

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
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      loadTeams();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
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

  const renderTeam = ({ item, index }: { item: Team; index: number }) => (
    <Animated.View
      style={[
        styles.teamCardWrapper,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity 
        style={styles.teamCard}
        onPress={() => navigation.navigate('TeamDetails', { teamId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.teamBadge}>
          <Text style={styles.teamBadgeText}>
            {item.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
          </Text>
        </View>
        
        <View style={styles.teamContent}>
          <View style={styles.teamHeader}>
            <Text style={styles.teamName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.teamStats}>
              <Ionicons name="people" size={16} color="#666" />
              <Text style={styles.teamMembers}>{item.players.length}</Text>
            </View>
          </View>
          
          {item.description && (
            <Text style={styles.teamDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.teamFooter}>
            <View style={styles.captainInfo}>
              {item.players.find(p => p.role === 'CAPTAIN') && (
                <>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.captainText}>
                    {item.players.find(p => p.role === 'CAPTAIN')?.player?.name || 'Captain'}
                  </Text>
                </>
              )}
            </View>
            <View style={styles.viewDetailsButton}>
              <Text style={styles.viewDetails}>View</Text>
              <Ionicons name="arrow-forward" size={16} color="#2E7D32" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Teams</Text>
          <Text style={styles.subtitle}>
            {selectedTab === 'my' ? 'Manage your squads' : 'Discover teams to join'}
          </Text>
        </View>
        {selectedTab === 'my' && (
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateTeam')}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'my' && styles.activeTab]}
          onPress={() => handleTabChange('my')}
        >
          <Text style={[styles.tabText, selectedTab === 'my' && styles.activeTabText]}>
            My Teams
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
          onPress={() => handleTabChange('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
            All Teams
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={teams}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, teams.length === 0 && styles.emptyContainer]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={80} color="#ddd" />
            </View>
            {selectedTab === 'my' ? (
              <>
                <Text style={styles.emptyText}>No teams yet</Text>
                <Text style={styles.emptySubtext}>Create your first team to organize matches,{`\n`}track stats, and build your squad!</Text>
                <TouchableOpacity 
                  style={styles.createTeamButton}
                  onPress={() => navigation.navigate('CreateTeam')}
                >
                  <Ionicons name="add-circle" size={24} color="#fff" />
                  <Text style={styles.createTeamButtonText}>Create Your First Team</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>No teams available</Text>
                <Text style={styles.emptySubtext}>No teams are currently visible.{`\n`}Check back later for new teams to join!</Text>
              </>
            )}
          </View>
        )}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  createButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  list: {
    padding: 24,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  teamCardWrapper: {
    marginBottom: 16,
  },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  teamBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  teamBadgeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  teamContent: {
    flex: 1,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  teamStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  teamMembers: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  teamDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    marginBottom: 12,
  },
  teamFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  captainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  captainText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetails: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  createTeamButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f2f5',
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#2E7D32',
  },
});