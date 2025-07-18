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
import { useSimpleMatchTimer } from '../../services/timerService';
import { Match } from '../../types';
import { normalizeMatchData } from '../../utils/matchDataNormalizer';

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

  const timerData = useSimpleMatchTimer(match ? {
    id: match.id,
    status: match.status,
    duration: match.duration || 90,
    timerStartedAt: match.timerStartedAt,  // Use normalized field
    secondHalfStartedAt: match.secondHalfStartedAt,  // This will now have the value!
    currentHalf: match.currentHalf || 1,
    addedTimeFirstHalf: match.addedTimeFirstHalf || 0,
    addedTimeSecondHalf: match.addedTimeSecondHalf || 0,
  } : null);

  const timerState = {
    currentMinute: timerData.minutes,
    currentSecond: timerData.seconds,
    displayTime: timerData.displayTime,
    displayMinute: timerData.displayText,
    isHalftime: timerData.isHalftime,
    isLive: timerData.isLive,
    currentHalf: timerData.currentHalf,
    connectionStatus: 'connected' as const
  };

  const connectionStatus = timerState.connectionStatus;

  // Debug logging
  useEffect(() => {
    if (match) {
      console.log('🎯 Match Data for Timer:', {
        id: match.id,
        status: match.status,
        current_half: match.current_half,
        timer_started_at: match.timer_started_at,
        second_half_started_at: match.second_half_started_at,
        second_half_start_time: match.second_half_start_time,
        resolved_second_half: match.second_half_started_at || match.second_half_start_time,
        duration: match.duration,
        added_time_first_half: match.added_time_first_half
      });
    }
  }, [match]);

  // Debug logging to verify we're getting the timestamp
  useEffect(() => {
    if (match && match.current_half === 2) {
      console.log('🔍 Second Half Timer Debug:', {
        second_half_start_time: match.second_half_start_time,
        second_half_started_at: match.second_half_started_at,
        mapped_value: match.second_half_start_time || match.second_half_started_at,
        timer_minute: timerData.minutes,
        timer_display: timerData.displayText
      });
    }
  }, [match, timerData]);

  useEffect(() => {
    loadMatchData();
  }, [matchId]);

  // Reload match data when screen comes into focus (only if match state changes)
  useFocusEffect(
    React.useCallback(() => {
      if (!match) {
        loadMatchData();
      }
    }, [matchId, match])
  );

  useEffect(() => {
    // Auto-refresh match data every 10 seconds for live matches
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (match?.status === 'LIVE') {
      refreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing match data...');
        loadMatchData();
      }, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [match?.status, matchId]);

  const loadMatchData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMatchById(matchId);
      
      // DEBUG: Log the full API response structure
      console.log('🔍 FULL API RESPONSE:', response);
      console.log('🔍 RESPONSE.DATA:', response?.data);
      console.log('🔍 RESPONSE.MATCH:', response?.match);
      console.log('🔍 RESPONSE.DATA.MATCH:', response?.data?.match);
      
      // Extract match data correctly - check multiple possible locations
      const rawMatchData = response?.data?.match || response?.match || response?.data || response;
      
      console.log('🎯 RAW MATCH DATA:', rawMatchData);
      console.log('🎯 RAW EVENTS:', rawMatchData?.events);
      console.log('🎯 RAW ADDED TIME:', rawMatchData?.added_time_first_half);
      
      // CRITICAL: Normalize the match data
      const normalizedMatch = normalizeMatchData(rawMatchData);
      
      // Debug logging to verify normalization
      console.log('📊 Match data normalization:', {
        raw_second_half_start_time: rawMatchData.second_half_start_time,
        normalized_secondHalfStartedAt: normalizedMatch.secondHalfStartedAt,
        current_half: normalizedMatch.currentHalf,
        status: normalizedMatch.status
      });

      // CRITICAL: Debug events specifically
      console.log('🎮 MATCH STATE CHECK:', {
        has_events: !!normalizedMatch.events,
        events_count: normalizedMatch.events?.length,
        first_event: normalizedMatch.events?.[0],
        added_time_first_half: normalizedMatch.addedTimeFirstHalf,
        added_time_snake: normalizedMatch.added_time_first_half,
        raw_events: rawMatchData.events,
      });
      
      setMatch(normalizedMatch);
      
      // If match is not live, redirect to ScheduledMatchScreen
      if (normalizedMatch.status === 'SCHEDULED') {
        console.log('🔄 Match is scheduled, redirecting to ScheduledMatchScreen');
        navigation.replace('ScheduledMatch', { matchId });
        return;
      }
      
      // If match is completed, redirect to MatchOverview
      if (normalizedMatch.status === 'COMPLETED') {
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
      console.log('✅ Match ended successfully');
      
      // Navigate to player rating screen
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
      
      const response = await apiService.startSecondHalf(matchId);
      console.log('📡 Second half started:', response);
      
      // Reload data immediately
      await loadMatchData();
      
      // Keep reloading until we get the timestamp
      let attempts = 0;
      const checkInterval = setInterval(async () => {
        attempts++;
        
        const currentMatch = await apiService.getMatchById(matchId);
        const normalized = normalizeMatchData(currentMatch?.match || currentMatch);
        
        console.log(`🔄 Checking for timestamp (attempt ${attempts}):`, {
          has_timestamp: !!normalized.secondHalfStartedAt,
          timestamp: normalized.secondHalfStartedAt
        });
        
        if (normalized.secondHalfStartedAt || attempts >= 10) {
          clearInterval(checkInterval);
          setMatch(normalized);
          
          if (normalized.secondHalfStartedAt) {
            console.log('✅ Second half timestamp received!');
          } else {
            console.error('❌ Failed to get second half timestamp after 10 attempts');
          }
        }
      }, 500);
      
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
            isLive={match.status === 'LIVE'}
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
        match={match}
        timer={timerState}
        onBack={() => navigation.goBack()}
        onEndMatch={handleEndMatch}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timer Controls */}
        <View style={styles.timeControlsBar}>
          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>
              {timerState.isHalftime ? 'HT' : `${timerState.currentMinute}:${timerState.currentSecond.toString().padStart(2, '0')}`}
            </Text>
            <Text style={styles.halfText}>
              {timerState.isHalftime ? 'Half Time' : `Half ${timerState.currentHalf}`}
            </Text>
          </View>
          
          <View style={styles.connectionStatus}>
            <View style={[styles.connectionDot, connectionStatus === 'connected' ? styles.connected : styles.disconnected]} />
            <Text style={styles.connectionText}>{connectionStatus}</Text>
          </View>
        </View>

        {/* Halftime Modal */}
        {timerState.isHalftime && (
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