import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

const { width } = Dimensions.get('window');

interface PlayerDiscoveryScreenProps {
  navigation: any;
}

interface Player {
  id: string;
  name: string;
  position: string;
  location: string;
  rating: number;
  skills: string[];
  goals: number;
  assists: number;
  matchesPlayed: number;
  profileImage?: string;
  verified?: boolean;
  lookingForTeam?: boolean;
}

const POSITIONS = ['All', 'GK', 'DEF', 'MID', 'FWD'];
const SKILLS = ['Pace', 'Dribbling', 'Shooting', 'Passing', 'Defending', 'Physical'];

export default function PlayerDiscoveryScreen({ navigation }: PlayerDiscoveryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    loadPlayers();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    filterPlayers();
  }, [searchQuery, selectedPosition, players]);

  const loadPlayers = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockPlayers: Player[] = [
        {
          id: '1',
          name: 'Cristiano Silva',
          position: 'FWD',
          location: 'Bengaluru, India',
          rating: 8.5,
          skills: ['Pace', 'Shooting', 'Dribbling'],
          goals: 23,
          assists: 12,
          matchesPlayed: 30,
          verified: true,
          lookingForTeam: true,
        },
        {
          id: '2',
          name: 'Maria Santos',
          position: 'MID',
          location: 'Mumbai, India',
          rating: 8.2,
          skills: ['Passing', 'Dribbling', 'Physical'],
          goals: 8,
          assists: 18,
          matchesPlayed: 28,
          verified: true,
          lookingForTeam: false,
        },
        {
          id: '3',
          name: 'Rahul Kumar',
          position: 'DEF',
          location: 'Delhi, India',
          rating: 7.8,
          skills: ['Defending', 'Physical', 'Passing'],
          goals: 2,
          assists: 5,
          matchesPlayed: 25,
          verified: false,
          lookingForTeam: true,
        },
        {
          id: '4',
          name: 'Ahmed Khan',
          position: 'GK',
          location: 'Bengaluru, India',
          rating: 8.0,
          skills: ['Reflexes', 'Distribution', 'Leadership'],
          goals: 0,
          assists: 0,
          matchesPlayed: 22,
          verified: true,
          lookingForTeam: false,
        },
      ];
      
      setPlayers(mockPlayers);
      setFilteredPlayers(mockPlayers);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPlayers = () => {
    let filtered = players;
    
    if (selectedPosition !== 'All') {
      filtered = filtered.filter(p => p.position === selectedPosition);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredPlayers(filtered);
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return '#9C27B0';
      case 'DEF': return '#2196F3';
      case 'MID': return '#4CAF50';
      case 'FWD': return '#FF9800';
      default: return '#666';
    }
  };

  const handlePlayerPress = (player: Player) => {
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  };

  const handleConnect = async (playerId: string) => {
    // Add connection logic here
    alert('Connection request sent!');
    setShowPlayerModal(false);
  };

  const renderPlayerCard = ({ item }: { item: Player }) => (
    <TouchableOpacity 
      style={styles.playerCard}
      onPress={() => handlePlayerPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.playerHeader}>
        <View style={styles.playerAvatar}>
          <Text style={styles.avatarText}>
            {item.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.playerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.playerName}>{item.name}</Text>
            {item.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#4169E1" />
            )}
          </View>
          <Text style={styles.playerLocation}>
            <Ionicons name="location" size={12} color="#666" /> {item.location}
          </Text>
          <View style={styles.playerTags}>
            <View style={[styles.positionTag, { backgroundColor: getPositionColor(item.position) }]}>
              <Text style={styles.positionText}>{item.position}</Text>
            </View>
            {item.lookingForTeam && (
              <View style={styles.lookingTag}>
                <Text style={styles.lookingText}>Looking for team</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Ionicons name="star" size={16} color="#FFD700" />
        </View>
      </View>
      
      <View style={styles.playerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.goals}</Text>
          <Text style={styles.statLabel}>Goals</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.assists}</Text>
          <Text style={styles.statLabel}>Assists</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.matchesPlayed}</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
      </View>
      
      <View style={styles.skillsRow}>
        {item.skills.slice(0, 3).map((skill, index) => (
          <View key={index} style={styles.skillBadge}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderPlayerModal = () => (
    <Modal
      visible={showPlayerModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowPlayerModal(false)}
    >
      {selectedPlayer && (
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPlayerModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Player Profile</Text>
            <TouchableOpacity>
              <Ionicons name="share-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalPlayerHeader}>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>
                  {selectedPlayer.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <Text style={styles.modalPlayerName}>{selectedPlayer.name}</Text>
              <View style={styles.modalPlayerMeta}>
                <Text style={styles.modalPosition}>{selectedPlayer.position}</Text>
                <Text style={styles.modalLocation}>
                  <Ionicons name="location" size={14} color="#666" /> {selectedPlayer.location}
                </Text>
              </View>
              {selectedPlayer.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.verifiedText}>Verified Player</Text>
                </View>
              )}
            </View>
            
            <View style={styles.modalStatsSection}>
              <Text style={styles.sectionTitle}>Performance Stats</Text>
              <View style={styles.modalStatsGrid}>
                <View style={styles.modalStatCard}>
                  <Text style={styles.modalStatValue}>{selectedPlayer.goals}</Text>
                  <Text style={styles.modalStatLabel}>Goals</Text>
                </View>
                <View style={styles.modalStatCard}>
                  <Text style={styles.modalStatValue}>{selectedPlayer.assists}</Text>
                  <Text style={styles.modalStatLabel}>Assists</Text>
                </View>
                <View style={styles.modalStatCard}>
                  <Text style={styles.modalStatValue}>{selectedPlayer.matchesPlayed}</Text>
                  <Text style={styles.modalStatLabel}>Matches</Text>
                </View>
                <View style={styles.modalStatCard}>
                  <Text style={styles.modalStatValue}>{selectedPlayer.rating}</Text>
                  <Text style={styles.modalStatLabel}>Rating</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.modalSkillsSection}>
              <Text style={styles.sectionTitle}>Key Skills</Text>
              <View style={styles.modalSkillsGrid}>
                {selectedPlayer.skills.map((skill, index) => (
                  <View key={index} style={styles.modalSkillItem}>
                    <View style={styles.skillIconContainer}>
                      <Ionicons name="football" size={20} color="#2E7D32" />
                    </View>
                    <Text style={styles.modalSkillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.connectButton}
                onPress={() => handleConnect(selectedPlayer.id)}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.messageButton}>
                <Ionicons name="chatbubble-outline" size={20} color="#2E7D32" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
            
            {selectedPlayer.lookingForTeam && (
              <View style={styles.lookingForTeamBanner}>
                <Ionicons name="information-circle" size={20} color="#FF9800" />
                <Text style={styles.lookingForTeamText}>
                  This player is actively looking for a team
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover Players</Text>
        <TouchableOpacity>
          <Ionicons name="filter" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search players, skills, location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.positionFilter}
      >
        {POSITIONS.map((position) => (
          <TouchableOpacity
            key={position}
            style={[
              styles.positionChip,
              selectedPosition === position && styles.positionChipActive
            ]}
            onPress={() => setSelectedPosition(position)}
          >
            <Text style={[
              styles.positionChipText,
              selectedPosition === position && styles.positionChipTextActive
            ]}>
              {position}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <FlatList
          data={filteredPlayers}
          renderItem={renderPlayerCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.playersList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No players found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          }
        />
      </Animated.View>
      
      {renderPlayerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  positionFilter: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    maxHeight: 60,
  },
  positionChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    marginRight: 10,
  },
  positionChipActive: {
    backgroundColor: '#2E7D32',
  },
  positionChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  positionChipTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  playersList: {
    padding: 20,
    paddingBottom: 100,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  playerLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  playerTags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  positionTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  positionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  lookingTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
  },
  lookingText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FF9800',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f2f5',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  skillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2E7D32',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 100,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalPlayerHeader: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalAvatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalPlayerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalPlayerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalPosition: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E7D32',
  },
  modalLocation: {
    fontSize: 14,
    color: '#666',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4169E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  modalStatsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  modalStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f0f2f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  modalSkillsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalSkillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalSkillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  skillIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSkillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E7D32',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E7D32',
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  lookingForTeamBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  lookingForTeamText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
  },
});