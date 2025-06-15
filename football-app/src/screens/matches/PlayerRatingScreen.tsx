import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients } from '../../theme/colors';
import { GlobalStyles, Spacing, BorderRadius } from '../../theme/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

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
  const { matchId, teamId, teamName } = route.params;
  const [players, setPlayers] = useState<Player[]>([]);
  const [ratings, setRatings] = useState<{ [playerId: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  useEffect(() => {
    loadTeamPlayers();
    animateEntrance();
  }, []);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadTeamPlayers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTeamById(teamId);
      
      if (response.team && response.team.players) {
        const transformedPlayers = response.team.players.map((tp: any) => ({
          id: tp.player_id || tp.playerId || tp.id || tp.user?.id,
          name: tp.player?.name || tp.player_name || tp.name || tp.user?.name || 'Unknown Player',
          position: tp.player?.position || tp.position || tp.user?.position || 'MID',
          jerseyNumber: tp.jersey_number || tp.jerseyNumber,
        }));
        
        setPlayers(transformedPlayers);
        
        // Initialize animations for each player
        transformedPlayers.forEach((player: Player) => {
          if (!scaleAnims[player.id]) {
            scaleAnims[player.id] = new Animated.Value(1);
          }
        });
        
        // Load existing ratings from AsyncStorage
        const storedRatings = await AsyncStorage.getItem(`match_ratings_${matchId}_${teamId}`);
        if (storedRatings) {
          setRatings(JSON.parse(storedRatings));
        } else {
          // Initialize with default ratings
          const initialRatings: { [key: string]: number } = {};
          transformedPlayers.forEach((player: Player) => {
            initialRatings[player.id] = 0; // Start with 0 (unrated)
          });
          setRatings(initialRatings);
        }
      }
    } catch (error) {
      console.error('Error loading team players:', error);
      Alert.alert('Error', 'Failed to load team players');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = (playerId: string, rating: number) => {
    // Animate the selection
    Animated.sequence([
      Animated.timing(scaleAnims[playerId], {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[playerId], {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    setRatings(prev => ({
      ...prev,
      [playerId]: rating,
    }));
    
    setSelectedPlayer(playerId);
    setTimeout(() => setSelectedPlayer(null), 500);
  };

  const saveRatings = async () => {
    try {
      setIsSaving(true);
      
      // Save to AsyncStorage for now
      await AsyncStorage.setItem(
        `match_ratings_${matchId}_${teamId}`,
        JSON.stringify(ratings)
      );
      
      // Update match with ratings (stored locally)
      const matchKey = `match_ratings_all_${matchId}`;
      const existingRatings = await AsyncStorage.getItem(matchKey);
      const allRatings = existingRatings ? JSON.parse(existingRatings) : {};
      
      // Add current team's ratings
      Object.entries(ratings).forEach(([playerId, rating]) => {
        if (!allRatings[playerId]) {
          allRatings[playerId] = [];
        }
        allRatings[playerId].push(rating);
      });
      
      await AsyncStorage.setItem(matchKey, JSON.stringify(allRatings));
      
      Alert.alert(
        'Success',
        'Player ratings saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('MatchSummary', { matchId });
            },
          },
        ]
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
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRatingChange(playerId, star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Animated.View
              style={{
                transform: [{
                  scale: selectedPlayer === playerId && star <= currentRating ? 1.2 : 1,
                }],
              }}
            >
              <Ionicons
                name={star <= currentRating ? 'star' : 'star-outline'}
                size={32}
                color={star <= currentRating ? Colors.secondary.main : Colors.text.tertiary}
              />
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPlayer = ({ item, index }: { item: Player; index: number }) => {
    const positionColor = getPositionColor(item.position);
    const isRated = ratings[item.id] && ratings[item.id] > 0;
    
    return (
      <Animated.View
        style={[
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnims[item.id] || 1 },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={isRated ? [Colors.background.card, Colors.background.elevated] : Gradients.card}
          style={[
            styles.playerCard,
            isRated && styles.playerCardRated,
            selectedPlayer === item.id && styles.playerCardSelected,
          ]}
        >
          <View style={styles.playerHeader}>
            <View style={styles.playerInfo}>
              <LinearGradient
                colors={[positionColor, Colors.primary.main]}
                style={styles.jerseyBadge}
              >
                <Text style={styles.jerseyNumber}>
                  {item.jerseyNumber || getPositionAbbr(item.position)}
                </Text>
              </LinearGradient>
              <View style={styles.playerDetails}>
                <Text style={styles.playerName}>{item.name}</Text>
                <View style={styles.positionBadge}>
                  <Text style={[styles.playerPosition, { color: positionColor }]}>
                    {item.position}
                  </Text>
                </View>
              </View>
            </View>
            {isRated && (
              <View style={styles.ratingValue}>
                <Text style={styles.ratingNumber}>{ratings[item.id]}</Text>
                <Ionicons name="star" size={16} color={Colors.secondary.main} />
              </View>
            )}
          </View>
          
          {renderRatingStars(item.id)}
          
          {!isRated && (
            <View style={styles.unratedBadge}>
              <Text style={styles.unratedText}>Tap to rate</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  const getPositionColor = (position: string): string => {
    switch (position) {
      case 'GK': return '#9C27B0';
      case 'DEF': return '#2196F3';
      case 'MID': return '#4CAF50';
      case 'FWD': return '#FF9800';
      default: return Colors.primary.main;
    }
  };

  const getPositionAbbr = (position: string): string => {
    switch (position) {
      case 'GK': return 'GK';
      case 'DEF': return 'DF';
      case 'MID': return 'MF';
      case 'FWD': return 'FW';
      default: return position.substring(0, 2).toUpperCase();
    }
  };

  const canSave = () => {
    return players.every(player => ratings[player.id] && ratings[player.id] > 0);
  };

  const getRatedCount = () => {
    return players.filter(player => ratings[player.id] && ratings[player.id] > 0).length;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading players...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0E27', '#1A1F3A']}
        style={styles.backgroundGradient}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Rate Players</Text>
          <Text style={styles.headerSubtitle}>{teamName}</Text>
        </View>
        
        <View style={styles.headerStats}>
          <Text style={styles.headerStatsText}>
            {getRatedCount()}/{players.length}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={Gradients.primary}
            style={[
              styles.progressFill,
              { width: `${(getRatedCount() / players.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Instructions */}
      <Animated.View
        style={[
          styles.instructionsCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={Gradients.victory}
          style={styles.instructionsGradient}
        >
          <Ionicons name="star" size={24} color={Colors.text.primary} />
          <Text style={styles.instructionsText}>
            Rate each player's performance from 1 to 5 stars
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Players List */}
      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            !canSave() && styles.saveButtonDisabled,
          ]}
          onPress={saveRatings}
          disabled={!canSave() || isSaving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canSave() ? Gradients.primary : [Colors.background.elevated, Colors.background.card]}
            style={styles.saveButtonGradient}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.text.primary} />
            ) : (
              <>
                <Text style={styles.saveButtonText}>
                  {canSave() ? 'Save Ratings' : `Rate ${players.length - getRatedCount()} more players`}
                </Text>
                {canSave() && <Ionicons name="arrow-forward" size={20} color={Colors.text.primary} />}
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  headerStats: {
    backgroundColor: Colors.background.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  headerStatsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.light,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.background.card,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  instructionsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  playerCard: {
    borderRadius: BorderRadius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.light,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  playerCardRated: {
    borderColor: Colors.primary.main,
    borderWidth: 2,
  },
  playerCardSelected: {
    borderColor: Colors.secondary.main,
    borderWidth: 2,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jerseyBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  jerseyNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  positionBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  playerPosition: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.secondary.main,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  starButton: {
    padding: 4,
  },
  unratedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.teams.away,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  unratedText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 20,
  },
  saveButton: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary.glow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  saveButtonDisabled: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
});
