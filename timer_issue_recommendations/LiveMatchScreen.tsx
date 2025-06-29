// screens/matches/LiveMatchScreen.tsx
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
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MatchesStackParamList } from '../../navigation/MatchesStack';
import { 
  ProfessionalHeader, 
  ProfessionalMatchHeader,
  ProfessionalMatchAction,
  DesignSystem 
} from '../../components/professional';
import { apiService } from '../../services/api';
import { useMatchTimer, useTimerStore, syncMatchWithServer } from '../../services/timerService';
import { Match } from '../../types';

const { colors, gradients, spacing, typography } = DesignSystem;

type LiveMatchScreenRouteProp = RouteProp<MatchesStackParamList, 'LiveMatch'>;
type LiveMatchScreenNavigationProp = StackNavigationProp<MatchesStackParamList>;

export default function LiveMatchScreen() {
  const navigation = useNavigation<LiveMatchScreenNavigationProp>();
  const route = useRoute<LiveMatchScreenRouteProp>();
  const { matchId } = route.params;

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'actions' | 'commentary' | 'stats' | 'formation'>('actions');

  // Use the new timer hook
  const timer = useMatchTimer(matchId);
  const timerStore = useTimerStore();

  useEffect(() => {
    loadMatchData();
    
    // Set up periodic sync with server every 5 seconds
    const syncInterval = setInterval(() => {
      if (timer.isLive || timer.isHalftime) {
        syncMatchWithServer(matchId, apiService);
      }
    }, 5000);
    
    return () => clearInterval(syncInterval);
  }, [matchId, timer.isLive, timer.isHalftime]);

  useFocusEffect(
    React.useCallback(() => {
      if (!match) {
        loadMatchData();
      }
    }, [matchId, match])
  );

  const loadMatchData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMatchById(matchId);
      const matchData = response.match;
      setMatch(matchData);
      
      // Initialize timer with match data
      if (matchData.status === 'LIVE' || matchData.status === 'HALFTIME') {
        timerStore.addMatch({
          id: matchData.id,
          status: matchData.status,
          duration: matchData.duration || 90,
          startedAt: matchData.timer_started_at ? new Date(matchData.timer_started_at).getTime() : undefined,
          halfTimeStartedAt: matchData.halftime_started_at ? new Date(matchData.halftime_started_at).getTime() : undefined,
          secondHalfStartedAt: matchData.second_half_started_at ? new Date(matchData.second_half_started_at).getTime() : undefined,
          currentHalf: matchData.current_half || 1,
          addedTimeFirstHalf: matchData.added_time_first_half || 0,
          addedTimeSecondHalf: matchData.added_time_second_half || 0,
          lastSync: Date.now(),
          totalPausedDuration: 0,
        });
      }
      
      // Redirect if needed
      if (matchData.status === 'SCHEDULED') {
        console.log('🔄 Match is scheduled, redirecting to ScheduledMatchScreen');
        navigation.replace('ScheduledMatch', { matchId });
        return;
      }
      
      if (matchData.status === 'COMPLETED') {
        console.log('🔄 Match is completed, redirecting to MatchOverview');
        navigation.replace('MatchOverview', { matchId });
        return;
      }
    } catch (error) {
      console.error('Failed to load match:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndMatch = () => {
    Alert.alert(
      'End Match',
      'Are you sure you want to end this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Match', 
          style: 'destructive',
          onPress: endMatch 
        },
      ]
    );
  };

  const endMatch = async () => {
    if (!match) return;
    
    try {
      await apiService.endMatch(matchId);
      timerStore.endMatch(matchId);
      console.log('✅ Match ended successfully');
      
      navigation.navigate('PlayerRating', {
        matchId: match.id,
        homeTeamId: match.homeTeamId,
        homeTeamName: match.homeTeam?.name || 'Home Team',
        awayTeamId: match.awayTeamId,
        awayTeamName: match.awayTeam?.name || 'Away Team',
      });
    } catch (error) {
      console.error('❌ Failed to end match:', error);
      Alert.alert('Error', 'Failed to end match. Please try again.');
    }
  };

  const handleStartSecondHalf = async () => {
    try {
      console.log('⚽ Starting second half...');
      
      // Update server first
      const response = await apiService.startSecondHalf(matchId);
      
      // Update local timer immediately
      timerStore.startSecondHalf(matchId);
      
      // Sync with server data
      if (response.match) {
        timerStore.syncMatch(matchId, {
          status: 'LIVE',
          currentHalf: 2,
          secondHalfStartedAt: response.match.second_half_started_at ? 
            new Date(response.match.second_half_started_at).getTime() : 
            Date.now(),
        });
      }
      
      console.log('✅ Second half started successfully');
    } catch (error) {
      console.error('❌ Failed to start second half:', error);
      Alert.alert('Error', 'Failed to start second half. Please try again.');
    }
  };

  const handleMatchAction = (team: 'home' | 'away', actionType: string) => {
    console.log('Match action:', { team, actionType });
    // TODO: Implement match actions (goals, cards, substitutions)
  };

  const handleQuickEvent = (eventType: string) => {
    console.log('Quick event:', eventType);
    // TODO: Implement quick events
  };

  const renderTabContent = () => {
    if (!match) return null;

    switch (selectedTab) {
      case 'actions':
        return (
          <ProfessionalMatchAction
            homeTeamName={match.homeTeam?.name || `Team ${match.homeTeamId?.substring(0, 8) || 'Home'}`}
            awayTeamName={match.awayTeam?.name || `Team ${match.awayTeamId?.substring(0, 8) || 'Away'}`}
            isLive={timer.isLive}
            availableSubstitutions={{ home: 3, away: 3 }}
            onAction={handleMatchAction}
            onQuickEvent={handleQuickEvent}
          />
        );
      case 'commentary':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoonText}>Commentary feed coming soon...</Text>
          </View>
        );
      case 'stats':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoonText}>Live stats coming soon...</Text>
          </View>
        );
      case 'formation':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoonText}>Formation view coming soon...</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading live match...</Text>
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
        title="🔴 Live Match"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity onPress={handleEndMatch} style={styles.endMatchButton}>
            <Text style={styles.endMatchButtonText}>End</Text>
          </TouchableOpacity>
        }
      />
      
      <ProfessionalMatchHeader 
        homeTeam={match.homeTeam || { 
          name: `Team ${match.homeTeamId?.substring(0, 8) || 'Home'}`,
          logoUrl: undefined,
          badge: undefined
        }}
        awayTeam={match.awayTeam || { 
          name: `Team ${match.awayTeamId?.substring(0, 8) || 'Away'}`,
          logoUrl: undefined,
          badge: undefined
        }}
        homeScore={match.homeScore || 0}
        awayScore={match.awayScore || 0}
        status={timer.status}
        currentMinute={timer.minutes}
        currentSecond={timer.seconds}
        venue={match.venue}
        onBack={() => navigation.goBack()}
        onEndMatch={handleEndMatch}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timer Controls */}
        <View style={styles.timeControlsBar}>
          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>
              {timer.isHalftime ? 'HT' : `${timer.minutes}:${timer.seconds.toString().padStart(2, '0')}`}
            </Text>
            <Text style={styles.halfText}>
              {timer.isHalftime ? 'Half Time' : `Half ${timer.currentHalf}`}
            </Text>
          </View>
          
          <View style={styles.connectionStatus}>
            <View style={[styles.connectionDot, styles.connected]} />
            <Text style={styles.connectionText}>Live</Text>
          </View>
        </View>

        {/* Halftime Modal */}
        {timer.isHalftime && (
          <View style={styles.halftimeContainer}>
            <LinearGradient colors={gradients.primary} style={styles.halftimeCard}>
              <Text style={styles.halftimeTitle}>Half Time</Text>
              <Text style={styles.halftimeScore}>
                {match.homeTeam?.name || 'Home'} {match.homeScore} - {match.awayScore} {match.awayTeam?.name || 'Away'}
              </Text>
              <TouchableOpacity 
                style={styles.secondHalfButton} 
                onPress={handleStartSecondHalf}
              >
                <Text style={styles.secondHalfButtonText}>Start Second Half</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {['actions', 'commentary', 'stats', 'formation'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab as typeof selectedTab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}
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
  endMatchButton: {
    backgroundColor: colors.status.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  endMatchButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontSize: 14,
  },
  timeControlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  timerDisplay: {
    alignItems: 'flex-start',
  },
  timerText: {
    ...typography.title,
    color: colors.text.primary,
    fontWeight: '700',
  },
  halfText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  connected: {
    backgroundColor: colors.status.success,
  },
  disconnected: {
    backgroundColor: colors.status.error,
  },
  connectionText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  halftimeContainer: {
    marginBottom: spacing.md,
  },
  halftimeCard: {
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
  },
  halftimeTitle: {
    ...typography.title,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  halftimeScore: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  secondHalfButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondHalfButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary.main,
  },
  tabText: {
    ...typography.button,
    color: colors.text.secondary,
    fontSize: 14,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.lg,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    ...typography.body,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});