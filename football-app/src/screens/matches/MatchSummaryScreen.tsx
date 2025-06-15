import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients } from '../../theme/colors';
import { GlobalStyles, Spacing, BorderRadius } from '../../theme/styles';
import { LinearGradient } from 'expo-linear-gradient';

interface MatchSummaryScreenProps {
  navigation: any;
  route: any;
}

interface MatchSummary {
  id: string;
  homeTeam: any;
  awayTeam: any;
  homeScore: number;
  awayScore: number;
  venue: string;
  matchDate: string;
  events: any[];
  duration: number;
}

interface PlayerStats {
  playerId: string;
  playerName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export default function MatchSummaryScreen({ navigation, route }: MatchSummaryScreenProps) {
  const { matchId } = route.params;
  const [match, setMatch] = useState<MatchSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [topScorers, setTopScorers] = useState<PlayerStats[]>([]);
  const [topAssists, setTopAssists] = useState<PlayerStats[]>([]);

  useEffect(() => {
    loadMatchSummary();
  }, []);

  const loadMatchSummary = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMatchById(matchId);
      
      if (response && response.match) {
        setMatch(response.match);
        calculatePlayerStats(response.match);
      }
    } catch (error) {
      console.error('Error loading match summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePlayerStats = (matchData: MatchSummary) => {
    const playerStatsMap: { [key: string]: PlayerStats } = {};

    // Process all events to calculate stats
    matchData.events.forEach(event => {
      const playerId = event.playerId || event.player?.id;
      const playerName = event.player?.name || 'Unknown Player';

      if (!playerStatsMap[playerId]) {
        playerStatsMap[playerId] = {
          playerId,
          playerName,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
        };
      }

      switch (event.eventType) {
        case 'GOAL':
          playerStatsMap[playerId].goals++;
          break;
        case 'ASSIST':
          playerStatsMap[playerId].assists++;
          break;
        case 'YELLOW_CARD':
          playerStatsMap[playerId].yellowCards++;
          break;
        case 'RED_CARD':
          playerStatsMap[playerId].redCards++;
          break;
      }
    });

    const statsArray = Object.values(playerStatsMap);
    
    // Sort by goals
    const scorers = [...statsArray]
      .filter(p => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 3);
    
    // Sort by assists
    const assisters = [...statsArray]
      .filter(p => p.assists > 0)
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 3);

    setTopScorers(scorers);
    setTopAssists(assisters);
  };

  const getMatchResult = () => {
    if (!match) return '';
    
    if (match.homeScore > match.awayScore) {
      return `${match.homeTeam.name} Victory`;
    } else if (match.awayScore > match.homeScore) {
      return `${match.awayTeam.name} Victory`;
    } else {
      return 'Draw';
    }
  };

  const getResultColor = () => {
    if (!match) return Colors.text.primary;
    
    if (match.homeScore > match.awayScore) {
      return Colors.primary.main;
    } else if (match.awayScore > match.homeScore) {
      return Colors.teams.away;
    } else {
      return Colors.secondary.main;
    }
  };

  const renderEvent = (event: any, index: number) => {
    const getEventIcon = (type: string) => {
      switch (type) {
        case 'GOAL': return '⚽';
        case 'ASSIST': return '🤝';
        case 'YELLOW_CARD': return '🟨';
        case 'RED_CARD': return '🟥';
        default: return '📝';
      }
    };

    return (
      <View key={event.id || index} style={styles.eventItem}>
        <Text style={styles.eventTime}>{event.minute}'</Text>
        <Text style={styles.eventIcon}>{getEventIcon(event.eventType)}</Text>
        <View style={styles.eventDetails}>
          <Text style={styles.eventPlayer}>{event.player?.name || 'Unknown'}</Text>
          <Text style={styles.eventType}>{event.eventType.replace('_', ' ')}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading match summary...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Match not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={Gradients.field}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Matches')}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Match Summary</Text>
          
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => {/* Share functionality */}}
          >
            <Ionicons name="share-outline" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Match Result Card */}
        <View style={styles.resultCard}>
          <Text style={[styles.resultText, { color: getResultColor() }]}>
            {getMatchResult()}
          </Text>
          
          <View style={styles.scoreContainer}>
            <View style={styles.teamScore}>
              <Text style={styles.teamName}>{match.homeTeam.name}</Text>
              <Text style={styles.scoreNumber}>{match.homeScore}</Text>
            </View>
            
            <Text style={styles.vsText}>-</Text>
            
            <View style={styles.teamScore}>
              <Text style={styles.scoreNumber}>{match.awayScore}</Text>
              <Text style={styles.teamName}>{match.awayTeam.name}</Text>
            </View>
          </View>
          
          <View style={styles.matchInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color={Colors.text.secondary} />
              <Text style={styles.infoText}>{match.venue || 'Unknown Venue'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color={Colors.text.secondary} />
              <Text style={styles.infoText}>
                {new Date(match.matchDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
              <Text style={styles.infoText}>{match.duration || 90} minutes</Text>
            </View>
          </View>
        </View>

        {/* Top Performers */}
        {(topScorers.length > 0 || topAssists.length > 0) && (
          <View style={styles.performersSection}>
            <Text style={styles.sectionTitle}>Top Performers</Text>
            
            {topScorers.length > 0 && (
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>⚽ Goal Scorers</Text>
                {topScorers.map((player, index) => (
                  <View key={player.playerId} style={styles.statItem}>
                    <Text style={styles.statRank}>{index + 1}.</Text>
                    <Text style={styles.statName}>{player.playerName}</Text>
                    <Text style={styles.statValue}>{player.goals}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {topAssists.length > 0 && (
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>🤝 Assists</Text>
                {topAssists.map((player, index) => (
                  <View key={player.playerId} style={styles.statItem}>
                    <Text style={styles.statRank}>{index + 1}.</Text>
                    <Text style={styles.statName}>{player.playerName}</Text>
                    <Text style={styles.statValue}>{player.assists}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Match Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Match Timeline</Text>
          <View style={styles.timeline}>
            {match.events.length > 0 ? (
              match.events
                .sort((a, b) => a.minute - b.minute)
                .map((event, index) => renderEvent(event, index))
            ) : (
              <Text style={styles.noEvents}>No events recorded</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Matches')}
          >
            <LinearGradient
              colors={Gradients.field}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Back to Matches</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('CreateMatch')}
          >
            <Text style={styles.secondaryButtonText}>Create New Match</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.status.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  resultCard: {
    backgroundColor: Colors.background.card,
    margin: 20,
    padding: 24,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.medium,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  resultText: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  teamScore: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  vsText: {
    fontSize: 24,
    color: Colors.text.tertiary,
    paddingHorizontal: 20,
  },
  matchInfo: {
    width: '100%',
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  performersSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: Colors.background.card,
    padding: 16,
    borderRadius: BorderRadius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statRank: {
    fontSize: 14,
    color: Colors.text.tertiary,
    width: 30,
  },
  statName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary.main,
  },
  timelineSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  timeline: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.border,
  },
  eventTime: {
    width: 40,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.main,
  },
  eventIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventPlayer: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  eventType: {
    fontSize: 12,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  noEvents: {
    textAlign: 'center',
    color: Colors.text.tertiary,
    fontSize: 14,
    paddingVertical: 20,
  },
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.background.elevated,
    paddingVertical: 16,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.main,
  },
});
