import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MatchSummaryScreenProps {
  navigation: any;
  route: any;
}

interface PlayerRating {
  id: string;
  name: string;
  position: string;
  rating: number;
}

export default function MatchSummaryScreen({ navigation, route }: MatchSummaryScreenProps) {
  const { matchId, teamId, teamName, ratings, ratingsSummary } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);
  const [playerRatings, setPlayerRatings] = useState<PlayerRating[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);

  useEffect(() => {
    loadRatingsData();
  }, []);

  const loadRatingsData = async () => {
    try {
      setIsLoading(true);
      
      if (ratingsSummary?.players) {
        // Use passed ratings data
        setPlayerRatings(ratingsSummary.players);
        setAverageRating(ratingsSummary.averageRating || 0);
      } else if (matchId) {
        // Try to load from AsyncStorage
        const savedRatings = await AsyncStorage.getItem(`ratings_summary_${matchId}_${teamId || 'default'}`);
        if (savedRatings) {
          const summary = JSON.parse(savedRatings);
          setPlayerRatings(summary.players || []);
          setAverageRating(summary.averageRating || 0);
        }
      }
    } catch (error) {
      console.error('Error loading ratings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStarRating = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#4CAF50'; // Green
    if (rating >= 3) return '#FFC107'; // Gold
    if (rating >= 2) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const renderPlayerRating = (player: PlayerRating) => (
    <View key={player.id} style={styles.playerRatingCard}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerPosition}>{player.position}</Text>
      </View>
      <View style={styles.ratingSection}>
        <Text style={[styles.ratingStars, { color: getRatingColor(player.rating) }]}>
          {getStarRating(player.rating)}
        </Text>
        <Text style={styles.ratingNumber}>{player.rating}/5</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00E676" />
        <Text style={styles.loadingText}>Loading match summary...</Text>
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
        <Text style={styles.headerTitle}>Match Summary</Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.navigate('MatchesList')}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Match Info */}
        <View style={styles.matchInfo}>
          <Text style={styles.matchTitle}>Match Complete</Text>
          {teamName && <Text style={styles.teamName}>{teamName}</Text>}
          <Text style={styles.matchDate}>{new Date().toLocaleDateString()}</Text>
        </View>

        {/* Ratings Summary */}
        {playerRatings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Player Ratings</Text>
            
            <View style={styles.averageRatingCard}>
              <Text style={styles.averageLabel}>Team Average</Text>
              <Text style={[styles.averageRating, { color: getRatingColor(Math.round(averageRating)) }]}>
                {averageRating.toFixed(1)}/5
              </Text>
              <Text style={[styles.averageStars, { color: getRatingColor(Math.round(averageRating)) }]}>
                {getStarRating(Math.round(averageRating))}
              </Text>
            </View>

            <View style={styles.playerRatings}>
              {playerRatings
                .sort((a, b) => b.rating - a.rating) // Sort by highest rating first
                .map(renderPlayerRating)}
            </View>
          </View>
        )}

        {/* Match Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{playerRatings.length}</Text>
              <Text style={styles.statLabel}>Players Rated</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {playerRatings.filter(p => p.rating >= 4).length}
              </Text>
              <Text style={styles.statLabel}>Top Performers</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {playerRatings.length > 0 ? Math.max(...playerRatings.map(p => p.rating)) : 0}
              </Text>
              <Text style={styles.statLabel}>Highest Rating</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('MatchesList')}
          >
            <Text style={styles.actionButtonText}>View All Matches</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('Teams', { screen: 'TeamsList' })}
          >
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              View Team Details
            </Text>
          </TouchableOpacity>
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
  doneButton: {
    backgroundColor: '#00E676',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  matchInfo: {
    backgroundColor: '#1F1F1F',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  matchTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00E676',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  matchDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    backgroundColor: '#1F1F1F',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  averageRatingCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  averageLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  averageRating: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  averageStars: {
    fontSize: 24,
  },
  playerRatings: {
    gap: 12,
  },
  playerRatingCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  ratingSection: {
    alignItems: 'center',
  },
  ratingStars: {
    fontSize: 20,
    marginBottom: 4,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00E676',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#00E676',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00E676',
  },
  secondaryButtonText: {
    color: '#00E676',
  },
});