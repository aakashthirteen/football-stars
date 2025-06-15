import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PlayerRatingScreenProps {
  navigation: any;
  route: any;
}

interface Player {
  id: string;
  name: string;
  position: string;
  jerseyNumber?: number;
  rating?: number;
}

export default function PlayerRatingScreen({ navigation, route }: PlayerRatingScreenProps) {
  const { matchId, teamId, teamName } = route.params || {};
  const [players, setPlayers] = useState<Player[]>([]);
  const [ratings, setRatings] = useState<{ [playerId: string]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Safe static array that should never be undefined
  const STAR_ARRAY = [1, 2, 3, 4, 5];

  useEffect(() => {
    loadMockPlayers();
  }, []);

  const loadMockPlayers = async () => {
    try {
      setIsLoading(true);
      
      // Mock players data to avoid API issues
      const mockPlayers: Player[] = [
        { id: '1', name: 'Player 1', position: 'GK' },
        { id: '2', name: 'Player 2', position: 'DEF' },
        { id: '3', name: 'Player 3', position: 'MID' },
        { id: '4', name: 'Player 4', position: 'FWD' },
      ];
      
      setPlayers(mockPlayers);
      
      // Load existing ratings from AsyncStorage
      const savedRatings = await AsyncStorage.getItem(`ratings_${matchId}_${teamId}`);
      if (savedRatings) {
        setRatings(JSON.parse(savedRatings));
      }
    } catch (error) {
      console.error('Error loading players:', error);
      Alert.alert('Error', 'Failed to load players');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = async (playerId: string, rating: number) => {
    try {
      const newRatings = { ...ratings, [playerId]: rating };
      setRatings(newRatings);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(`ratings_${matchId}_${teamId}`, JSON.stringify(newRatings));
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  };

  const handleSaveRatings = async () => {
    try {
      setIsSaving(true);
      
      // For now, just save to AsyncStorage
      await AsyncStorage.setItem(`ratings_${matchId}_${teamId}`, JSON.stringify(ratings));
      
      Alert.alert(
        'Success',
        'Player ratings saved successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving ratings:', error);
      Alert.alert('Error', 'Failed to save ratings');
    } finally {
      setIsSaving(false);
    }
  };

  const renderRatingStars = (playerId: string) => {
    const currentRating = ratings[playerId] || 0;
    
    return (
      <View style={styles.starsContainer}>
        {STAR_ARRAY.map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRatingChange(playerId, star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.starText,
              { color: star <= currentRating ? '#FFC107' : '#666' }
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPlayerCard = (player: Player) => (
    <View key={player.id} style={styles.playerCard}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerPosition}>{player.position}</Text>
      </View>
      {renderRatingStars(player.id)}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading players...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Players</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveRatings}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.teamHeader}>
          <Text style={styles.teamName}>{teamName || 'Team'}</Text>
          <Text style={styles.instruction}>Rate each player's performance</Text>
        </View>

        <View style={styles.playersContainer}>
          {players.map(renderPlayerCard)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2E7D32',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  teamHeader: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 16,
    color: '#666',
  },
  playersContainer: {
    padding: 16,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  starText: {
    fontSize: 24,
  },
});