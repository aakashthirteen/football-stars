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
import PitchFormation from '../../components/PitchFormation';

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

const TABS = ['Actions', 'Formation', 'Commentary', 'Timeline'];

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
  // BUG FIX: Add optional chaining and fallback for route params
  const { matchId } = route?.params || {};
  const [match, setMatch] = useState<Match | null>(null);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [latestCommentary, setLatestCommentary] = useState<string>('');
  const [isProcessingEvent, setIsProcessingEvent] = useState(false);
  const [lastEventTime, setLastEventTime] = useState(0);
  const [goalScorerId, setGoalScorerId] = useState<string | null>(null);
  const [showAssistModal, setShowAssistModal] = useState(false);
  const [goalScorerTeam, setGoalScorerTeam] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Actions');
  const [commentaryHistory, setCommentaryHistory] = useState<string[]>([]);
  
  const scoreAnimation = useRef(new Animated.Value(1)).current;
  const commentaryAnimation = useRef(new Animated.Value(0)).current;
  const ballAnimation = useRef(new Animated.Value(0)).current;
  const tabSlideAnimation = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    // Animate tab change
    Animated.timing(tabSlideAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      tabSlideAnimation.setValue(0);
    });
  }, [activeTab]);

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
      
      // BUG FIX: Ensure events array exists and is valid
      if (!matchData.events || !Array.isArray(matchData.events)) {
        matchData.events = [];
      }
      
      // BUG FIX: Ensure team objects and players arrays exist
      if (!matchData.homeTeam) {
        matchData.homeTeam = { name: 'Home Team', players: [] };
      }
      if (!matchData.awayTeam) {
        matchData.awayTeam = { name: 'Away Team', players: [] };
      }
      if (!matchData.homeTeam.players || !Array.isArray(matchData.homeTeam.players)) {
        matchData.homeTeam.players = [];
      }
      if (!matchData.awayTeam.players || !Array.isArray(matchData.awayTeam.players)) {
        matchData.awayTeam.players = [];
      }
      
      // Ensure scores are properly mapped from database fields
      matchData.homeScore = matchData.homeScore || matchData.home_score || 0;
      matchData.awayScore = matchData.awayScore || matchData.away_score || 0;
      
      setMatch(matchData);
      setIsLive(matchData.status === 'LIVE');
      
      if (matchData.status === 'LIVE' && (matchData.matchDate || matchData.match_date)) {
        try {
          const matchDateValue = matchData.matchDate || matchData.match_date;
          const matchStart = new Date(matchDateValue);
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - matchStart.getTime()) / (1000 * 60));
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
    setCommentaryHistory(prev => [text, ...prev]);
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

    try {
      // BUG FIX: Add null checking for players array
      const goalScorer = goalScorerTeam?.players?.find((p: Player) => p.id === goalScorerId);
      
      // Create goal event
      const goalEventData = {
        playerId: goalScorerId,
        teamId: goalScorerTeam.id,
        eventType: 'GOAL',
        minute: currentMinute,
        description: `GOAL by ${goalScorerTeam.name}`,
      };

      await apiService.addMatchEvent(matchId, goalEventData);
      
      // Create assist event if there's an assist
      if (assistPlayerId) {
        // BUG FIX: Add null checking for players array
        const assistPlayer = goalScorerTeam?.players?.find((p: Player) => p.id === assistPlayerId);
        const assistEventData = {
          playerId: assistPlayerId,
          teamId: goalScorerTeam.id,
          eventType: 'ASSIST',
          minute: currentMinute,
          description: `ASSIST by ${goalScorerTeam.name}`,
        };
        
        await apiService.addMatchEvent(matchId, assistEventData);
      }
      
      // Generate commentary
      const assistPlayer = assistPlayerId ? goalScorerTeam?.players?.find((p: Player) => p.id === assistPlayerId) : null;
      
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

      await loadMatchDetails();
      
    } catch (error: any) {
      console.error(`💥 [${frontendRequestId}] FRONTEND: Error in addGoalWithAssist:`, error);
      Alert.alert('Error', error.message || 'Failed to add goal and assist events');
    } finally {
      setIsProcessingEvent(false);
    }
  };

  const addEvent = async (playerId: string, eventType: string) => {
    if (!selectedTeam || !match) return;
    
    const now = Date.now();
    const frontendRequestId = now + '-' + Math.random().toString(36).substr(2, 9);
    
    if (isProcessingEvent) {
      return;
    }
    
    if (now - lastEventTime < 1000) {
      return;
    }
    
    setIsProcessingEvent(true);
    setLastEventTime(now);

    try {
      // BUG FIX: Add null checking for players array
      const player = selectedTeam?.players?.find((p: Player) => p.id === playerId);
      const eventData = {
        playerId,
        teamId: selectedTeam.id,
        eventType,
        minute: currentMinute,
        description: `${eventType} by ${selectedTeam.name}`,
      };

      await apiService.addMatchEvent(matchId, eventData);
      
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

      await loadMatchDetails();
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add event');
    } finally {
      setIsProcessingEvent(false);
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
    setSelectedTeam(team);
    setSelectedEventType(eventType);
    
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
              
              // Navigate to rating screen or match overview
              setTimeout(() => {
                navigation.replace('PlayerRating', { matchId });
              }, 1500);
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
              setGoalScorerId(item.id);
              setGoalScorerTeam(selectedTeam);
              setShowEventModal(false);
              setShowAssistModal(true);
            } else {
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Actions':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Quick Actions */}
            {isLive && (
              <View style={styles.quickActionsContainer}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                
                <View style={styles.actionsGrid}>
                  <TouchableOpacity 
                    style={[styles.actionCard, styles.goalCard]}
                    onPress={() => openEventModal(match?.homeTeam, 'GOAL')}
                  >
                    <Ionicons name="football" size={32} color="#fff" />
                    <Text style={styles.actionTitle}>Goal</Text>
                    <Text style={styles.actionTeam}>{match?.homeTeam?.name}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionCard, styles.goalCard]}
                    onPress={() => openEventModal(match?.awayTeam, 'GOAL')}
                  >
                    <Ionicons name="football" size={32} color="#fff" />
                    <Text style={styles.actionTitle}>Goal</Text>
                    <Text style={styles.actionTeam}>{match?.awayTeam?.name}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionCard, styles.cardCard]}
                    onPress={() => openEventModal(match?.homeTeam, 'YELLOW_CARD')}
                  >
                    <Text style={styles.cardEmoji}>🟨</Text>
                    <Text style={styles.actionTitle}>Yellow</Text>
                    <Text style={styles.actionTeam}>{match?.homeTeam?.name}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionCard, styles.cardCard]}
                    onPress={() => openEventModal(match?.awayTeam, 'YELLOW_CARD')}
                  >
                    <Text style={styles.cardEmoji}>🟨</Text>
                    <Text style={styles.actionTitle}>Yellow</Text>
                    <Text style={styles.actionTeam}>{match?.awayTeam?.name}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionCard, styles.redCardCard]}
                    onPress={() => openEventModal(match?.homeTeam, 'RED_CARD')}
                  >
                    <Text style={styles.cardEmoji}>🟥</Text>
                    <Text style={styles.actionTitle}>Red</Text>
                    <Text style={styles.actionTeam}>{match?.homeTeam?.name}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionCard, styles.redCardCard]}
                    onPress={() => openEventModal(match?.awayTeam, 'RED_CARD')}
                  >
                    <Text style={styles.cardEmoji}>🟥</Text>
                    <Text style={styles.actionTitle}>Red</Text>
                    <Text style={styles.actionTeam}>{match?.awayTeam?.name}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* Match Controls */}
            {!isLive && match?.status === 'SCHEDULED' && (
              <View style={styles.matchControlsContainer}>
                <TouchableOpacity style={styles.startMatchButton} onPress={startMatch}>
                  <Ionicons name="play" size={24} color="#fff" />
                  <Text style={styles.startMatchText}>Start Match</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {isLive && (
              <View style={styles.matchControlsContainer}>
                <TouchableOpacity style={styles.endMatchButton} onPress={endMatch}>
                  <Ionicons name="stop" size={24} color="#fff" />
                  <Text style={styles.endMatchText}>End Match</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        );
        
      case 'Formation':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {match && match.homeTeam && match.awayTeam && (
              <View style={styles.formationContainer}>
                <PitchFormation
                  homeTeam={match.homeTeam}
                  awayTeam={match.awayTeam}
                  onPlayerPress={(player) => {
                    console.log('Player pressed:', player.name);
                  }}
                  showPlayerNames={true}
                />
              </View>
            )}
          </ScrollView>
        );
        
      case 'Commentary':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.commentaryContainer}>
              <Text style={styles.sectionTitle}>Live Commentary</Text>
              {commentaryHistory.length > 0 ? (
                commentaryHistory.map((comment, index) => (
                  <View key={index} style={styles.commentaryItem}>
                    <Text style={styles.commentaryText}>{comment}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No commentary yet</Text>
                </View>
              )}
            </View>
          </ScrollView>
        );
        
      case 'Timeline':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.timelineContainer}>
              <Text style={styles.sectionTitle}>Match Events</Text>
              {/* BUG FIX: Add null checking for events array */}
              {match && match.events && match.events.length > 0 ? (
                match.events
                  .sort((a, b) => b.minute - a.minute)
                  .map((event, index) => renderEvent(event, index))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No events yet</Text>
                </View>
              )}
            </View>
          </ScrollView>
        );
        
      default:
        return <View />;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00E676" />
        <Text style={styles.loadingText}>Loading match...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Match not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMatchDetails}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
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
        
        <View style={styles.headerCenter}>
          <Text style={styles.matchTitle}>
            {match.homeTeam?.name} vs {match.awayTeam?.name}
          </Text>
          {isLive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE - {currentMinute}'</Text>
            </View>
          )}
          {!isLive && (
            <Text style={styles.statusText}>{match.status}</Text>
          )}
        </View>
        
        <TouchableOpacity onPress={loadMatchDetails}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Live Commentary Bar */}
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
          <Text style={styles.liveCommentary}>{latestCommentary}</Text>
        </Animated.View>
      )}

      {/* Score Section */}
      <View style={styles.scoreSection}>
        <Animated.View style={[styles.scoreContainer, { transform: [{ scale: scoreAnimation }] }]}>
          <View style={styles.teamScore}>
            <Text style={styles.teamName}>{match.homeTeam?.name}</Text>
            <Text style={styles.score}>{match.homeScore}</Text>
          </View>
          
          <View style={styles.scoreCenter}>
            <Animated.View style={[
              styles.ballContainer,
              {
                transform: [{
                  translateX: ballAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 20]
                  })
                }]
              }
            ]}>
              <Ionicons name="football" size={24} color="#00E676" />
            </Animated.View>
          </View>
          
          <View style={styles.teamScore}>
            <Text style={styles.teamName}>{match.awayTeam?.name}</Text>
            <Text style={styles.score}>{match.awayScore}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {/* BUG FIX: Add null checking for TABS array */}
          {TABS?.map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          )) || []}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: tabSlideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1]
            }),
            transform: [{
              translateY: tabSlideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0]
              })
            }]
          }
        ]}
      >
        {renderTabContent()}
      </Animated.View>

      {/* Player Selection Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select Player - {getEventDescription(selectedEventType)}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowEventModal(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Team: {selectedTeam?.name}
          </Text>
          
          <FlatList
            data={selectedTeam?.players || []}
            renderItem={renderPlayer}
            keyExtractor={(item) => item.id || item.name}
            style={styles.playersList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No players available</Text>
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
        onRequestClose={() => setShowAssistModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Assist Provider</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowAssistModal(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={goalScorerTeam?.players?.filter((p: any) => p.id !== goalScorerId) || []}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.playerItem, isProcessingEvent && styles.disabledPlayerItem]}
                onPress={() => {
                  if (!isProcessingEvent) {
                    addGoalWithAssist(goalScorerId!, item.id);
                    setShowAssistModal(false);
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
            keyExtractor={(item) => item.id || item.name}
            style={styles.playersList}
            showsVerticalScrollIndicator={false}
          />
          
          <TouchableOpacity 
            style={[styles.skipButton, isProcessingEvent && styles.disabledAction]}
            onPress={() => {
              if (!isProcessingEvent) {
                addGoalWithAssist(goalScorerId!, null);
                setShowAssistModal(false);
                setGoalScorerId(null);
                setGoalScorerTeam(null);
              }
            }}
            disabled={isProcessingEvent}
          >
            <Text style={styles.skipButtonText}>No Assist</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  errorText: {
    color: '#ff5252',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#00E676',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  liveHeader: {
    backgroundColor: '#00C853',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  matchTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff1744',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusText: {
    color: '#B0BEC5',
    fontSize: 12,
    marginTop: 4,
  },
  commentaryBar: {
    backgroundColor: '#ff6b35',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  liveCommentary: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  scoreSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  teamScore: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  score: {
    color: '#00E676',
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreCenter: {
    flex: 1,
    alignItems: 'center',
  },
  ballContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#00E676',
  },
  tabText: {
    color: '#B0BEC5',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  goalCard: {
    backgroundColor: '#00C853',
  },
  cardCard: {
    backgroundColor: '#ff8f00',
  },
  redCardCard: {
    backgroundColor: '#f44336',
  },
  actionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  actionTeam: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
    marginTop: 4,
    textAlign: 'center',
  },
  cardEmoji: {
    fontSize: 32,
  },
  matchControlsContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  startMatchButton: {
    backgroundColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  startMatchText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  endMatchButton: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  endMatchText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  formationContainer: {
    alignItems: 'center',
  },
  commentaryContainer: {
    // Commentary specific styles
  },
  commentaryItem: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentaryText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  timelineContainer: {
    // Timeline specific styles
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventMinute: {
    width: 40,
    alignItems: 'center',
  },
  eventMinuteText: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  eventIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  eventDetails: {
    flex: 1,
  },
  eventPlayerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  eventType: {
    color: '#B0BEC5',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#1E1E1E',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalSubtitle: {
    color: '#B0BEC5',
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 8,
  },
  playersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    position: 'relative',
  },
  disabledPlayerItem: {
    opacity: 0.6,
  },
  playerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerNumberText: {
    color: '#fff',
    fontSize: 14,
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
    color: '#B0BEC5',
    fontSize: 14,
  },
  disabledText: {
    color: '#666',
  },
  processingOverlay: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  skipButton: {
    backgroundColor: '#37474F',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 8,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledAction: {
    opacity: 0.5,
  },
});