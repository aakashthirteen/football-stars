import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import PitchFormation from '../../components/PitchFormation';

const { width } = Dimensions.get('window');

interface MatchOverviewScreenProps {
  navigation: any;
  route: any;
}

export default function MatchOverviewScreen({ navigation, route }: MatchOverviewScreenProps) {
  const { matchId } = route.params;
  const [match, setMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadMatchDetails();
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
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
      case 'GK': return '#FF5722';
      case 'DEF': return '#2196F3';
      case 'MID': return '#4CAF50';
      case 'FWD': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#0A0E27', '#1A1F3A']} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading match overview...</Text>
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

  return (
    <LinearGradient colors={['#0A0E27', '#1A1F3A']} style={styles.container}>
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>Match Overview</Text>
          <Text style={styles.headerSubtitle}>Final Result</Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Match Result Card */}
        <Animated.View 
          style={[
            styles.resultCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']} style={styles.resultGradient}>
            <Text style={styles.matchStatus}>FULL TIME</Text>
            
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
          </LinearGradient>
        </Animated.View>

        {/* Pitch Formation */}
        {match && match.homeTeam && match.awayTeam && (
          <Animated.View 
            style={[
              styles.pitchFormationCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']} style={styles.pitchFormationGradient}>
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
            </LinearGradient>
          </Animated.View>
        )}

        {/* Match Events Timeline */}
        {match.events && match.events.length > 0 && (
          <Animated.View 
            style={[
              styles.timelineCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']} style={styles.timelineGradient}>
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
            </LinearGradient>
          </Animated.View>
        )}

        {/* Team Lineups */}
        <Animated.View 
          style={[
            styles.lineupsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']} style={styles.lineupsGradient}>
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
          </LinearGradient>
        </Animated.View>

        {/* Match Statistics */}
        <Animated.View 
          style={[
            styles.statsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']} style={styles.statsGradient}>
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
          </LinearGradient>
        </Animated.View>
      </ScrollView>
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultCard: {
    marginBottom: 24,
  },
  resultGradient: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  matchStatus: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  teamResult: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  scoreContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamScore: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
  },
  vsContainer: {
    paddingHorizontal: 20,
  },
  vsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  matchInfo: {
    alignItems: 'center',
  },
  matchDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  matchVenue: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  timelineCard: {
    marginBottom: 24,
  },
  timelineGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventTime: {
    width: 50,
    alignItems: 'center',
  },
  eventMinute: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  eventContent: {
    flex: 1,
    marginLeft: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventTeam: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  eventDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  eventIcon: {
    marginLeft: 12,
  },
  eventEmoji: {
    fontSize: 18,
  },
  lineupsCard: {
    marginBottom: 24,
  },
  lineupsGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lineupsContainer: {
    gap: 20,
  },
  teamLineup: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  teamLineupsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  lineupPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  playerJerseyMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playerNumberMini: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  playerInfoMini: {
    flex: 1,
  },
  playerNameMini: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  playerPositionMini: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
  statsCard: {
    marginBottom: 40,
  },
  statsGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Pitch Formation Styles
  pitchFormationCard: {
    marginBottom: 24,
  },
  pitchFormationGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pitchOverview: {
    backgroundColor: 'transparent',
  },
});