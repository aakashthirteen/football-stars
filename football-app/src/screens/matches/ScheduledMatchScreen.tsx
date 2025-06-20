import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MatchesStackParamList } from '../../navigation/MatchesStack';
import { 
  ProfessionalHeader, 
  ProfessionalMatchHeader,
  DesignSystem 
} from '../../components/professional';
import { apiService } from '../../services/api';
import { Match } from '../../types';

const { colors, gradients, spacing, typography } = DesignSystem;

type ScheduledMatchScreenRouteProp = RouteProp<MatchesStackParamList, 'ScheduledMatch'>;
type ScheduledMatchScreenNavigationProp = StackNavigationProp<MatchesStackParamList>;

export default function ScheduledMatchScreen() {
  const navigation = useNavigation<ScheduledMatchScreenNavigationProp>();
  const route = useRoute<ScheduledMatchScreenRouteProp>();
  const { matchId } = route.params;

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingMatch, setIsStartingMatch] = useState(false);

  useEffect(() => {
    loadMatchData();
  }, [matchId]);

  const loadMatchData = async () => {
    try {
      setIsLoading(true);
      const matchData = await apiService.getMatchById(matchId);
      setMatch(matchData);
      
      // If match is actually live, navigate to LiveMatchScreen
      if (matchData.status === 'LIVE' || matchData.status === 'HALFTIME') {
        console.log('🔄 Match is live, redirecting to LiveMatchScreen');
        navigation.replace('LiveMatch', { matchId });
        return;
      }
    } catch (error) {
      console.error('Failed to load match:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startMatch = async () => {
    if (!match) return;
    
    try {
      setIsStartingMatch(true);
      
      // Start the match via API
      const response = await apiService.startMatch(matchId);
      console.log('✅ Match started successfully:', response);

      // Navigate to LiveMatchScreen (no flicker since we're explicitly navigating)
      navigation.replace('LiveMatch', { matchId });
      
    } catch (error) {
      console.error('❌ Failed to start match:', error);
      Alert.alert('Error', 'Failed to start match. Please check your connection and try again.');
      setIsStartingMatch(false);
    }
  };

  const navigateToPreMatchPlanning = () => {
    if (!match) return;
    
    // Ensure team objects exist before navigation
    if (!match.homeTeam || !match.awayTeam) {
      Alert.alert('Error', 'Team information is missing. Please try refreshing the match data.');
      return;
    }
    
    navigation.navigate('PreMatchPlanning', {
      matchId: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      isNewMatch: false,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading match...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Match not found</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProfessionalHeader 
        title="Match Details"
        onBack={() => navigation.goBack()}
      />
      
      <ProfessionalMatchHeader 
        homeTeam={{
          name: match.homeTeam?.name || 'Home Team',
          logoUrl: match.homeTeam?.logoUrl,
        }}
        awayTeam={{
          name: match.awayTeam?.name || 'Away Team',
          logoUrl: match.awayTeam?.logoUrl,
        }}
        homeScore={match.homeScore}
        awayScore={match.awayScore}
        status={match.status}
        venue={match.venue}
        duration={match.duration}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Start Match Card */}
        <View style={styles.sectionContainer}>
          <LinearGradient colors={gradients.primary} style={styles.startMatchCard}>
            <Ionicons name="football" size={64} color="#FFFFFF" />
            <Text style={styles.startMatchTitle}>Ready to Kick Off?</Text>
            <Text style={styles.startMatchSubtitle}>
              Start the match when both teams are ready
            </Text>
            
            <TouchableOpacity 
              style={[styles.startMatchButton, isStartingMatch && styles.buttonDisabled]} 
              onPress={startMatch}
              disabled={isStartingMatch}
            >
              {isStartingMatch ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.startMatchButtonText}>Start Match</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Pre-Match Options */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Pre-Match Setup</Text>
          
          <TouchableOpacity 
            style={styles.optionCard} 
            onPress={navigateToPreMatchPlanning}
          >
            <LinearGradient colors={gradients.secondary} style={styles.optionCardGradient}>
              <View style={styles.optionCardContent}>
                <Ionicons name="football-outline" size={24} color="#FFFFFF" />
                <Text style={styles.optionCardTitle}>Set Formations</Text>
                <Text style={styles.optionCardSubtitle}>Configure team formations</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Match Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Match Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration:</Text>
              <Text style={styles.infoValue}>{match.duration} minutes</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Venue:</Text>
              <Text style={styles.infoValue}>{match.venue || 'Not specified'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>{match.status}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  errorText: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  backButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  startMatchCard: {
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  startMatchTitle: {
    ...typography.title,
    color: '#FFFFFF',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  startMatchSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  startMatchButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 120,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  startMatchButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  optionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  optionCardGradient: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionCardTitle: {
    ...typography.subtitle,
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  optionCardSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  infoValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
});