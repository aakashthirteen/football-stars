import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
  teamId: string;
}

interface Rating {
  playerId: string;
  rating: number;
}

export default function PlayerRatingScreen({ navigation, route }: PlayerRatingScreenProps) {
  const { matchId } = route.params;
  const { user } = useAuthStore();
  const [match, setMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);

  useEffect(() => {
    loadMatchAndUserData();
  }, []);

  const loadMatchAndUserData = async () => {
    try {
      setIsLoading(true);
      
      // Load match details
      const matchResponse = await apiService.getMatchById(matchId);
      if (!matchResponse || !matchResponse.match) {
        throw new Error('Match not found');
      }
      
      setMatch(matchResponse.match);
      
      // Get current user ID (you might get this from auth context)
      const userData = await apiService.getCurrentUser();
      setCurrentUserId(userData.id);
      
      console.log('🔍 User data:', userData);
      console.log('🏠 Home team players:', matchResponse.match.homeTeam.players);
      console.log('🏃 Away team players:', matchResponse.match.awayTeam.players);
      
      // Determine which team the user belongs to
      // Check multiple possible ID fields since backend might use different naming
      const userInHomeTeam = matchResponse.match.homeTeam.players.some((p: any) => {
        const isMatch = p.id === userData.id || 
          p.userId === userData.id || 
          p.playerId === userData.id ||
          p.user?.id === userData.id;
        if (isMatch) console.log('✅ User found in home team:', p);
        return isMatch;
      });
      const userInAwayTeam = matchResponse.match.awayTeam.players.some((p: any) => {
        const isMatch = p.id === userData.id || 
          p.userId === userData.id || 
          p.playerId === userData.id ||
          p.user?.id === userData.id;
        if (isMatch) console.log('✅ User found in away team:', p);
        return isMatch;
      });
      
      if (userInHomeTeam) {
        console.log('✅ User found in home team, setting team ID:', matchResponse.match.homeTeam.id);
        setUserTeamId(matchResponse.match.homeTeam.id);
      } else if (userInAwayTeam) {
        console.log('✅ User found in away team, setting team ID:', matchResponse.match.awayTeam.id);
        setUserTeamId(matchResponse.match.awayTeam.id);
      } else {
        console.log('❌ User not found in either team');
        console.log('🔍 Available user ID variants:', {
          'userData.id': userData.id,
          'userData.user?.id': userData.user?.id,
          'userData.playerId': userData.playerId,
          'userData.userId': userData.userId
        });
        
        // Try with user.id from auth store as fallback
        if (user) {
          console.log('🔍 Auth user data:', user);
          const authUserInHomeTeam = matchResponse.match.homeTeam.players.some((p: any) => 
            p.id === user.id || 
            p.userId === user.id || 
            p.playerId === user.id ||
            p.user?.id === user.id ||
            p.name === user.name ||
            p.email === user.email
          );
          const authUserInAwayTeam = matchResponse.match.awayTeam.players.some((p: any) => 
            p.id === user.id || 
            p.userId === user.id || 
            p.playerId === user.id ||
            p.user?.id === user.id ||
            p.name === user.name ||
            p.email === user.email
          );
          
          if (authUserInHomeTeam) {
            console.log('✅ Auth user found in home team');
            setUserTeamId(matchResponse.match.homeTeam.id);
          } else if (authUserInAwayTeam) {
            console.log('✅ Auth user found in away team');
            setUserTeamId(matchResponse.match.awayTeam.id);
          }
        }
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load match data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRating = (playerId: string, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [playerId]: rating
    }));
  };

  const submitRatings = async () => {
    try {
      setIsSubmitting(true);
      
      console.log('📊 Submitting ratings:', {
        matchId,
        currentUserId,
        userFromAuth: user?.id,
        ratings,
        ratingsCount: Object.keys(ratings).length
      });
      
      // Convert ratings object to array format (don't include matchId - it's in the URL)
      const ratingsArray = Object.entries(ratings).map(([playerId, rating]) => ({
        playerId,
        rating
      }));
      
      console.log('📊 Ratings array to submit:', ratingsArray);
      
      // Submit ratings to API
      const response = await apiService.submitPlayerRatings(matchId, ratingsArray);
      console.log('✅ Ratings submission response:', response);
      
      Alert.alert(
        'Success',
        'Player ratings submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('MatchOverview', { matchId })
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ Error submitting ratings:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response);
      Alert.alert('Error', `Failed to submit ratings: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPlayerRating = (player: Player, teamName: string) => {
    const rating = ratings[player.id] || 0;
    const isTeammate = player.teamId === userTeamId;
    
    return (
      <View key={player.id} style={styles.playerCard}>
        <View style={styles.playerInfo}>
          <View style={[styles.playerNumber, { backgroundColor: getPositionColor(player.position) }]}>
            <Text style={styles.playerNumberText}>{player.jerseyNumber || '-'}</Text>
          </View>
          <View style={styles.playerDetails}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerPosition}>{player.position} • {teamName}</Text>
          </View>
        </View>
        
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Rate Performance:</Text>
          <View style={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleRating(player.id, star)}
                disabled={!isTeammate && player.id !== currentUserId}
                style={[
                  styles.starButton,
                  (!isTeammate && player.id !== currentUserId) && styles.disabledStar
                ]}
              >
                <Ionicons
                  name={rating >= star ? 'star' : 'star-outline'}
                  size={28}
                  color={rating >= star ? '#FFD700' : '#ccc'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingValue}>{rating > 0 ? `${rating}.0` : '-'}</Text>
        </View>
        
        {!isTeammate && player.id !== currentUserId && (
          <Text style={styles.cannotRateText}>You can only rate teammates</Text>
        )}
      </View>
    );
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#0A0E27', '#1A1F3A']} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading match data...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Match not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get all players from both teams
  const allPlayers = [
    ...match.homeTeam.players.map((p: Player) => ({ ...p, teamId: match.homeTeam.id })),
    ...match.awayTeam.players.map((p: Player) => ({ ...p, teamId: match.awayTeam.id }))
  ];

  // Filter to show only teammates if user is in a team
  const playersToRate = userTeamId
    ? allPlayers.filter((p: Player) => p.teamId === userTeamId)
    : allPlayers;

  const canSubmit = Object.keys(ratings).length > 0;

  return (
    <LinearGradient colors={['#0A0E27', '#1A1F3A']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>Rate Players</Text>
          <Text style={styles.headerSubtitle}>Match Performance</Text>
        </View>
        
        <TouchableOpacity
          onPress={() => navigation.replace('MatchOverview', { matchId })}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Match Result */}
      <View style={styles.matchResult}>
        <Text style={styles.matchResultTitle}>Match Result</Text>
        <View style={styles.scoreDisplay}>
          <Text style={styles.teamName}>{match.homeTeam.name}</Text>
          <Text style={styles.score}>{match.homeScore || 0} - {match.awayScore || 0}</Text>
          <Text style={styles.teamName}>{match.awayTeam.name}</Text>
        </View>
      </View>

      {/* Rating Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Rate your teammates' performance in this match
        </Text>
      </View>

      {/* Players List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {userTeamId ? (
          <>
            <Text style={styles.sectionTitle}>Your Teammates</Text>
            {playersToRate.map((player) => 
              renderPlayerRating(
                player, 
                player.teamId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name
              )
            )}
          </>
        ) : (
          <View style={styles.noTeamMessage}>
            <Ionicons name="information-circle" size={48} color="#FFD700" />
            <Text style={styles.noTeamText}>
              You're not part of either team in this match
            </Text>
            <Text style={styles.noTeamSubtext}>
              You can only rate players if you participated in the match
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      {userTeamId && (
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={submitRatings}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Ratings</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0E27',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 2,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  matchResult: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  matchResultTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  scoreDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  teamName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  score: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
  },
  instructions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  instructionsText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  playerPosition: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  disabledStar: {
    opacity: 0.3,
  },
  ratingValue: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cannotRateText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  noTeamMessage: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noTeamText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  noTeamSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  submitContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(76, 175, 80, 0.5)',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});