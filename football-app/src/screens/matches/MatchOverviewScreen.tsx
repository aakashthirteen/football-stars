import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import PitchFormation from '../../components/PitchFormation';

// Professional Components
import { 
  ProfessionalHeader,
  DesignSystem 
} from '../../components/professional';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface MatchOverviewScreenProps {
  navigation: any;
  route: any;
}

export default function MatchOverviewScreen({ navigation, route }: MatchOverviewScreenProps) {
  const { matchId } = route.params;
  const [match, setMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMatchDetails();
  }, []);

  const loadMatchDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMatchById(matchId);
      if (response && response.match) {
        setMatch(response.match);
      }
    } catch (error) {
      console.error('Error loading match details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatchDetails();
    setRefreshing(false);
  };

  const getEventDescription = (eventType: string) => {
    switch (eventType) {
      case 'GOAL': return 'Goal';
      case 'ASSIST': return 'Assist';  
      case 'YELLOW_CARD': return 'Yellow Card';
      case 'RED_CARD': return 'Red Card';
      case 'SUBSTITUTION': return 'Substitution';
      default: return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return colors.status.error;
      case 'DEF': return colors.accent.blue;
      case 'MID': return colors.primary.main;
      case 'FWD': return colors.accent.orange;
      default: return colors.text.secondary;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ProfessionalHeader
          title="Match Overview"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading match details...</Text>
        </View>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.container}>
        <ProfessionalHeader
          title="Match Overview"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="football-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.errorText}>Match not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProfessionalHeader
        title="Match Overview"
        subtitle={`${match.homeTeam?.name} vs ${match.awayTeam?.name}`}
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Match Result Card */}
        <View style={styles.resultCard}>
          <Text style={styles.matchStatus}>{match.status?.toUpperCase() || 'FULL TIME'}</Text>
          
          <View style={styles.teamsContainer}>
            {/* Home Team */}
            <View style={styles.teamResult}>
              <Text style={styles.teamName} numberOfLines={1}>
                {match.homeTeam?.name || 'Home'}
              </Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.teamScore}>{match.homeScore || 0}</Text>
              </View>
            </View>
            
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            
            {/* Away Team */}
            <View style={styles.teamResult}>
              <Text style={styles.teamName} numberOfLines={1}>
                {match.awayTeam?.name || 'Away'}
              </Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.teamScore}>{match.awayScore || 0}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.matchInfo}>
            <Text style={styles.matchDate}>
              {new Date(match.matchDate || match.match_date).toLocaleDateString()}
            </Text>
            {match.venue && (
              <Text style={styles.matchVenue}>📍 {match.venue}</Text>
            )}
          </View>
        </View>

        {/* Pitch Formation */}
        {match && match.homeTeam && match.awayTeam && (
          <View style={styles.pitchFormationCard}>
            <Text style={styles.sectionTitle}>Formation</Text>
            <PitchFormation
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              onPlayerPress={(player) => {
                console.log('Player pressed:', player.name);
                // Future: Navigate to player profile
              }}
              showPlayerNames={true}
              style={styles.pitchOverview}
            />
          </View>
        )}

        {/* Match Events Timeline */}
        {match.events && match.events.length > 0 && (
          <View style={styles.timelineCard}>
            <Text style={styles.sectionTitle}>Match Events</Text>
            
            {match.events.map((event: any, index: number) => (
              <View key={event.id || index} style={styles.eventItem}>
                <View style={styles.eventTime}>
                  <Text style={styles.eventMinute}>{event.minute}'</Text>
                </View>
                
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventType}>
                      {getEventDescription(event.eventType)} by {event.player?.name?.split(' ')[0] || 'Unknown'}
                    </Text>
                    <Text style={styles.eventTeam}>
                      {event.teamId === match.homeTeam?.id ? match.homeTeam?.name : match.awayTeam?.name}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.eventIcon}>
                  {event.eventType === 'GOAL' && <Text style={styles.eventEmoji}>⚽</Text>}
                  {event.eventType === 'ASSIST' && <Text style={styles.eventEmoji}>🅰️</Text>}
                  {event.eventType === 'YELLOW_CARD' && <Text style={styles.eventEmoji}>🟨</Text>}
                  {event.eventType === 'RED_CARD' && <Text style={styles.eventEmoji}>🟥</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Team Lineups */}
        <View style={styles.lineupsCard}>
          <Text style={styles.sectionTitle}>Team Lineups</Text>
          
          <View style={styles.lineupsContainer}>
            {/* Home Team Lineup */}
            <View style={styles.teamLineup}>
              <Text style={styles.teamLineupsTitle}>{match.homeTeam?.name}</Text>
              <View style={styles.playersGrid}>
                {match.homeTeam?.players?.map((player: any, index: number) => (
                  <TouchableOpacity 
                    key={player.id || index} 
                    style={styles.lineupPlayer}
                    onPress={() => {
                      // Navigate to player profile (placeholder for now)
                      console.log('Navigate to player profile:', player.id, player.name);
                    }}
                  >
                    <View style={[
                      styles.playerJerseyMini, 
                      { backgroundColor: getPositionColor(player.position) }
                    ]}>
                      <Text style={styles.playerNumberMini}>{player.jerseyNumber || index + 1}</Text>
                    </View>
                    <View style={styles.playerInfoMini}>
                      <Text style={styles.playerNameMini} numberOfLines={1}>
                        {player.name?.split(' ')[0] || 'Player'}
                      </Text>
                      <Text style={styles.playerPositionMini}>{player.position}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Away Team Lineup */}
            <View style={styles.teamLineup}>
              <Text style={styles.teamLineupsTitle}>{match.awayTeam?.name}</Text>
              <View style={styles.playersGrid}>
                {match.awayTeam?.players?.map((player: any, index: number) => (
                  <TouchableOpacity 
                    key={player.id || index} 
                    style={styles.lineupPlayer}
                    onPress={() => {
                      // Navigate to player profile (placeholder for now)
                      console.log('Navigate to player profile:', player.id, player.name);
                    }}
                  >
                    <View style={[
                      styles.playerJerseyMini, 
                      { backgroundColor: getPositionColor(player.position) }
                    ]}>
                      <Text style={styles.playerNumberMini}>{player.jerseyNumber || index + 1}</Text>
                    </View>
                    <View style={styles.playerInfoMini}>
                      <Text style={styles.playerNameMini} numberOfLines={1}>
                        {player.name?.split(' ')[0] || 'Player'}
                      </Text>
                      <Text style={styles.playerPositionMini}>{player.position}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Match Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Match Statistics</Text>
          
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Goals</Text>
            <Text style={styles.statValue}>{match.homeScore || 0} - {match.awayScore || 0}</Text>
          </View>
          
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Total Events</Text>
            <Text style={styles.statValue}>{match.events?.length || 0}</Text>
          </View>
          
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>90 minutes</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.screenPadding,
    paddingTop: spacing.screenPadding * 2, // Much more space for header with subtitle
    paddingBottom: spacing.screenPadding * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  errorText: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  backButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
  },
  backButtonText: {
    ...typography.button,
    color: colors.surface.primary,
  },
  
  // Match Result Card
  resultCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  matchStatus: {
    ...typography.caption,
    color: colors.status.success,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  teamResult: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  scoreContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent.blue + '20',
    borderWidth: 2,
    borderColor: colors.accent.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamScore: {
    ...typography.h2,
    color: colors.accent.blue,
    fontWeight: 'bold',
  },
  vsContainer: {
    paddingHorizontal: spacing.md,
  },
  vsText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  matchInfo: {
    alignItems: 'center',
  },
  matchDate: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  matchVenue: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // Cards
  pitchFormationCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  timelineCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  lineupsCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  statsCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  // Timeline Events
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.secondary,
  },
  eventTime: {
    width: 50,
    alignItems: 'center',
  },
  eventMinute: {
    ...typography.caption,
    color: colors.accent.blue,
    fontWeight: '600',
  },
  eventContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventType: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  eventTeam: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  eventIcon: {
    marginLeft: spacing.sm,
  },
  eventEmoji: {
    fontSize: 18,
  },

  // Team Lineups
  lineupsContainer: {
    gap: spacing.md,
  },
  teamLineup: {
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.card,
    padding: spacing.md,
  },
  teamLineupsTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  lineupPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.small,
    padding: spacing.sm,
    width: '47%',
    marginBottom: spacing.xs,
    ...shadows.small,
  },
  playerJerseyMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  playerNumberMini: {
    ...typography.caption,
    color: colors.surface.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  playerInfoMini: {
    flex: 1,
  },
  playerNameMini: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  playerPositionMini: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
  },

  // Statistics
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.secondary,
  },
  statLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  statValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },

  // Pitch Formation
  pitchOverview: {
    backgroundColor: 'transparent',
  },
});