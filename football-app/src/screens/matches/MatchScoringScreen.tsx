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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import PitchFormation from '../../components/PitchFormation';
import { Colors, Gradients } from '../../theme/colors';

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

const TABS = ['Actions', 'Formation', 'Commentary', 'Events'];

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
  const [isProcessingEvent, setIsProcessingEvent] = useState(false);
  const [lastEventTime, setLastEventTime] = useState(0);
  const [goalScorerId, setGoalScorerId] = useState<string | null>(null);
  const [showAssistModal, setShowAssistModal] = useState(false);
  const [goalScorerTeam, setGoalScorerTeam] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [commentary, setCommentary] = useState<string[]>([]);
  
  const scoreAnimation = useRef(new Animated.Value(1)).current;
  const commentaryAnimation = useRef(new Animated.Value(0)).current;
  const ballAnimation = useRef(new Animated.Value(0)).current;
  const tabAnimation = useRef(new Animated.Value(0)).current;

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
    Animated.spring(tabAnimation, {
      toValue: activeTab,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
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
      
      // Ensure events array exists
      if (!matchData.events) {
        matchData.events = [];
      }
      
      // Ensure scores are properly mapped
      matchData.homeScore = matchData.homeScore || matchData.home_score || 0;
      matchData.awayScore = matchData.awayScore || matchData.away_score || 0;
      
      setMatch(matchData);
      setIsLive(matchData.status === 'LIVE');
      
      // Generate commentary from events
      generateCommentaryFromEvents(matchData.events);
      
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

  const generateCommentaryFromEvents = (events: MatchEvent[]) => {
    const newCommentary = events
      .sort((a, b) => b.minute - a.minute)
      .map(event => {
        const templates = COMMENTARY_TEMPLATES[event.eventType as keyof typeof COMMENTARY_TEMPLATES] || [];
        const template = templates[0] || `${event.eventType} by ${event.player?.name || 'Unknown'}`;
        return `${event.minute}' - ${template.replace('{player}', event.player?.name || 'Unknown')}`;
      });
    setCommentary(newCommentary);
  };

  const startMatch = async () => {
    try {
      await apiService.startMatch(matchId);
      setIsLive(true);
      setCurrentMinute(0);
      addCommentary("⚽ Kick-off! The match has begun!");
      Vibration.vibrate(100);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start match');
    }
  };

  const addCommentary = (text: string) => {
    const newEntry = `${currentMinute}' - ${text}`;
    setCommentary(prev => [newEntry, ...prev]);
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
    if (isProcessingEvent || now - lastEventTime < 1000) return;
    
    setIsProcessingEvent(true);
    setLastEventTime(now);

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
        
        await apiService.addMatchEvent(matchId, assistEventData);
      }
      
      // Generate commentary
      const assistPlayer = assistPlayerId ? goalScorerTeam.players.find((p: Player) => p.id === assistPlayerId) : null;
      
      let commentaryText;
      if (assistPlayer) {
        commentaryText = `⚽ GOOOOOAL! ${goalScorer?.name} scores with an assist from ${assistPlayer.name}!`;
      } else {
        const templates = COMMENTARY_TEMPLATES.GOAL;
        const template = templates[Math.floor(Math.random() * templates.length)];
        commentaryText = template.replace('{player}', goalScorer?.name || 'Unknown');
      }
      
      addCommentary(commentaryText);
      animateScore();
      Vibration.vibrate([0, 200, 100, 200]);

      await loadMatchDetails();
      
    } catch (error: any) {
      console.error('Error in addGoalWithAssist:', error);
      Alert.alert('Error', error.message || 'Failed to add goal and assist events');
    } finally {
      setIsProcessingEvent(false);
    }
  };

  const addEvent = async (playerId: string, eventType: string) => {
    if (!selectedTeam || !match) return;
    
    const now = Date.now();
    if (isProcessingEvent || now - lastEventTime < 1000) return;
    
    setIsProcessingEvent(true);
    setLastEventTime(now);

    try {
      const player = selectedTeam.players.find((p: Player) => p.id === playerId);
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
      const commentaryText = template ? template.replace('{player}', player?.name || 'Unknown') : `${eventType} by ${player?.name || 'Unknown'}`;
      addCommentary(commentaryText);
      
      // Animate and vibrate for goals
      if (eventType === 'GOAL') {
        animateScore();
        Vibration.vibrate([0, 200, 100, 200]);
      } else {
        Vibration.vibrate(100);
      }

      await loadMatchDetails();
      
    } catch (error: any) {
      console.error('Error in addEvent:', error);
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
              addCommentary("📢 Full time! The match has ended!");
              
              // Navigate to player rating screen for the home team
              setTimeout(() => {
                navigation.navigate('PlayerRating', {
                  matchId: matchId,
                  teamId: match.homeTeam.id,
                  teamName: match.homeTeam.name
                });
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
          <LinearGradient
            colors={[getPositionColor(item.position), Colors.primary.main]}
            style={styles.playerNumber}
          >
            <Text style={styles.playerNumberText}>
              {item.jerseyNumber || getPositionAbbr(item.position)}
            </Text>
          </LinearGradient>
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

  const getPositionAbbr = (position: string): string => {
    switch (position) {
      case 'GK': return 'GK';
      case 'DEF': return 'DF';
      case 'MID': return 'MF';
      case 'FWD': return 'FW';
      default: return position.substring(0, 2).toUpperCase();
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
      key={event.id || index} 
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

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
      >
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === index && styles.activeTab,
            ]}
            onPress={() => setActiveTab(index)}
          >
            <Text style={[
              styles.tabText,
              activeTab === index && styles.activeTabText,
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            transform: [{
              translateX: tabAnimation.interpolate({
                inputRange: [0, 1, 2, 3],
                outputRange: [0, (width - 40) / 4, ((width - 40) / 4) * 2, ((width - 40) / 4) * 3],
              }),
            }],
          },
        ]}
      />
    </View>
  );

  const renderActionsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {!isLive && match?.status === 'SCHEDULED' && (
        <View style={styles.startMatchContainer}>
          <TouchableOpacity style={styles.startButton} onPress={startMatch}>
            <LinearGradient
              colors={Gradients.primary}
              style={styles.startButtonGradient}
            >
              <Ionicons name="play-circle" size={32} color="#fff" />
              <Text style={styles.startButtonText}>Start Match</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {isLive && (
        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickAction, isProcessingEvent && styles.disabledAction]}
              onPress={() => !isProcessingEvent && openEventModal(match?.homeTeam, 'GOAL')}
              disabled={isProcessingEvent}
            >
              <LinearGradient
                colors={Gradients.victory}
                style={styles.quickActionGradient}
              >
                <Ionicons name="football" size={24} color="#fff" />
                <Text style={styles.quickActionText}>{match?.homeTeam.name}</Text>
                <Text style={styles.quickActionLabel}>Goal</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, isProcessingEvent && styles.disabledAction]}
              onPress={() => !isProcessingEvent && openEventModal(match?.awayTeam, 'GOAL')}
              disabled={isProcessingEvent}
            >
              <LinearGradient
                colors={Gradients.victory}
                style={styles.quickActionGradient}
              >
                <Ionicons name="football" size={24} color="#fff" />
                <Text style={styles.quickActionText}>{match?.awayTeam.name}</Text>
                <Text style={styles.quickActionLabel}>Goal</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, isProcessingEvent && styles.disabledAction]}
              onPress={() => !isProcessingEvent && openEventModal(match?.homeTeam, 'YELLOW_CARD')}
              disabled={isProcessingEvent}
            >
              <LinearGradient
                colors={[Colors.warning, '#F57C00']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.cardIcon}>🟨</Text>
                <Text style={styles.quickActionText}>{match?.homeTeam.name}</Text>
                <Text style={styles.quickActionLabel}>Card</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, isProcessingEvent && styles.disabledAction]}
              onPress={() => !isProcessingEvent && openEventModal(match?.awayTeam, 'YELLOW_CARD')}
              disabled={isProcessingEvent}
            >
              <LinearGradient
                colors={[Colors.warning, '#F57C00']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.cardIcon}>🟨</Text>
                <Text style={styles.quickActionText}>{match?.awayTeam.name}</Text>
                <Text style={styles.quickActionLabel}>Card</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* More Actions */}
          <View style={styles.moreActionsContainer}>
            <Text style={styles.moreActionsTitle}>More Actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity 
                style={styles.moreAction}
                onPress={() => !isProcessingEvent && openEventModal(match?.homeTeam, 'RED_CARD')}
                disabled={isProcessingEvent}
              >
                <Text style={styles.moreActionIcon}>🟥</Text>
                <Text style={styles.moreActionText}>Red Card</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.moreAction}
                onPress={() => !isProcessingEvent && openEventModal(match?.homeTeam, 'SUBSTITUTION')}
                disabled={isProcessingEvent}
              >
                <Text style={styles.moreActionIcon}>🔄</Text>
                <Text style={styles.moreActionText}>Substitution</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.moreAction}
                onPress={() => !isProcessingEvent && openEventModal(match?.homeTeam, 'PENALTY')}
                disabled={isProcessingEvent}
              >
                <Text style={styles.moreActionIcon}>🎯</Text>
                <Text style={styles.moreActionText}>Penalty</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.moreAction}
                onPress={() => !isProcessingEvent && openEventModal(match?.homeTeam, 'INJURY')}
                disabled={isProcessingEvent}
              >
                <Text style={styles.moreActionIcon}>🏥</Text>
                <Text style={styles.moreActionText}>Injury</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {match?.status === 'COMPLETED' && (
        <View style={styles.completedMatchContainer}>
          <Text style={styles.completedMatchText}>Match Completed</Text>
          <TouchableOpacity 
            style={styles.viewSummaryButton}
            onPress={() => navigation.navigate('MatchSummary', { matchId })}
          >
            <LinearGradient
              colors={Gradients.primary}
              style={styles.viewSummaryButtonGradient}
            >
              <Text style={styles.viewSummaryButtonText}>View Summary</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderFormationTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {match && match.homeTeam && match.awayTeam && (
        <PitchFormation
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          onPlayerPress={(player) => {
            console.log('Player pressed:', player.name);
            // Future: Navigate to player profile or show stats
          }}
          showPlayerNames={true}
        />
      )}
    </ScrollView>
  );

  const renderCommentaryTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.commentaryContainer}>
        {commentary.length > 0 ? (
          commentary.map((entry, index) => (
            <View key={index} style={styles.commentaryEntry}>
              <Text style={styles.commentaryText}>{entry}</Text>
            </View>
          ))
        ) : (
          <View style={styles.noCommentary}>
            <Ionicons name="megaphone-outline" size={48} color={Colors.text.tertiary} />
            <Text style={styles.noCommentaryText}>No commentary yet</Text>
            <Text style={styles.noCommentarySubtext}>
              {isLive ? "Events will appear here as they happen" : "Start the match to see live commentary"}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderEventsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.eventsContainer}>
        {match?.events && match.events.length > 0 ? (
          <View style={styles.timeline}>
            {match.events.sort((a, b) => b.minute - a.minute).map(renderEvent)}
          </View>
        ) : (
          <View style={styles.noEvents}>
            <Ionicons name="time-outline" size={48} color={Colors.text.tertiary} />
            <Text style={styles.noEventsText}>No events yet</Text>
            <Text style={styles.noEventsSubtext}>
              {isLive ? "Add events using the Actions tab" : "Start the match to begin"}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderActionsTab();
      case 1:
        return renderFormationTab();
      case 2:
        return renderCommentaryTab();
      case 3:
        return renderEventsTab();
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
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
      <LinearGradient
        colors={['#0A0E27', '#1A1F3A']}
        style={styles.backgroundGradient}
      />
      
      {/* Header */}
      <LinearGradient
        colors={isLive ? Gradients.live : Gradients.field}
        style={styles.header}
      >
        <View style={styles.headerTop}>
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
              {match.homeTeam?.name || 'Home'} vs {match.awayTeam?.name || 'Away'}
            </Text>
            {match.venue && (
              <Text style={styles.venue}>
                <Ionicons name="location" size={14} color="#fff" /> {match.venue}
              </Text>
            )}
          </View>
          
          {isLive && (
            <TouchableOpacity onPress={endMatch} style={styles.endButton}>
              <Ionicons name="stop-circle" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Live Status Bar */}
        <View style={styles.statusBar}>
          {isLive && <View style={styles.liveDot} />}
          <Text style={[styles.status, isLive && styles.liveStatus]}>
            {isLive ? `LIVE - ${currentMinute}'` : match.status}
          </Text>
        </View>
      </LinearGradient>

      {/* Commentary Notification */}
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
          <Text style={styles.commentaryNotification}>{latestCommentary}</Text>
        </Animated.View>
      )}

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

      {/* Tabs */}
      {renderTabs()}

      {/* Tab Content */}
      <View style={styles.tabContentContainer}>
        {renderTabContent()}
      </View>

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
            {selectedTeam?.name} - {getEventDescription(selectedEventType)}
          </Text>
          
          <FlatList
            data={selectedTeam?.players || []}
            renderItem={renderPlayer}
            keyExtractor={(item) => item.id}
            style={styles.playersList}
            contentContainerStyle={styles.playersListContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyPlayers}>
                <Text style={styles.emptyPlayersText}>
                  No players available for {selectedTeam?.name}
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
            style={[styles.playerItem, styles.noAssistOption]}
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
              <LinearGradient
                colors={['#90a4ae', '#607d8b']}
                style={styles.playerNumber}
              >
                <Text style={styles.playerNumberText}>—</Text>
              </LinearGradient>
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
                  <LinearGradient
                    colors={[getPositionColor(item.position), Colors.primary.main]}
                    style={styles.playerNumber}
                  >
                    <Text style={styles.playerNumberText}>
                      {item.jerseyNumber || getPositionAbbr(item.position)}
                    </Text>
                  </LinearGradient>
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
              <View style={styles.emptyPlayers}>
                <Text style={styles.emptyPlayersText}>
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
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.status.error,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  endButton: {
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
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
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
    backgroundColor: Colors.background.elevated,
    paddingVertical: 12,
    paddingHorizontal: 20,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 160 : 140,
    left: 20,
    right: 20,
    borderRadius: 12,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.medium,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  commentaryNotification: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  scoreSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.light,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  teamScoreSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  scoreCenter: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballIcon: {
    backgroundColor: Colors.primary.main,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    backgroundColor: Colors.background.card,
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.light,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabsScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    minWidth: (width - 40) / 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  activeTabText: {
    color: Colors.primary.main,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 4,
    width: (width - 48) / 4,
    height: 40,
    backgroundColor: Colors.primary.light + '20',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabContentContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  tabContent: {
    flex: 1,
  },
  startMatchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  startButton: {
    borderRadius: 30,
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
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  quickActionsContainer: {
    paddingTop: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.light,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  quickActionGradient: {
    padding: 16,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  cardIcon: {
    fontSize: 24,
  },
  disabledAction: {
    opacity: 0.5,
  },
  moreActionsContainer: {
    marginTop: 16,
  },
  moreActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  moreAction: {
    backgroundColor: Colors.background.elevated,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  moreActionIcon: {
    fontSize: 20,
  },
  moreActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  completedMatchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  completedMatchText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 24,
  },
  viewSummaryButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  viewSummaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  viewSummaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commentaryContainer: {
    paddingVertical: 16,
  },
  commentaryEntry: {
    backgroundColor: Colors.background.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.main,
  },
  commentaryText: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  noCommentary: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noCommentaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: 12,
  },
  noCommentarySubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  eventsContainer: {
    paddingVertical: 16,
  },
  timeline: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.light,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  eventMinute: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventMinuteText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.main,
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
    color: Colors.text.primary,
  },
  eventType: {
    fontSize: 14,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  noEvents: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noEventsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: 12,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.background.elevated,
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
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  noAssistOption: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: Colors.background.elevated,
  },
  disabledPlayerItem: {
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
    color: Colors.text.primary,
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  disabledText: {
    color: Colors.text.tertiary,
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
  emptyPlayers: {
    padding: 40,
    alignItems: 'center',
  },
  emptyPlayersText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});