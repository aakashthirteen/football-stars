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
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface PlayerRatingScreenProps {
  navigation: any;
  route: any;
}

interface Player {
  id: string;
  name: string;
  position: string;
  jerseyNumber?: number;
  role?: string;
}

interface Team {
  id: string;
  name: string;
  players: Player[];
}

export default function PlayerRatingScreen({ navigation, route }: PlayerRatingScreenProps) {
  const { matchId, teamId, teamName } = route.params || {};
  const { user } = useAuthStore();
  const [players, setPlayers] = useState<Player[]>([]);
  const [ratings, setRatings] = useState<{ [playerId: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);

  // Safe static array that should never be undefined
  const STAR_ARRAY = [1, 2, 3, 4, 5];

  useEffect(() => {
    loadTeamPlayers();
    loadExistingRatings();
  }, []);

  const loadExistingRatings = async () => {
    try {
      // This is called after players are loaded
    } catch (error) {
      console.error('Error loading existing ratings:', error);
    }
  };

  const loadRatingsForPlayers = async (playerList: Player[]) => {
    try {
      const existingRatings: { [playerId: string]: number } = {};
      
      // Load existing ratings for each player
      for (const player of playerList) {
        try {
          const response = await apiService.getPlayerRating(player.id, matchId);
          if (response.rating) {
            existingRatings[player.id] = response.rating;
          }
        } catch (error) {
          // Player might not have a rating yet, that's OK
          console.log(`No existing rating for player ${player.name}`);
        }
      }
      
      setRatings(existingRatings);
      console.log('✅ Loaded existing ratings:', existingRatings);
    } catch (error) {
      console.error('Error loading ratings for players:', error);
    }
  };

  const loadTeamPlayers = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading team players...', { teamId, matchId });
      
      if (teamId) {
        // Load specific team if teamId is provided
        try {
          console.log('📡 Calling getTeamById with teamId:', teamId);
          const response = await apiService.getTeamById(teamId);
          console.log('✅ Team response:', response);
          
          if (response.team) {
            setTeam(response.team);
            console.log('👥 Team players:', response.team.players);
            
            // Process players to extract player data from nested structure
            const processedPlayers = response.team.players?.map((teamPlayer: any) => {
              console.log('👤 Processing team player:', teamPlayer);
              return {
                id: teamPlayer.playerId || teamPlayer.id,
                name: teamPlayer.player?.name || teamPlayer.name || 'Unknown Player',
                position: teamPlayer.player?.position || teamPlayer.position || 'Unknown',
                jerseyNumber: teamPlayer.jerseyNumber,
                role: teamPlayer.role
              };
            }) || [];
            
            console.log('✅ Processed players:', processedPlayers);
            setPlayers(processedPlayers);
          }
        } catch (apiError) {
          console.log('❌ getTeamById failed, loading user teams instead:', apiError);
          await loadUserTeams();
        }
      } else {
        // Load user's teams if no specific teamId
        console.log('📡 No teamId provided, loading user teams');
        await loadUserTeams();
      }
      
      // Load existing ratings from AsyncStorage
      const savedRatings = await AsyncStorage.getItem(`ratings_${matchId}_${teamId || 'default'}`);
      if (savedRatings) {
        setRatings(JSON.parse(savedRatings));
      }
    } catch (error) {
      console.error('❌ Error loading players:', error);
      // Fallback to mock data if everything fails
      console.log('🔄 Using fallback mock data');
      setPlayers([
        { id: '1', name: 'Player 1', position: 'GK' },
        { id: '2', name: 'Player 2', position: 'DEF' },
        { id: '3', name: 'Player 3', position: 'MID' },
        { id: '4', name: 'Player 4', position: 'FWD' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserTeams = async () => {
    try {
      console.log('📡 Calling getTeams for user teams');
      const response = await apiService.getTeams();
      console.log('✅ User teams response:', response);
      
      if (response.teams && response.teams.length > 0) {
        const firstTeam = response.teams[0];
        console.log('👥 First team:', firstTeam);
        setTeam(firstTeam);
        
        // Process players similar to above
        const processedPlayers = firstTeam.players?.map((teamPlayer: any) => {
          console.log('👤 Processing user team player:', teamPlayer);
          return {
            id: teamPlayer.playerId || teamPlayer.id,
            name: teamPlayer.player?.name || teamPlayer.name || 'Unknown Player',
            position: teamPlayer.player?.position || teamPlayer.position || 'Unknown',
            jerseyNumber: teamPlayer.jerseyNumber,
            role: teamPlayer.role
          };
        }) || [];
        
        console.log('✅ Processed user team players:', processedPlayers);
        setPlayers(processedPlayers);
        
        // Load existing ratings for these players
        await loadRatingsForPlayers(processedPlayers);
      } else {
        console.log('⚠️ No teams found for user');
      }
    } catch (error) {
      console.error('❌ Error loading user teams:', error);
      throw error;
    }
  };

  const handleRatingChange = async (playerId: string, rating: number) => {
    try {
      const newRatings = { ...ratings, [playerId]: rating };
      setRatings(newRatings);
      
      // Save to backend immediately
      await apiService.addPlayerRating(playerId, matchId, rating);
      console.log(`✅ Saved rating ${rating} for player ${playerId}`);
    } catch (error) {
      console.error('Error saving rating:', error);
      Alert.alert('Error', 'Failed to save rating. Please try again.');
    }
  };

  const handleSaveRatings = async () => {
    try {
      setIsSaving(true);
      
      // All ratings are already saved to backend individually
      // Just show success message
      const ratedPlayers = Object.keys(ratings).length;
      Alert.alert(
        'Ratings Saved!',
        `Successfully rated ${ratedPlayers} players for this match.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('❌ Error saving ratings:', error);
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
        <View style={styles.playerHeader}>
          <Text style={styles.playerName}>{player.name}</Text>
          {player.role && (
            <Text style={[styles.roleTag, player.role === 'CAPTAIN' && styles.captainTag]}>
              {player.role === 'CAPTAIN' ? 'C' : player.role === 'VICE_CAPTAIN' ? 'VC' : ''}
            </Text>
          )}
        </View>
        <View style={styles.playerDetails}>
          <Text style={styles.playerPosition}>{player.position}</Text>
          {player.jerseyNumber && (
            <Text style={styles.jerseyNumber}>#{player.jerseyNumber}</Text>
          )}
        </View>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Rating:</Text>
          {renderRatingStars(player.id)}
        </View>
      </View>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.teamHeader}>
          <Text style={styles.teamName}>{team?.name || teamName || 'Team'}</Text>
          <Text style={styles.instruction}>Rate each player's performance</Text>
          <Text style={styles.playerCount}>{players.length} Players</Text>
        </View>

        <View style={styles.playersContainer}>
          {players.length > 0 ? (
            players.map(renderPlayerCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No players found</Text>
              <Text style={styles.emptySubtext}>
                Make sure you're part of a team to rate players
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1F1F1F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00E676',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#00E676',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  teamHeader: {
    backgroundColor: '#1F1F1F',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  playerCount: {
    fontSize: 14,
    color: '#00E676',
    fontWeight: '500',
  },
  playersContainer: {
    padding: 16,
  },
  playerCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  roleTag: {
    backgroundColor: '#00E676',
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textAlign: 'center',
    minWidth: 24,
  },
  captainTag: {
    backgroundColor: '#FFC107',
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  playerPosition: {
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '500',
  },
  jerseyNumber: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  starText: {
    fontSize: 28,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});