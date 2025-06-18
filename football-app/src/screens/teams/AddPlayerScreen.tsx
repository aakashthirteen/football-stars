import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

interface AddPlayerScreenProps {
  navigation: any;
  route: any;
}

interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  bio?: string;
  location?: string;
  phoneNumber?: string;
}

export default function AddPlayerScreen({ navigation, route }: AddPlayerScreenProps) {
  const { teamId, teamName } = route.params;
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'name' | 'phone'>('name');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [addingPlayer, setAddingPlayer] = useState<string | null>(null);

  useEffect(() => {
    loadAvailablePlayers();
  }, []);

  useEffect(() => {
    filterPlayers();
  }, [players, searchQuery, phoneSearchQuery, selectedPosition, searchMode]);

  const loadAvailablePlayers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAvailablePlayers(teamId);
      setPlayers(response.players || []);
    } catch (error: any) {
      console.error('Error loading players:', error);
      Alert.alert('Error', 'Failed to load available players');
    } finally {
      setIsLoading(false);
    }
  };

  const filterPlayers = () => {
    let filtered = players;

    if (searchMode === 'name' && searchQuery) {
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.location && player.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else if (searchMode === 'phone' && phoneSearchQuery) {
      filtered = filtered.filter(player =>
        player.phoneNumber && player.phoneNumber.includes(phoneSearchQuery)
      );
    }

    if (selectedPosition !== 'ALL') {
      filtered = filtered.filter(player => player.position === selectedPosition);
    }

    setFilteredPlayers(filtered);
  };

  const addPlayerToTeam = async (player: Player) => {
    try {
      setAddingPlayer(player.id);
      await apiService.addPlayerToTeam(teamId, player.id);
      
      Alert.alert(
        'Success',
        `${player.name} has been added to ${teamName}!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error adding player:', error);
      Alert.alert('Error', error.message || 'Failed to add player to team');
    } finally {
      setAddingPlayer(null);
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return '#FF5722';
      case 'DEF': return '#2196F3';
      case 'MID': return '#4CAF50';
      case 'FWD': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const positions = ['ALL', 'GK', 'DEF', 'MID', 'FWD'];

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={styles.playerCard}>
      <View style={styles.playerInfo}>
        <View style={styles.playerHeader}>
          <Text style={styles.playerName}>{item.name}</Text>
          <View style={[styles.positionBadge, { backgroundColor: getPositionColor(item.position) }]}>
            <Text style={styles.positionText}>{item.position}</Text>
          </View>
        </View>
        
        {item.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        )}
        
        {item.phoneNumber && (
          <View style={styles.locationContainer}>
            <Ionicons name="call-outline" size={14} color="#666" />
            <Text style={styles.locationText}>{item.phoneNumber}</Text>
          </View>
        )}
        
        {item.bio && (
          <Text style={styles.playerBio} numberOfLines={2}>{item.bio}</Text>
        )}
      </View>
      
      <TouchableOpacity
        style={[styles.addButton, addingPlayer === item.id && styles.addButtonDisabled]}
        onPress={() => addPlayerToTeam(item)}
        disabled={addingPlayer === item.id}
      >
        {addingPlayer === item.id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.addButtonText}>Add</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Add Players</Text>
          <Text style={styles.subtitle}>to {teamName}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchModeContainer}>
          <TouchableOpacity
            style={[
              styles.searchModeButton,
              searchMode === 'name' && styles.searchModeButtonActive
            ]}
            onPress={() => setSearchMode('name')}
          >
            <Ionicons name="person-outline" size={16} color={searchMode === 'name' ? '#fff' : '#666'} />
            <Text style={[
              styles.searchModeText,
              searchMode === 'name' && styles.searchModeTextActive
            ]}>Name/Location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.searchModeButton,
              searchMode === 'phone' && styles.searchModeButtonActive
            ]}
            onPress={() => setSearchMode('phone')}
          >
            <Ionicons name="call-outline" size={16} color={searchMode === 'phone' ? '#fff' : '#666'} />
            <Text style={[
              styles.searchModeText,
              searchMode === 'phone' && styles.searchModeTextActive
            ]}>Phone Number</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchInputContainer}>
          <Ionicons name={searchMode === 'phone' ? 'call' : 'search'} size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder={searchMode === 'phone' ? 'Search by phone number...' : 'Search players by name or location...'}
            value={searchMode === 'phone' ? phoneSearchQuery : searchQuery}
            onChangeText={searchMode === 'phone' ? setPhoneSearchQuery : setSearchQuery}
            keyboardType={searchMode === 'phone' ? 'phone-pad' : 'default'}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          data={positions}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedPosition === item && styles.filterButtonActive
              ]}
              onPress={() => setSelectedPosition(item)}
            >
              <Text style={[
                styles.filterText,
                selectedPosition === item && styles.filterTextActive
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading players...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlayers}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.playersList}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={80} color="#ddd" />
              <Text style={styles.emptyText}>No players found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedPosition !== 'ALL' 
                  ? 'Try adjusting your search or filters'
                  : 'All available players are already in teams'
                }
              </Text>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#e8f5e8',
    marginTop: 4,
  },
  searchContainer: {
    padding: 20,
  },
  searchModeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  searchModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  searchModeButtonActive: {
    backgroundColor: '#2E7D32',
  },
  searchModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  searchModeTextActive: {
    color: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  playersList: {
    padding: 20,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerInfo: {
    flex: 1,
    marginRight: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  positionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  playerBio: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});