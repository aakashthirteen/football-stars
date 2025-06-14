import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Animated,
  Dimensions,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface MatchScoringScreenProps {
  navigation: any;
  route: any;
}

interface Match {
  id: string;
  homeTeam: any;
  awayTeam: any;
  homeScore: number;
  awayScore: number;
  status: string;
  venue?: string;
  matchDate: string;
  events: MatchEvent[];
}

interface MatchEvent {
  id: string;
  eventType: string;
  minute: number;
  player: any;
  teamId: string;
  description?: string;
}

interface Player {
  id: string;
  name: string;
  position: string;
  jerseyNumber?: number;
}

const COMMENTARY_TEMPLATES = {
  GOAL: [
    "GOOOOOAL! 🔥 What a strike from {player}!",
    "⚽ {player} finds the back of the net! Incredible finish!",
    "SCORED! {player} makes no mistake from there!",
    "🎯 {player} with a clinical finish! The crowd goes wild!"
  ],
  ASSIST: [
    "🤝 Great assist from {player}!",
    "👏 {player} with the perfect pass!",
    "🎯 {player} sets it up beautifully!"
  ],
  YELLOW_CARD: [
    "🟨 {player} sees yellow for that challenge",
    "Referee shows {player} a yellow card",
    "⚠️ {player} needs to be careful now with that yellow"
  ],
  RED_CARD: [
    "🟥 {player} is sent off! Down to 10 men!",
    "RED CARD! {player} has to leave the field",
    "💔 Disaster for the team as {player} sees red"
  ]
};

export default function MatchScoringScreen({ navigation, route }: MatchScoringScreenProps) {
  const { matchId } = route.params;
  const [match, setMatch] = useState<Match | null>(null);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [latestCommentary, setLatestCommentary] = useState<string>('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isProcessingEvent, setIsProcessingEvent] = useState(false);
  const [lastEventTime, setLastEventTime] = useState(0);
  const [goalScorerId, setGoalScorerId] = useState<string | null>(null);
  const [showAssistModal, setShowAssistModal] = useState(false);
  const [showLineups, setShowLineups] = useState(false);
  const [goalScorerTeam, setGoalScorerTeam] = useState<any>(null);
  
  const scoreAnimation = useRef(new Animated.Value(1)).current;
  const commentaryAnimation = useRef(new Animated.Value(0)).current;
  const ballAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMatchDetails();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setCurrentMinute(prev => prev + 1);
      }, 60000); // Increment every minute
      
      // Animate ball movement
      Animated.loop(
        Animated.sequence([
          Animated.timing(ballAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(ballAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const loadMatchDetails = async () => {
    try {
      console.log('🔍 Loading match details for ID:', matchId);
      
      if (!matchId) {
        throw new Error('No match ID provided');
      }
      
      const response = await apiService.getMatchById(matchId);
      console.log('📊 Match details response:', response);
      
      if (!response || !response.match) {
        throw new Error('Invalid match data received');
      }
      
      const matchData = response.match;
      
      console.log('🔍 Raw match data from API:', {
        homeTeam: matchData.homeTeam,
        awayTeam: matchData.awayTeam,
        homeTeamPlayers: matchData.homeTeam?.players,
        awayTeamPlayers: matchData.awayTeam?.players
      });
      
      // Ensure events array exists
      if (!matchData.events) {
        matchData.events = [];
      }
      
      // DO NOT override team data - it should come from backend correctly
      
      console.log('👥 Team players count:', {
        homeTeam: matchData.homeTeam.players?.length || 0,
        awayTeam: matchData.awayTeam.players?.length || 0
      });
      
      // Ensure scores are properly mapped from database fields
      matchData.homeScore = matchData.homeScore || matchData.home_score || 0;
      matchData.awayScore = matchData.awayScore || matchData.away_score || 0;
      
      console.log('📊 Final scores:', { 
        homeScore: matchData.homeScore, 
        awayScore: matchData.awayScore,
        home_score: matchData.home_score,
        away_score: matchData.away_score
      });
      
      setMatch(matchData);
      setIsLive(matchData.status === 'LIVE');
      
      if (matchData.status === 'LIVE' && (matchData.matchDate || matchData.match_date)) {
        try {
          const matchDateValue = matchData.matchDate || matchData.match_date;
          const matchStart = new Date(matchDateValue);
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - matchStart.getTime()) / (1000 * 60));
          // Cap at reasonable match time (max 120 minutes including extra time)
          setCurrentMinute(Math.max(0, Math.min(elapsed, 120)));
        } catch (dateError) {
          console.error('Error calculating match time:', dateError);
          setCurrentMinute(0);
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading match details:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to load match details. Please try again.',
        [
          { text: 'Retry', onPress: () => loadMatchDetails() },
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const startMatch = async () => {
    try {
      await apiService.startMatch(matchId);
      setIsLive(true);
      setCurrentMinute(0);
      showCommentary("⚽ Kick-off! The match has begun!");
      Vibration.vibrate(100);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start match');
    }
  };

  const showCommentary = (text: string) => {
    setLatestCommentary(text);
    Animated.sequence([
      Animated.timing(commentaryAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(commentaryAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const addGoalWithAssist = async (goalScorerId: string, assistPlayerId: string | null) => {
    if (!goalScorerTeam || !match) return;
    
    const now = Date.now();
    const frontendRequestId = now + '-' + Math.random().toString(36).substr(2, 9);
    
    // Prevent rapid-fire calls (1 second debounce)
    if (isProcessingEvent) {
      console.log(`🚫 [${frontendRequestId}] FRONTEND: Already processing event, ignoring rapid click`);
      return;
    }
    
    if (now - lastEventTime < 1000) {
      console.log(`🚫 [${frontendRequestId}] FRONTEND: Too soon after last event (${now - lastEventTime}ms), ignoring`);
      return;
    }
    
    setIsProcessingEvent(true);
    setLastEventTime(now);
    
    console.log(`🎯 [${frontendRequestId}] FRONTEND: Starting addGoalWithAssist:`, { goalScorerId, assistPlayerId, teamId: goalScorerTeam.id });

    try {
      const goalScorer = goalScorerTeam.players.find((p: Player) => p.id === goalScorerId);
      
      // Create goal event
      const goalEventData = {
        playerId: goalScorerId,
        teamId: goalScorerTeam.id,
        eventType: 'GOAL',
        minute: currentMinute,
        description: `GOAL by ${goalScorerTeam.name}`,
      };

      console.log(`📤 [${frontendRequestId}] FRONTEND: Creating goal event:`, goalEventData);
      await apiService.addMatchEvent(matchId, goalEventData);
      
      // Create assist event if there's an assist
      if (assistPlayerId) {
        const assistPlayer = goalScorerTeam.players.find((p: Player) => p.id === assistPlayerId);
        const assistEventData = {
          playerId: assistPlayerId,
          teamId: goalScorerTeam.id,
          eventType: 'ASSIST',
          minute: currentMinute,
          description: `ASSIST by ${goalScorerTeam.name}`,
        };
        
        console.log(`📤 [${frontendRequestId}] FRONTEND: Creating assist event:`, assistEventData);
        await apiService.addMatchEvent(matchId, assistEventData);
      }
      
      console.log(`✅ [${frontendRequestId}] FRONTEND: Goal and assist events completed successfully`);
      
      // Generate commentary
      const assistPlayer = assistPlayerId ? goalScorerTeam.players.find((p: Player) => p.id === assistPlayerId) : null;
      
      let commentary;
      if (assistPlayer) {
        commentary = `⚽ GOOOOOAL! ${goalScorer?.name} scores with an assist from ${assistPlayer.name}!`;
      } else {
        const templates = COMMENTARY_TEMPLATES.GOAL;
        const template = templates[Math.floor(Math.random() * templates.length)];
        commentary = template.replace('{player}', goalScorer?.name || 'Unknown');
      }
      
      showCommentary(commentary);
      
      // Animate and vibrate for goals
      animateScore();
      Vibration.vibrate([0, 200, 100, 200]);

      console.log(`🔄 [${frontendRequestId}] FRONTEND: About to call loadMatchDetails to refresh match state`);
      await loadMatchDetails();
      console.log(`🔄 [${frontendRequestId}] FRONTEND: loadMatchDetails completed`);
      
    } catch (error: any) {
      console.error(`💥 [${frontendRequestId}] FRONTEND: Error in addGoalWithAssist:`, error);
      Alert.alert('Error', error.message || 'Failed to add goal and assist events');
    } finally {
      // Always reset processing state after request completes (success or error)
      setIsProcessingEvent(false);
      console.log(`🔄 [${frontendRequestId}] FRONTEND: Reset processing state`);
    }
  };

  const addEvent = async (playerId: string, eventType: string) => {
    if (!selectedTeam || !match) return;
    
    const now = Date.now();
    const frontendRequestId = now + '-' + Math.random().toString(36).substr(2, 9);
    
    // Prevent rapid-fire calls (1 second debounce)
    if (isProcessingEvent) {
      console.log(`🚫 [${frontendRequestId}] FRONTEND: Already processing event, ignoring rapid click`);
      return;
    }
    
    if (now - lastEventTime < 1000) {
      console.log(`🚫 [${frontendRequestId}] FRONTEND: Too soon after last event (${now - lastEventTime}ms), ignoring`);
      return;
    }
    
    setIsProcessingEvent(true);
    setLastEventTime(now);
    
    console.log(`🎯 [${frontendRequestId}] FRONTEND: Starting addEvent:`, { playerId, eventType, teamId: selectedTeam.id });
    console.log(`🕐 [${frontendRequestId}] FRONTEND: Timestamp:`, new Date().toISOString());

    try {
      const player = selectedTeam.players.find((p: Player) => p.id === playerId);
      const eventData = {
        playerId,
        teamId: selectedTeam.id,
        eventType,
        minute: currentMinute,
        description: `${eventType} by ${selectedTeam.name}`,
      };

      console.log(`📤 [${frontendRequestId}] FRONTEND: Calling API with event data:`, eventData);
      console.log(`📤 [${frontendRequestId}] FRONTEND: About to call apiService.addMatchEvent`);

      await apiService.addMatchEvent(matchId, eventData);
      
      console.log(`✅ [${frontendRequestId}] FRONTEND: API call completed successfully`);
      
      // Generate commentary
      const templates = COMMENTARY_TEMPLATES[eventType as keyof typeof COMMENTARY_TEMPLATES] || [];
      const template = templates[Math.floor(Math.random() * templates.length)];
      const commentary = template ? template.replace('{player}', player?.name || 'Unknown') : `${eventType} by ${player?.name || 'Unknown'}`;
      showCommentary(commentary);
      
      // Animate and vibrate for goals
      if (eventType === 'GOAL') {
        animateScore();
        Vibration.vibrate([0, 200, 100, 200]);
      } else {
        Vibration.vibrate(100);
      }

      console.log(`🔄 [${frontendRequestId}] FRONTEND: About to call loadMatchDetails to refresh match state`);
      await loadMatchDetails();
      console.log(`🔄 [${frontendRequestId}] FRONTEND: loadMatchDetails completed`);
      
    } catch (error: any) {
      console.error(`💥 [${frontendRequestId}] FRONTEND: Error in addEvent:`, error);
      Alert.alert('Error', error.message || 'Failed to add event');
    } finally {
      // Always reset processing state after request completes (success or error)
      setIsProcessingEvent(false);
      console.log(`🔄 [${frontendRequestId}] FRONTEND: Reset processing state`);
    }
  };

  const animateScore = () => {
    Animated.sequence([
      Animated.timing(scoreAnimation, {
        toValue: 1.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scoreAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const openEventModal = (team: any, eventType: string) => {
    console.log('🎯 Opening event modal:', {
      teamName: team?.name,
      teamId: team?.id,
      playersCount: team?.players?.length,
      players: team?.players,
      eventType
    });
    
    // Add small delay to ensure state is set before modal opens
    setSelectedTeam(team);
    setSelectedEventType(eventType);
    
    // Use setTimeout to ensure state is updated before modal shows
    setTimeout(() => {
      setShowEventModal(true);
    }, 50);
  };

  const endMatch = async () => {
    Alert.alert(
      'End Match',
      'Are you sure you want to end this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Match', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.endMatch(matchId);
              showCommentary("📢 Full time! The match has ended!");
              setTimeout(() => {
                navigation.goBack();
              }, 2000);
            } catch (error) {
              Alert.alert('Error', 'Failed to end match');
            }
          }
        }
      ]
    );
  };

  const renderPlayer = ({ item }: { item: Player }) => {
    return (
      <TouchableOpacity
        style={[styles.playerItem, isProcessingEvent && styles.disabledPlayerItem]}
        onPress={() => {
          if (!isProcessingEvent) {
            if (selectedEventType === 'GOAL') {
              // For goals, store scorer info and open assist modal
              setGoalScorerId(item.id);
              setGoalScorerTeam(selectedTeam);
              setShowEventModal(false);
              setShowAssistModal(true);
            } else {
              // For other events, proceed normally
              setShowEventModal(false);
              addEvent(item.id, selectedEventType);
            }
          }
        }}
        disabled={isProcessingEvent}
      >
        <View style={styles.playerItemContent}>
          <View style={[styles.playerNumber, { backgroundColor: getPositionColor(item.position) }]}>
            <Text style={styles.playerNumberText}>
              {item.jerseyNumber || '--'}
            </Text>
          </View>
          <View style={styles.playerDetails}>
            <Text style={[styles.playerName, isProcessingEvent && styles.disabledText]}>{item.name}</Text>
            <Text style={[styles.playerPosition, isProcessingEvent && styles.disabledText]}>{item.position}</Text>
          </View>
        </View>
        {isProcessingEvent && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="small" color="#666" />
          </View>
        )}
      </TouchableOpacity>
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

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'GOAL': return '⚽';
      case 'ASSIST': return '🤝';
      case 'YELLOW_CARD': return '🟨';
      case 'RED_CARD': return '🟥';
      case 'SUBSTITUTION': return '🔄';
      default: return '📝';
    }
  };

  const getEventDescription = (eventType: string) => {
    switch (eventType) {
      case 'GOAL': return 'Goal';
      case 'ASSIST': return 'Assist';
      case 'YELLOW_CARD': return 'Yellow Card';
      case 'RED_CARD': return 'Red Card';
      case 'SUBSTITUTION': return 'Substitution';
      case 'PENALTY': return 'Penalty';
      case 'OWN_GOAL': return 'Own Goal';
      case 'CORNER_KICK': return 'Corner Kick';
      case 'FREE_KICK': return 'Free Kick';
      case 'OFFSIDE': return 'Offside';
      case 'FOUL': return 'Foul';
      case 'INJURY': return 'Injury';
      default: return eventType ? eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Event';
    }
  };

  const renderEvent = (event: MatchEvent, index: number) => (
    <Animated.View 
      key={event.id} 
      style={[
        styles.eventItem,
        {
          opacity: 1,
          transform: [{
            translateX: 0
          }]
        }
      ]}
    >
      <View style={styles.eventMinute}>
        <Text style={styles.eventMinuteText}>{event.minute}'</Text>
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventIcon}>{getEventIcon(event.eventType)}</Text>
        <View style={styles.eventDetails}>
          <Text style={styles.eventPlayerName}>{event.player?.name}</Text>
          <Text style={styles.eventType}>
            {getEventDescription(event.eventType)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading match...</Text>
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
      {/* Header */}
      <View style={[styles.header, isLive && styles.liveHeader]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.backButton, { marginLeft: 10 }]}
          onPress={() => {
            console.log('🔄 Manual reload triggered');
            loadMatchDetails();
          }}
        >
          <Ionicons name="refresh-outline" size={20} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.matchInfo}>
          <Text style={styles.matchTitle}>
            {match.homeTeam?.name || match.home_team_name || 'Home'} vs {match.awayTeam?.name || match.away_team_name || 'Away'}
          </Text>
          {match.venue && (
            <Text style={styles.venue}>
              <Ionicons name="location" size={14} color="#fff" /> {match.venue}
            </Text>
          )}
          {match.match_date && (
            <Text style={styles.venue}>
              <Ionicons name="calendar" size={14} color="#fff" /> {new Date(match.match_date).toLocaleDateString()} at {new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
          <View style={styles.statusContainer}>
            {isLive && <View style={styles.liveDot} />}
            <Text style={[styles.status, isLive && styles.liveStatus]}>
              {isLive ? `LIVE - ${currentMinute}'` : match.status}
            </Text>
          </View>
        </View>
        
        {isLive && (
          <TouchableOpacity onPress={endMatch}>
            <Ionicons name="stop-circle" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Commentary */}
      {latestCommentary && (
        <Animated.View 
          style={[
            styles.commentaryBar,
            {
              opacity: commentaryAnimation,
              transform: [{
                translateY: commentaryAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0]
                })
              }]
            }
          ]}
        >
          <Text style={styles.commentaryText}>{latestCommentary}</Text>
        </Animated.View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Score Display */}
        <View style={styles.scoreSection}>
          <Animated.View style={[styles.scoreContainer, { transform: [{ scale: scoreAnimation }] }]}>
            <View style={styles.teamScoreSection}>
              <Text style={styles.teamName}>{match.homeTeam.name}</Text>
              <Text style={styles.score}>{match.homeScore}</Text>
            </View>
            
            <View style={styles.scoreCenter}>
              <Animated.View style={[
                styles.ballIcon,
                {
                  transform: [{
                    translateX: ballAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-30, 30]
                    })
                  }]
                }
              ]}>
                <Ionicons name="football" size={32} color="#fff" />
              </Animated.View>
            </View>
            
            <View style={styles.teamScoreSection}>
              <Text style={styles.teamName}>{match.awayTeam.name}</Text>
              <Text style={styles.score}>{match.awayScore}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Match Controls */}
        {!isLive && match.status === 'SCHEDULED' && (
          <View style={styles.controls}>
            <TouchableOpacity style={styles.startButton} onPress={startMatch}>
              <Ionicons name="play-circle" size={32} color="#fff" />
              <Text style={styles.startButtonText}>Start Match</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Live Controls */}
        {isLive && showQuickActions && (
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={[styles.quickAction, styles.goalAction, isProcessingEvent && styles.disabledAction]}
                onPress={() => !isProcessingEvent && openEventModal(match.homeTeam, 'GOAL')}
                disabled={isProcessingEvent}
              >
                <Ionicons name="football" size={24} color="#fff" />
                <Text style={styles.quickActionText}>{match.homeTeam.name}</Text>
                <Text style={styles.quickActionLabel}>Goal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickAction, styles.goalAction, isProcessingEvent && styles.disabledAction]}
                onPress={() => !isProcessingEvent && openEventModal(match.awayTeam, 'GOAL')}
                disabled={isProcessingEvent}
              >
                <Ionicons name="football" size={24} color="#fff" />
                <Text style={styles.quickActionText}>{match.awayTeam.name}</Text>
                <Text style={styles.quickActionLabel}>Goal</Text>
              </TouchableOpacity>
              
              
              <TouchableOpacity 
                style={[styles.quickAction, styles.cardAction, isProcessingEvent && styles.disabledAction]}
                onPress={() => !isProcessingEvent && openEventModal(match.homeTeam, 'YELLOW_CARD')}
                disabled={isProcessingEvent}
              >
                <Text style={styles.cardIcon}>🟨</Text>
                <Text style={styles.quickActionText}>{match.homeTeam.name}</Text>
                <Text style={styles.quickActionLabel}>Card</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickAction, styles.cardAction, isProcessingEvent && styles.disabledAction]}
                onPress={() => !isProcessingEvent && openEventModal(match.awayTeam, 'YELLOW_CARD')}
                disabled={isProcessingEvent}
              >
                <Text style={styles.cardIcon}>🟨</Text>
                <Text style={styles.quickActionText}>{match.awayTeam.name}</Text>
                <Text style={styles.quickActionLabel}>Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Team Lineups */}
        {match && (
          <View style={styles.lineupsContainer}>
            <TouchableOpacity 
              style={styles.lineupsHeader}
              onPress={() => setShowLineups(!showLineups)}
            >
              <Text style={styles.lineupsTitle}>Team Lineups</Text>
              <Ionicons 
                name={showLineups ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            {showLineups && (
              <View style={styles.lineupsContent}>
                {/* Team Names Side by Side */}
                <View style={styles.teamNamesRow}>
                  <Text style={styles.teamNameHeader}>{match.homeTeam?.name}</Text>
                  <Text style={styles.teamNameHeader}>{match.awayTeam?.name}</Text>
                </View>
                
                {/* Players Lists Side by Side */}
                <View style={styles.playersRow}>
                  {/* Home Team Players */}
                  <View style={styles.teamPlayersList}>
                    {match.homeTeam?.players?.map((player: any, index: number) => (
                      <TouchableOpacity 
                        key={player.id || index} 
                        style={styles.playerListItem}
                        onPress={() => {
                          // Navigate to player profile (placeholder for now)
                          console.log('Navigate to player profile:', player.id, player.name);
                        }}
                      >
                        <View style={[
                          styles.playerJerseyList, 
                          { backgroundColor: getPositionColor(player.position) }
                        ]}>
                          <Text style={styles.playerNumberList}>{player.jerseyNumber || index + 1}</Text>
                        </View>
                        <View style={styles.playerInfoList}>
                          <Text style={styles.playerNameList} numberOfLines={1}>
                            {player.name || 'Player'}
                          </Text>
                          <Text style={styles.playerPositionList}>{player.position}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {/* Away Team Players */}
                  <View style={styles.teamPlayersList}>
                    {match.awayTeam?.players?.map((player: any, index: number) => (
                      <TouchableOpacity 
                        key={player.id || index} 
                        style={styles.playerListItem}
                        onPress={() => {
                          // Navigate to player profile (placeholder for now)
                          console.log('Navigate to player profile:', player.id, player.name);
                        }}
                      >
                        <View style={[
                          styles.playerJerseyList, 
                          { backgroundColor: getPositionColor(player.position) }
                        ]}>
                          <Text style={styles.playerNumberList}>{player.jerseyNumber || index + 1}</Text>
                        </View>
                        <View style={styles.playerInfoList}>
                          <Text style={styles.playerNameList} numberOfLines={1}>
                            {player.name || 'Player'}
                          </Text>
                          <Text style={styles.playerPositionList}>{player.position}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Match Timeline */}
        <View style={styles.timelineContainer}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle}>Match Timeline</Text>
            <TouchableOpacity onPress={() => setShowQuickActions(!showQuickActions)}>
              <Ionicons 
                name={showQuickActions ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
          
          {match.events.length > 0 ? (
            <View style={styles.timeline}>
              {match.events.sort((a, b) => b.minute - a.minute).map(renderEvent)}
            </View>
          ) : (
            <View style={styles.noEvents}>
              <Ionicons name="time-outline" size={48} color="#ccc" />
              <Text style={styles.noEventsText}>No events yet</Text>
              <Text style={styles.noEventsSubtext}>
                {isLive ? "Add events using quick actions above" : "Start the match to begin"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Player Selection Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {getEventIcon(selectedEventType)} Select Player
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowEventModal(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            {selectedTeam?.name} - {selectedEventType ? selectedEventType.replace('_', ' ') : 'Unknown Event'}
          </Text>
          
          <View style={{ padding: 10, backgroundColor: '#f0f0f0', margin: 10, borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Debug Info: Team "{selectedTeam?.name}" has {selectedTeam?.players?.length || 0} players
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#007AFF', padding: 8, borderRadius: 4, marginTop: 8 }}
              onPress={() => {
                console.log('🔄 Refreshing modal data:', selectedTeam);
                setShowEventModal(false);
                setTimeout(() => openEventModal(selectedTeam, selectedEventType), 100);
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>Refresh Data</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={selectedTeam?.players || []}
            renderItem={renderPlayer}
            keyExtractor={(item) => item.id}
            style={styles.playersList}
            contentContainerStyle={styles.playersListContent}
            ListEmptyComponent={() => (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#666', fontSize: 16 }}>
                  No players available for {selectedTeam?.name}
                </Text>
                <Text style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
                  Players in team: {selectedTeam?.players?.length || 0}
                </Text>
                <Text style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                  Debug: {JSON.stringify(selectedTeam?.players || [])}
                </Text>
              </View>
            )}
          />
        </View>
      </Modal>

      {/* Assist Selection Modal */}
      <Modal
        visible={showAssistModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              🤝 Select Assist Player
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setShowAssistModal(false);
                setGoalScorerId(null);
                setGoalScorerTeam(null);
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            {goalScorerTeam?.name} - Who provided the assist?
          </Text>
          
          {/* None option */}
          <TouchableOpacity
            style={[styles.playerItem, { backgroundColor: '#e3f2fd', marginHorizontal: 20, marginTop: 10 }]}
            onPress={() => {
              if (goalScorerId) {
                setShowAssistModal(false);
                addGoalWithAssist(goalScorerId, null);
                setGoalScorerId(null);
                setGoalScorerTeam(null);
              }
            }}
          >
            <View style={styles.playerItemContent}>
              <View style={[styles.playerNumber, { backgroundColor: '#90a4ae' }]}>
                <Text style={styles.playerNumberText}>—</Text>
              </View>
              <View style={styles.playerDetails}>
                <Text style={styles.playerName}>No Assist</Text>
                <Text style={styles.playerPosition}>Goal was unassisted</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <FlatList
            data={goalScorerTeam?.players?.filter((player: Player) => player.id !== goalScorerId) || []}
            renderItem={({ item }: { item: Player }) => (
              <TouchableOpacity
                style={[styles.playerItem, isProcessingEvent && styles.disabledPlayerItem]}
                onPress={() => {
                  if (!isProcessingEvent && goalScorerId) {
                    setShowAssistModal(false);
                    addGoalWithAssist(goalScorerId, item.id);
                    setGoalScorerId(null);
                    setGoalScorerTeam(null);
                  }
                }}
                disabled={isProcessingEvent}
              >
                <View style={styles.playerItemContent}>
                  <View style={[styles.playerNumber, { backgroundColor: getPositionColor(item.position) }]}>
                    <Text style={styles.playerNumberText}>
                      {item.jerseyNumber || '--'}
                    </Text>
                  </View>
                  <View style={styles.playerDetails}>
                    <Text style={[styles.playerName, isProcessingEvent && styles.disabledText]}>{item.name}</Text>
                    <Text style={[styles.playerPosition, isProcessingEvent && styles.disabledText]}>{item.position}</Text>
                  </View>
                </View>
                {isProcessingEvent && (
                  <View style={styles.processingOverlay}>
                    <ActivityIndicator size="small" color="#666" />
                  </View>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            style={styles.playersList}
            contentContainerStyle={styles.playersListContent}
            ListEmptyComponent={() => (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#666', fontSize: 16 }}>
                  No other players available for assist
                </Text>
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveHeader: {
    backgroundColor: '#d32f2f',
  },
  backButton: {
    padding: 8,
  },
  matchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  venue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
    opacity: 0.9,
  },
  status: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  liveStatus: {
    color: '#ffeb3b',
  },
  commentaryBar: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  commentaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  scoreSection: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamScoreSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  scoreCenter: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballIcon: {
    backgroundColor: '#2E7D32',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    padding: 24,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  quickActionsContainer: {
    margin: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalAction: {
    backgroundColor: '#4CAF50',
  },
  assistAction: {
    backgroundColor: '#2196F3',
  },
  cardAction: {
    backgroundColor: '#FF9800',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  quickActionLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  cardIcon: {
    fontSize: 24,
  },
  timelineContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  timeline: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  eventMinute: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventMinuteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  eventContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventIcon: {
    fontSize: 24,
  },
  eventDetails: {
    flex: 1,
  },
  eventPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  eventType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  noEvents: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  closeButton: {
    padding: 8,
  },
  playersList: {
    flex: 1,
  },
  playersListContent: {
    padding: 20,
  },
  playerItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  disabledPlayerItem: {
    backgroundColor: '#e0e0e0',
    opacity: 0.6,
  },
  playerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  playerNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  playerNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 14,
    color: '#666',
  },
  disabledText: {
    color: '#999',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledAction: {
    opacity: 0.5,
  },
  lineupsContainer: {
    margin: 24,
    marginTop: 32,
    marginBottom: 32,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  lineupsHeader: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineupsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  lineupsContent: {
    padding: 28,
    paddingTop: 32,
    paddingBottom: 32,
    gap: 36,
  },
  teamLineup: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  teamLineupsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  lineupPlayer: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f2f5',
  },
  playerJerseyMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  playerNumberMini: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerInfoMini: {
    flex: 1,
  },
  playerNameMini: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  playerPositionMini: {
    fontSize: 12,
    color: '#666',
  },
  // New List-Based Lineup Styles
  teamNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamNameHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  playersRow: {
    flexDirection: 'row',
    gap: 16,
  },
  teamPlayersList: {
    flex: 1,
  },
  playerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f2f5',
  },
  playerJerseyList: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerNumberList: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerInfoList: {
    flex: 1,
  },
  playerNameList: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  playerPositionList: {
    fontSize: 11,
    color: '#666',
  },
});