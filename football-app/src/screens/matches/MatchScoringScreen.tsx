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
import { useMatchNotifications } from '../../hooks/useNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    "🎯 {player} with a clinical finish! The crowd goes wild!",
    "WHAT A GOAL! 🚀 {player} sends the fans into raptures!",
    "BRILLIANT! ⭐ {player} with a moment of pure magic!",
    "GOAL OF THE SEASON! 🌟 {player} produces something special!",
    "UNSTOPPABLE! 💥 {player} with a thunderous strike!"
  ],
  ASSIST: [
    "🤝 Great assist from {player}!",
    "👏 {player} with the perfect pass!",
    "🎯 {player} sets it up beautifully!",
    "VISION! 👁️ {player} spots the opportunity perfectly!",
    "CLEVER PLAY! 🧠 {player} with the decisive pass!",
    "TEAMWORK! 🤝 {player} creates the chance!"
  ],
  YELLOW_CARD: [
    "🟨 {player} sees yellow for that challenge",
    "Referee shows {player} a yellow card",
    "⚠️ {player} needs to be careful now with that yellow",
    "BOOKED! 📖 {player} goes into the referee's notebook",
    "CAUTION! ⚠️ {player} walks a tightrope now"
  ],
  RED_CARD: [
    "🟥 {player} is sent off! Down to 10 men!",
    "RED CARD! {player} has to leave the field",
    "💔 Disaster for the team as {player} sees red",
    "SENDING OFF! 🚫 {player} gets an early shower!",
    "CATASTROPHE! 😱 {player} receives his marching orders!"
  ],
  SAVE: [
    "SAVE! 🧤 The goalkeeper denies {player}!",
    "BRILLIANT STOP! 💪 What reflexes from the keeper!",
    "DENIED! ✋ The shot is kept out!",
    "SPECTACULAR SAVE! 🌟 The keeper stands tall!"
  ],
  MISS: [
    "CLOSE! 😬 {player} just misses the target!",
    "SO NEAR! 📏 {player} inches away from glory!",
    "UNLUCKY! 🎯 {player} almost found the corner!",
    "CHANCE GONE! 💨 {player} will be disappointed with that!"
  ],
  SUBSTITUTION: [
    "CHANGE! 🔄 {player} comes off the field",
    "TACTICAL SWITCH! ♻️ Fresh legs as {player} is replaced",
    "SUBSTITUTION! 👥 {player} makes way for a teammate"
  ],
  KICKOFF: [
    "⚽ KICK-OFF! The match is underway!",
    "🚀 HERE WE GO! The battle begins!",
    "⏰ GAME ON! Let the action commence!"
  ],
  HALFTIME: [
    "📢 HALF-TIME! The players head to the tunnel",
    "⏰ End of the first half! Time for tactical talks",
    "🔔 The referee's whistle brings the half to a close"
  ],
  FULLTIME: [
    "📢 FULL-TIME! The match has ended!",
    "⏰ That's it! The final whistle blows!",
    "🏁 GAME OVER! What a match we've witnessed!"
  ]
};

export default function MatchScoringScreen({ navigation, route }: MatchScoringScreenProps) {
  // BUG FIX: Add optional chaining and fallback for route params
  const { matchId, hasFormations, homeFormation, awayFormation } = route?.params || {};
  const [match, setMatch] = useState<Match | null>(null);
  
  // Initialize notification system for live match alerts
  const { notifyGoal, notifyCard, notifySubstitution } = useMatchNotifications(
    matchId || '',
    match?.homeTeam?.name || 'Home Team',
    match?.awayTeam?.name || 'Away Team',
    currentMinute
  );
  const [currentMinute, setCurrentMinute] = useState(0);
  const [liveStartTime, setLiveStartTime] = useState<Date | null>(null);
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
  const [currentHomeFormation, setCurrentHomeFormation] = useState<any>(homeFormation || null);
  const [currentAwayFormation, setCurrentAwayFormation] = useState<any>(awayFormation || null);
  
  // Tactical Substitution States
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [substitutionTeam, setSubstitutionTeam] = useState<any>(null);
  const [substitutionType, setSubstitutionType] = useState<'player' | 'formation'>('player');
  const [selectedPlayerOut, setSelectedPlayerOut] = useState<any>(null);
  const [selectedPlayerIn, setSelectedPlayerIn] = useState<any>(null);
  const [availableSubstitutions, setAvailableSubstitutions] = useState({
    home: 3,
    away: 3
  });
  
  // Undo System States
  const [lastAction, setLastAction] = useState<any>(null);
  const [showUndoButton, setShowUndoButton] = useState(false);
  
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
      // Calculate current minute immediately on mount and then every 10 seconds
      const updateTimer = () => {
        if (liveStartTime) {
          // Recalculate current minute from live start time to keep accurate
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - liveStartTime.getTime()) / (1000 * 60));
          const newMinute = Math.max(1, Math.min(elapsed + 1, 120)); // Always at least 1' when live
          
          setCurrentMinute(prev => {
            // Only trigger effects if the minute actually changed
            if (newMinute === prev) return prev;
            
            // Handle commentary for minute changes
            handleMinuteCommentary(newMinute);
            
            // Save current minute to backend every minute
            if (newMinute !== prev && newMinute > 0) {
              saveCurrentMinute(newMinute);
            }
            
            return newMinute;
          });
        } else {
          // Fallback for matches without live start time - use old increment logic
          setCurrentMinute(prev => {
            const newMinute = prev + 1;
            
            // Handle commentary for minute changes
            handleMinuteCommentary(newMinute);
            
            // Save current minute to backend
            saveCurrentMinute(newMinute);
            
            return newMinute;
          });
        }
      };
      
      // Don't update immediately if we just started - it would reset to 0
      // Wait 10 seconds for first update to avoid resetting the initial 1'
      interval = setInterval(updateTimer, 10000); // Update every 10 seconds
      
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
  }, [isLive, liveStartTime]);

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
      console.log('🕐 Live start time from backend:', response.match?.live_start_time);
      console.log('🕐 Current minute from backend:', response.match?.current_minute);
      console.log('📅 Match date:', response.match?.match_date);
      console.log('📅 Created at:', response.match?.created_at);
      
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
      
      // Ensure scores and timing are properly mapped from database fields
      matchData.homeScore = matchData.homeScore || matchData.home_score || 0;
      matchData.awayScore = matchData.awayScore || matchData.away_score || 0;
      matchData.liveStartTime = matchData.liveStartTime || matchData.live_start_time;
      matchData.currentMinute = matchData.currentMinute || matchData.current_minute || 0;
      
      setMatch(matchData);
      setIsLive(matchData.status === 'LIVE');
      
      if (matchData.status === 'LIVE') {
        // Use proper backend live_start_time
        if (matchData.liveStartTime) {
          const liveStart = new Date(matchData.liveStartTime);
          setLiveStartTime(liveStart);
          
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - liveStart.getTime()) / (1000 * 60));
          const calculatedMinute = Math.max(1, Math.min(elapsed + 1, 120));
          
          console.log('🕐 Using backend live_start_time:', liveStart);
          console.log('🕐 Calculated minute:', calculatedMinute);
          setCurrentMinute(calculatedMinute);
        } else {
          // Fallback for matches started before this fix
          setCurrentMinute(matchData.currentMinute || 1);
          console.log('⚠️ No live_start_time, using stored minute:', matchData.currentMinute);
        }
      } else {
        setCurrentMinute(0);
        setLiveStartTime(null);
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
      const startTime = new Date();
      const response = await apiService.startMatch(matchId);
      
      // Set local state immediately for instant feedback
      setIsLive(true);
      setCurrentMinute(1);
      setLiveStartTime(startTime);
      
      console.log('🚀 Match started - backend should now save live_start_time');
      
      // Enhanced start commentary
      const kickoffTemplates = COMMENTARY_TEMPLATES.KICKOFF;
      const kickoffCommentary = kickoffTemplates[Math.floor(Math.random() * kickoffTemplates.length)];
      showCommentary(kickoffCommentary);
      
      // Add stadium atmosphere
      setTimeout(() => {
        showCommentary("🏟️ The atmosphere is electric as both teams take the field!");
      }, 3000);
      
      Vibration.vibrate(100);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start match');
    }
  };

  const saveCurrentMinute = async (minute: number) => {
    try {
      await apiService.updateMatchMinute(matchId, minute);
    } catch (error) {
      console.error('Failed to save current minute:', error);
      // Don't show alert for this background operation
    }
  };

  const handleMinuteCommentary = (minute: number) => {
    // Dynamic commentary based on match phases
    if (minute === 45) {
      const halftimeTemplates = COMMENTARY_TEMPLATES.HALFTIME;
      const halftimeCommentary = halftimeTemplates[Math.floor(Math.random() * halftimeTemplates.length)];
      showCommentary(halftimeCommentary);
    } else if (minute === 46) {
      showCommentary("⚡ Second half is underway! Fresh tactics on display!");
    } else if (minute === 90) {
      const fulltimeTemplates = COMMENTARY_TEMPLATES.FULLTIME;
      const fulltimeCommentary = fulltimeTemplates[Math.floor(Math.random() * fulltimeTemplates.length)];
      showCommentary(fulltimeCommentary);
    } else if (minute > 90 && minute <= 95) {
      showCommentary(`⏱️ ${minute - 90} minutes of added time!`);
    }
    
    // Random match moments for realism
    if (Math.random() < 0.1 && minute % 5 === 0) { // 10% chance every 5 minutes
      const randomEvents = [
        "👥 Both teams pressing hard for an opening!",
        "⚡ End-to-end action as the pace picks up!",
        "🎯 Tactical battle unfolding on the pitch!",
        "💪 Players showing great intensity out there!",
        "🔥 The match is heating up!"
      ];
      const randomEvent = randomEvents[Math.floor(Math.random() * randomEvents.length)];
      showCommentary(randomEvent);
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

  const recordAction = (actionData: any) => {
    setLastAction({
      ...actionData,
      timestamp: Date.now()
    });
    setShowUndoButton(true);
    
    // Auto-hide undo button after 10 seconds
    setTimeout(() => {
      setShowUndoButton(false);
    }, 10000);
  };

  const undoLastAction = async () => {
    if (!lastAction) return;

    try {
      setIsProcessingEvent(true);
      
      // Remove the last event from backend
      if (lastAction.eventId) {
        await apiService.removeMatchEvent(matchId, lastAction.eventId);
      }
      
      // Restore substitution count if it was a substitution
      if (lastAction.actionType === 'SUBSTITUTION') {
        const teamKey = lastAction.teamId === match?.homeTeam?.id ? 'home' : 'away';
        setAvailableSubstitutions(prev => ({
          ...prev,
          [teamKey]: Math.min(3, prev[teamKey] + 1)
        }));
      }
      
      // Revert formation change if needed
      if (lastAction.actionType === 'FORMATION_CHANGE') {
        const teamKey = lastAction.teamId === match?.homeTeam?.id ? 'home' : 'away';
        if (teamKey === 'home') {
          setCurrentHomeFormation(lastAction.previousFormation);
        } else {
          setCurrentAwayFormation(lastAction.previousFormation);
        }
      }
      
      // Show undo commentary
      showCommentary(`⏪ UNDO: Last action has been reversed!`);
      
      // Refresh match data and clear undo state
      await loadMatchDetails();
      setLastAction(null);
      setShowUndoButton(false);
      
    } catch (error: any) {
      console.error('Error undoing action:', error);
      Alert.alert('Error', 'Failed to undo last action');
    } finally {
      setIsProcessingEvent(false);
    }
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

      const goalEventResponse = await apiService.addMatchEvent(matchId, goalEventData);
      
      // Record action for undo
      recordAction({
        actionType: 'GOAL',
        eventId: goalEventResponse?.eventId,
        playerId: goalScorerId,
        playerName: goalScorer?.name,
        teamId: goalScorerTeam.id,
        teamName: goalScorerTeam.name,
        minute: currentMinute
      });
      
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
      
      // Send real-time goal notification
      const newHomeScore = goalScorerTeam.id === match.homeTeam.id ? match.homeScore + 1 : match.homeScore;
      const newAwayScore = goalScorerTeam.id === match.awayTeam.id ? match.awayScore + 1 : match.awayScore;
      const currentScore = `${newHomeScore}-${newAwayScore}`;
      notifyGoal(goalScorer?.name || 'Unknown Player', goalScorerTeam.name, currentScore);
      
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

      const eventResponse = await apiService.addMatchEvent(matchId, eventData);
      
      // Record action for undo
      recordAction({
        actionType: eventType,
        eventId: eventResponse?.eventId,
        playerId,
        playerName: player?.name,
        teamId: selectedTeam.id,
        teamName: selectedTeam.name,
        minute: currentMinute
      });
      
      // Generate commentary
      const templates = COMMENTARY_TEMPLATES[eventType as keyof typeof COMMENTARY_TEMPLATES] || [];
      const template = templates[Math.floor(Math.random() * templates.length)];
      const commentary = template ? template.replace('{player}', player?.name || 'Unknown') : `${eventType} by ${player?.name || 'Unknown'}`;
      showCommentary(commentary);
      
      // Send real-time card notifications
      if (eventType === 'YELLOW_CARD' || eventType === 'RED_CARD') {
        const cardType = eventType === 'YELLOW_CARD' ? 'yellow' : 'red';
        notifyCard(player?.name || 'Unknown Player', selectedTeam.name, cardType);
      }
      
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
    if (eventType === 'SUBSTITUTION') {
      openSubstitutionModal(team);
    } else {
      setSelectedTeam(team);
      setSelectedEventType(eventType);
      
      setTimeout(() => {
        setShowEventModal(true);
      }, 50);
    }
  };

  const openSubstitutionModal = (team: any) => {
    setSubstitutionTeam(team);
    setSubstitutionType('player');
    setSelectedPlayerOut(null);
    setSelectedPlayerIn(null);
    setShowSubstitutionModal(true);
  };

  const makePlayerSubstitution = async () => {
    if (!selectedPlayerOut || !selectedPlayerIn || !substitutionTeam) return;

    const now = Date.now();
    const frontendRequestId = now + '-' + Math.random().toString(36).substr(2, 9);

    if (isProcessingEvent) return;
    setIsProcessingEvent(true);
    setLastEventTime(now);

    try {
      // Create substitution event
      const substitutionEventData = {
        playerId: selectedPlayerOut.id,
        teamId: substitutionTeam.id,
        eventType: 'SUBSTITUTION',
        minute: currentMinute,
        description: `${selectedPlayerOut.name} replaced by ${selectedPlayerIn.name}`,
        metadata: {
          playerOut: selectedPlayerOut.id,
          playerIn: selectedPlayerIn.id,
          playerOutName: selectedPlayerOut.name,
          playerInName: selectedPlayerIn.name
        }
      };

      const substitutionResponse = await apiService.addMatchEvent(matchId, substitutionEventData);

      // Record action for undo
      const teamKey = substitutionTeam.id === match?.homeTeam?.id ? 'home' : 'away';
      recordAction({
        actionType: 'SUBSTITUTION',
        eventId: substitutionResponse?.eventId,
        playerId: selectedPlayerOut.id,
        playerName: selectedPlayerOut.name,
        teamId: substitutionTeam.id,
        teamName: substitutionTeam.name,
        minute: currentMinute,
        playerOutId: selectedPlayerOut.id,
        playerInId: selectedPlayerIn.id,
        previousSubsCount: availableSubstitutions[teamKey]
      });

      // Update available substitutions
      setAvailableSubstitutions(prev => ({
        ...prev,
        [teamKey]: Math.max(0, prev[teamKey] - 1)
      }));

      // Generate commentary
      const templates = COMMENTARY_TEMPLATES.SUBSTITUTION;
      const template = templates[Math.floor(Math.random() * templates.length)];
      const commentary = template.replace('{player}', selectedPlayerOut.name);
      showCommentary(commentary);
      
      // Send real-time substitution notification
      notifySubstitution(
        selectedPlayerOut.name,
        selectedPlayerIn.name,
        substitutionTeam.name
      );

      // Add detailed substitution commentary
      setTimeout(() => {
        showCommentary(`🔄 ${selectedPlayerIn.name} comes on to replace ${selectedPlayerOut.name}!`);
      }, 2000);

      Vibration.vibrate(100);
      await loadMatchDetails();

      setShowSubstitutionModal(false);
      setSelectedPlayerOut(null);
      setSelectedPlayerIn(null);
      setSubstitutionTeam(null);

    } catch (error: any) {
      console.error(`💥 [${frontendRequestId}] FRONTEND: Error in makePlayerSubstitution:`, error);
      Alert.alert('Error', error.message || 'Failed to make substitution');
    } finally {
      setIsProcessingEvent(false);
    }
  };

  const makeFormationChange = async (newFormation: any) => {
    if (!substitutionTeam) return;

    try {
      const teamKey = substitutionTeam.id === match?.homeTeam?.id ? 'home' : 'away';
      const previousFormation = teamKey === 'home' ? currentHomeFormation : currentAwayFormation;
      
      // Record action for undo
      recordAction({
        actionType: 'FORMATION_CHANGE',
        teamId: substitutionTeam.id,
        teamName: substitutionTeam.name,
        minute: currentMinute,
        newFormation,
        previousFormation
      });
      
      if (teamKey === 'home') {
        setCurrentHomeFormation(newFormation);
      } else {
        setCurrentAwayFormation(newFormation);
      }

      // Generate tactical commentary
      showCommentary(`🔧 TACTICAL CHANGE! ${substitutionTeam.name} switches to ${newFormation.formation} formation!`);
      
      setTimeout(() => {
        showCommentary(`📋 The coach is adapting the strategy - interesting tactical shift!`);
      }, 2000);

      Vibration.vibrate(100);
      setShowSubstitutionModal(false);
      setSubstitutionTeam(null);

    } catch (error: any) {
      console.error('Error making formation change:', error);
      Alert.alert('Error', 'Failed to change formation');
    }
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

  const renderEvent = (event: MatchEvent, index: number) => {
    const isGoal = event.eventType === 'GOAL';
    const isCard = event.eventType === 'YELLOW_CARD' || event.eventType === 'RED_CARD';
    const team = event.teamId === match?.homeTeam?.id ? match?.homeTeam : match?.awayTeam;
    
    return (
      <Animated.View 
        key={event.id} 
        style={[
          styles.eventItem,
          isGoal && styles.goalEventItem,
          isCard && styles.cardEventItem,
          {
            opacity: 1,
            transform: [{
              translateX: 0
            }]
          }
        ]}
      >
        <View style={[styles.eventMinute, isGoal && styles.goalEventMinute]}>
          <Text style={[styles.eventMinuteText, isGoal && styles.goalEventMinuteText]}>
            {event.minute}'
          </Text>
        </View>
        
        <View style={styles.eventContent}>
          <View style={[styles.eventIconContainer, isGoal && styles.goalEventIconContainer]}>
            <Text style={[styles.eventIcon, isGoal && styles.goalEventIcon]}>
              {getEventIcon(event.eventType)}
            </Text>
          </View>
          
          <View style={styles.eventDetails}>
            <Text style={[styles.eventPlayerName, isGoal && styles.goalEventPlayerName]}>
              {event.player?.name || 'Unknown Player'}
            </Text>
            <Text style={[styles.eventType, isGoal && styles.goalEventType]}>
              {getEventDescription(event.eventType)}
            </Text>
            <Text style={styles.eventTeam}>{team?.name || 'Unknown Team'}</Text>
            {event.description && (
              <Text style={styles.eventDescription}>{event.description}</Text>
            )}
          </View>
          
          {isGoal && (
            <View style={styles.goalBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
            </View>
          )}
        </View>
        
        {/* Event impact line */}
        <View style={[
          styles.eventImpactLine,
          isGoal && styles.goalImpactLine,
          isCard && styles.cardImpactLine
        ]} />
      </Animated.View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Actions':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Quick Actions */}
            {isLive && (
              <View style={styles.quickActionsContainer}>
                <View style={styles.sectionHeaderWithUndo}>
                  <Text style={styles.sectionTitle}>⚡ Live Match Actions</Text>
                  {showUndoButton && lastAction && (
                    <TouchableOpacity 
                      style={styles.undoButton}
                      onPress={undoLastAction}
                      disabled={isProcessingEvent}
                    >
                      <Ionicons name="arrow-undo" size={16} color="#fff" />
                      <Text style={styles.undoButtonText}>Undo</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Show last action for context */}
                {showUndoButton && lastAction && (
                  <View style={styles.lastActionIndicator}>
                    <Text style={styles.lastActionText}>
                      Last: {lastAction.actionType === 'GOAL' ? '⚽' : 
                            lastAction.actionType === 'YELLOW_CARD' ? '🟨' :
                            lastAction.actionType === 'RED_CARD' ? '🟥' :
                            lastAction.actionType === 'SUBSTITUTION' ? '🔄' :
                            lastAction.actionType === 'FORMATION_CHANGE' ? '🔧' : '📝'} 
                      {lastAction.playerName ? `${lastAction.playerName} (${lastAction.teamName})` : lastAction.teamName} - {lastAction.minute}'
                    </Text>
                  </View>
                )}
                
                {/* Team Headers */}
                <View style={styles.teamHeaders}>
                  <Text style={styles.teamHeaderText}>{match?.homeTeam?.name}</Text>
                  <Text style={styles.vsText}>vs</Text>
                  <Text style={styles.teamHeaderText}>{match?.awayTeam?.name}</Text>
                </View>
                
                {/* Compact Actions Grid */}
                <View style={styles.compactActionsContainer}>
                  {/* Goals Row */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.compactActionButton, styles.goalButton]}
                      onPress={() => openEventModal(match?.homeTeam, 'GOAL')}
                    >
                      <Ionicons name="football" size={18} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.actionRowLabel}>⚽ Goals</Text>
                    <TouchableOpacity 
                      style={[styles.compactActionButton, styles.goalButton]}
                      onPress={() => openEventModal(match?.awayTeam, 'GOAL')}
                    >
                      <Ionicons name="football" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Yellow Cards Row */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.compactActionButton, styles.yellowButton]}
                      onPress={() => openEventModal(match?.homeTeam, 'YELLOW_CARD')}
                    >
                      <Text style={styles.compactCardEmoji}>🟨</Text>
                    </TouchableOpacity>
                    <Text style={styles.actionRowLabel}>🟨 Yellow</Text>
                    <TouchableOpacity 
                      style={[styles.compactActionButton, styles.yellowButton]}
                      onPress={() => openEventModal(match?.awayTeam, 'YELLOW_CARD')}
                    >
                      <Text style={styles.compactCardEmoji}>🟨</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Red Cards Row */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.compactActionButton, styles.redButton]}
                      onPress={() => openEventModal(match?.homeTeam, 'RED_CARD')}
                    >
                      <Text style={styles.compactCardEmoji}>🟥</Text>
                    </TouchableOpacity>
                    <Text style={styles.actionRowLabel}>🟥 Red</Text>
                    <TouchableOpacity 
                      style={[styles.compactActionButton, styles.redButton]}
                      onPress={() => openEventModal(match?.awayTeam, 'RED_CARD')}
                    >
                      <Text style={styles.compactCardEmoji}>🟥</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Substitutions Row */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[
                        styles.compactActionButton, 
                        styles.substitutionButton,
                        availableSubstitutions.home === 0 && styles.disabledButton
                      ]}
                      onPress={() => openEventModal(match?.homeTeam, 'SUBSTITUTION')}
                      disabled={availableSubstitutions.home === 0}
                    >
                      <Ionicons name="people" size={18} color="#fff" />
                      <Text style={styles.subsRemainingText}>{availableSubstitutions.home}</Text>
                    </TouchableOpacity>
                    <Text style={styles.actionRowLabel}>🔄 Subs</Text>
                    <TouchableOpacity 
                      style={[
                        styles.compactActionButton, 
                        styles.substitutionButton,
                        availableSubstitutions.away === 0 && styles.disabledButton
                      ]}
                      onPress={() => openEventModal(match?.awayTeam, 'SUBSTITUTION')}
                      disabled={availableSubstitutions.away === 0}
                    >
                      <Ionicons name="people" size={18} color="#fff" />
                      <Text style={styles.subsRemainingText}>{availableSubstitutions.away}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Quick Commentary Events */}
                <View style={styles.quickCommentaryContainer}>
                  <Text style={styles.actionRowLabel}>💬 Quick Events</Text>
                  <View style={styles.quickCommentaryGrid}>
                    <TouchableOpacity 
                      style={styles.quickCommentaryButton}
                      onPress={() => showCommentary("SAVE! 🧤 Brilliant stop by the goalkeeper!")}
                    >
                      <Text style={styles.quickCommentaryText}>🧤 Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quickCommentaryButton}
                      onPress={() => showCommentary("MISS! 😬 The shot goes wide of the target!")}
                    >
                      <Text style={styles.quickCommentaryText}>❌ Miss</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quickCommentaryButton}
                      onPress={() => showCommentary("Corner kick awarded! 🚩 Great opportunity here!")}
                    >
                      <Text style={styles.quickCommentaryText}>🚩 Corner</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.quickCommentaryButton}
                      onPress={() => showCommentary("Foul! ⚠️ Free kick awarded for the challenge!")}
                    >
                      <Text style={styles.quickCommentaryText}>⚠️ Foul</Text>
                    </TouchableOpacity>
                  </View>
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
            {hasFormations && currentHomeFormation && currentAwayFormation ? (
              <View style={styles.formationContainer}>
                {/* Formation Info */}
                <View style={styles.formationInfoContainer}>
                  <View style={styles.teamFormationInfo}>
                    <Text style={styles.teamFormationTitle}>{match?.homeTeam?.name}</Text>
                    <Text style={styles.formationText}>{currentHomeFormation.formation}</Text>
                    <Text style={styles.gameFormatText}>{currentHomeFormation.gameFormat}</Text>
                  </View>
                  <Text style={styles.vsText}>VS</Text>
                  <View style={styles.teamFormationInfo}>
                    <Text style={styles.teamFormationTitle}>{match?.awayTeam?.name}</Text>
                    <Text style={styles.formationText}>{currentAwayFormation.formation}</Text>
                    <Text style={styles.gameFormatText}>{currentAwayFormation.gameFormat}</Text>
                  </View>
                </View>

                {/* Formation Visual */}
                <PitchFormation
                  homeTeam={match?.homeTeam}
                  awayTeam={match?.awayTeam}
                  homeFormation={currentHomeFormation}
                  awayFormation={currentAwayFormation}
                  onPlayerPress={(player) => {
                    console.log('Player pressed in formation:', player.name);
                  }}
                  showPlayerNames={true}
                />

                {/* Formation Actions */}
                <View style={styles.formationActionsContainer}>
                  <TouchableOpacity 
                    style={styles.formationActionButton}
                    onPress={() => {
                      navigation.navigate('TeamFormation', {
                        teamId: match?.homeTeam?.id,
                        teamName: match?.homeTeam?.name,
                        gameFormat: currentHomeFormation.gameFormat,
                        fromMatch: true,
                        matchId: matchId
                      });
                    }}
                  >
                    <Ionicons name="create-outline" size={20} color="#fff" />
                    <Text style={styles.formationActionText}>Edit Home Formation</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.formationActionButton}
                    onPress={() => {
                      navigation.navigate('TeamFormation', {
                        teamId: match?.awayTeam?.id,
                        teamName: match?.awayTeam?.name,
                        gameFormat: currentAwayFormation.gameFormat,
                        fromMatch: true,
                        matchId: matchId
                      });
                    }}
                  >
                    <Ionicons name="create-outline" size={20} color="#fff" />
                    <Text style={styles.formationActionText}>Edit Away Formation</Text>
                  </TouchableOpacity>
                </View>

                {/* Tactical Substitutions - Only show during live matches */}
                {isLive && (
                  <View style={styles.tacticalSubstitutionsContainer}>
                    <Text style={styles.tacticalSubstitutionsTitle}>🎯 Tactical Substitutions</Text>
                    
                    <View style={styles.substitutionsGrid}>
                      {/* Home Team Substitutions */}
                      <View style={styles.teamSubstitutionCard}>
                        <Text style={styles.teamSubstitutionHeader}>{match?.homeTeam?.name}</Text>
                        <Text style={styles.substitutionsRemaining}>
                          {availableSubstitutions.home} substitutions left
                        </Text>
                        
                        <View style={styles.substitutionActions}>
                          <TouchableOpacity 
                            style={[
                              styles.substitutionActionButton,
                              availableSubstitutions.home === 0 && styles.disabledButton
                            ]}
                            onPress={() => openSubstitutionModal(match?.homeTeam)}
                            disabled={availableSubstitutions.home === 0}
                          >
                            <Ionicons name="people" size={16} color="#fff" />
                            <Text style={styles.substitutionActionText}>Player Sub</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.tacticalChangeButton}
                            onPress={() => {
                              setSubstitutionTeam(match?.homeTeam);
                              setSubstitutionType('formation');
                              setShowSubstitutionModal(true);
                            }}
                          >
                            <Ionicons name="grid" size={16} color="#fff" />
                            <Text style={styles.substitutionActionText}>Formation</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Away Team Substitutions */}
                      <View style={styles.teamSubstitutionCard}>
                        <Text style={styles.teamSubstitutionHeader}>{match?.awayTeam?.name}</Text>
                        <Text style={styles.substitutionsRemaining}>
                          {availableSubstitutions.away} substitutions left
                        </Text>
                        
                        <View style={styles.substitutionActions}>
                          <TouchableOpacity 
                            style={[
                              styles.substitutionActionButton,
                              availableSubstitutions.away === 0 && styles.disabledButton
                            ]}
                            onPress={() => openSubstitutionModal(match?.awayTeam)}
                            disabled={availableSubstitutions.away === 0}
                          >
                            <Ionicons name="people" size={16} color="#fff" />
                            <Text style={styles.substitutionActionText}>Player Sub</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.tacticalChangeButton}
                            onPress={() => {
                              setSubstitutionTeam(match?.awayTeam);
                              setSubstitutionType('formation');
                              setShowSubstitutionModal(true);
                            }}
                          >
                            <Ionicons name="grid" size={16} color="#fff" />
                            <Text style={styles.substitutionActionText}>Formation</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ) : match && match.homeTeam && match.awayTeam ? (
              <View style={styles.formationContainer}>
                <View style={styles.noFormationContainer}>
                  <Ionicons name="football-outline" size={60} color="#ccc" />
                  <Text style={styles.noFormationTitle}>No Formations Set</Text>
                  <Text style={styles.noFormationSubtitle}>
                    Use Pre-Match Planning to set up formations for both teams
                  </Text>
                  <TouchableOpacity 
                    style={styles.setFormationButton}
                    onPress={() => {
                      navigation.navigate('PreMatchPlanning', {
                        matchId: matchId,
                        homeTeam: match.homeTeam,
                        awayTeam: match.awayTeam
                      });
                    }}
                  >
                    <Text style={styles.setFormationButtonText}>Set Formations</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Default Formation Visual */}
                <PitchFormation
                  homeTeam={match.homeTeam}
                  awayTeam={match.awayTeam}
                  onPlayerPress={(player) => {
                    console.log('Player pressed:', player.name);
                  }}
                  showPlayerNames={true}
                />
              </View>
            ) : null}
          </ScrollView>
        );
        
      case 'Commentary':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.commentaryContainer}>
              {/* Match Statistics */}
              <View style={styles.matchStatsContainer}>
                <Text style={styles.sectionTitle}>Match Statistics</Text>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statsColumn}>
                    <Text style={styles.teamStatsHeader}>{match?.homeTeam?.name}</Text>
                    <View style={styles.teamStat}>
                      <Text style={styles.statNumber}>{match?.events?.filter(e => e.eventType === 'GOAL' && e.teamId === match?.homeTeam?.id).length || 0}</Text>
                      <Text style={styles.statName}>Goals</Text>
                    </View>
                    <View style={styles.teamStat}>
                      <Text style={styles.statNumber}>{match?.events?.filter(e => e.eventType === 'YELLOW_CARD' && e.teamId === match?.homeTeam?.id).length || 0}</Text>
                      <Text style={styles.statName}>Yellow Cards</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statsDivider} />
                  
                  <View style={styles.statsColumn}>
                    <Text style={styles.teamStatsHeader}>{match?.awayTeam?.name}</Text>
                    <View style={styles.teamStat}>
                      <Text style={styles.statNumber}>{match?.events?.filter(e => e.eventType === 'GOAL' && e.teamId === match?.awayTeam?.id).length || 0}</Text>
                      <Text style={styles.statName}>Goals</Text>
                    </View>
                    <View style={styles.teamStat}>
                      <Text style={styles.statNumber}>{match?.events?.filter(e => e.eventType === 'YELLOW_CARD' && e.teamId === match?.awayTeam?.id).length || 0}</Text>
                      <Text style={styles.statName}>Yellow Cards</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Live Commentary */}
              <View style={styles.liveCommentarySection}>
                <Text style={styles.sectionTitle}>Live Commentary</Text>
                {isLive && (
                  <View style={styles.liveIndicatorContainer}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                    <Text style={styles.currentMinuteText}>{currentMinute}'</Text>
                  </View>
                )}
                
                {commentaryHistory.length > 0 ? (
                  commentaryHistory.map((comment, index) => (
                    <Animated.View 
                      key={index} 
                      style={[
                        styles.commentaryItem,
                        index === 0 && styles.latestCommentaryItem
                      ]}
                    >
                      <View style={styles.commentaryHeader}>
                        <Text style={styles.commentaryTime}>{currentMinute - index}'</Text>
                        {index === 0 && <View style={styles.newBadge} />}
                      </View>
                      <Text style={[
                        styles.commentaryText,
                        index === 0 && styles.latestCommentaryText
                      ]}>
                        {comment}
                      </Text>
                    </Animated.View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#666" />
                    <Text style={styles.emptyText}>No commentary yet</Text>
                    <Text style={styles.emptySubtext}>Events will generate live commentary</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        );
        
      case 'Timeline':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.timelineContainer}>
              <Text style={styles.sectionTitle}>Match Timeline</Text>
              
              {/* Match Progress Bar */}
              {isLive && (
                <View style={styles.matchProgressContainer}>
                  <View style={styles.matchProgressBar}>
                    <View 
                      style={[
                        styles.matchProgress, 
                        { width: `${Math.min((currentMinute / 90) * 100, 100)}%` }
                      ]} 
                    />
                  </View>
                  <View style={styles.matchProgressLabels}>
                    <Text style={styles.progressLabel}>0'</Text>
                    <Text style={styles.progressLabel}>45'</Text>
                    <Text style={styles.progressLabel}>90'</Text>
                  </View>
                  <Text style={styles.currentProgressText}>
                    {currentMinute}' / 90' {currentMinute > 45 && currentMinute <= 90 ? '(2nd Half)' : '(1st Half)'}
                  </Text>
                </View>
              )}
              
              {/* Events Timeline */}
              {match && match.events && match.events.length > 0 ? (
                <View style={styles.eventsTimeline}>
                  {match.events
                    .sort((a, b) => b.minute - a.minute)
                    .map((event, index) => (
                      <View key={event.id} style={styles.timelineEventWrapper}>
                        {renderEvent(event, index)}
                        {index < match.events.length - 1 && (
                          <View style={styles.timelineConnector} />
                        )}
                      </View>
                    ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={48} color="#666" />
                  <Text style={styles.emptyText}>No events yet</Text>
                  <Text style={styles.emptySubtext}>
                    {isLive ? 'Match events will appear here as they happen' : 'Start the match to see events'}
                  </Text>
                </View>
              )}
              
              {/* Timeline Legend */}
              <View style={styles.timelineLegend}>
                <Text style={styles.legendTitle}>Event Types</Text>
                <View style={styles.legendItems}>
                  <View style={styles.legendItem}>
                    <Text style={styles.legendIcon}>⚽</Text>
                    <Text style={styles.legendText}>Goal</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <Text style={styles.legendIcon}>🤝</Text>
                    <Text style={styles.legendText}>Assist</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <Text style={styles.legendIcon}>🟨</Text>
                    <Text style={styles.legendText}>Yellow Card</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <Text style={styles.legendIcon}>🟥</Text>
                    <Text style={styles.legendText}>Red Card</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <Text style={styles.legendIcon}>🔄</Text>
                    <Text style={styles.legendText}>Substitution</Text>
                  </View>
                </View>
              </View>
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

      {/* Tactical Substitution Modal */}
      <Modal
        visible={showSubstitutionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSubstitutionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {substitutionType === 'player' ? 'Player Substitution' : 'Formation Change'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowSubstitutionModal(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Team: {substitutionTeam?.name}
          </Text>

          {substitutionType === 'player' ? (
            <View style={styles.substitutionContent}>
              {/* Substitution Type Selector */}
              <View style={styles.substitutionSteps}>
                <View style={styles.substitutionStep}>
                  <Text style={styles.stepTitle}>Step 1: Select Player to Remove</Text>
                  {!selectedPlayerOut ? (
                    <FlatList
                      data={substitutionTeam?.players || []}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          style={styles.playerItem}
                          onPress={() => setSelectedPlayerOut(item)}
                        >
                          <View style={styles.playerItemContent}>
                            <View style={[styles.playerNumber, { backgroundColor: getPositionColor(item.position) }]}>
                              <Text style={styles.playerNumberText}>
                                {item.jerseyNumber || '--'}
                              </Text>
                            </View>
                            <View style={styles.playerDetails}>
                              <Text style={styles.playerName}>{item.name}</Text>
                              <Text style={styles.playerPosition}>{item.position}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      )}
                      keyExtractor={(item) => item.id || item.name}
                      style={styles.playersList}
                      showsVerticalScrollIndicator={false}
                    />
                  ) : (
                    <View style={styles.selectedPlayerContainer}>
                      <View style={styles.selectedPlayerCard}>
                        <View style={[styles.playerNumber, { backgroundColor: getPositionColor(selectedPlayerOut.position) }]}>
                          <Text style={styles.playerNumberText}>
                            {selectedPlayerOut.jerseyNumber || '--'}
                          </Text>
                        </View>
                        <View style={styles.playerDetails}>
                          <Text style={styles.playerName}>{selectedPlayerOut.name}</Text>
                          <Text style={styles.playerPosition}>{selectedPlayerOut.position}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.changePlayerButton}
                          onPress={() => setSelectedPlayerOut(null)}
                        >
                          <Ionicons name="create" size={20} color="#00E676" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {selectedPlayerOut && (
                  <View style={styles.substitutionStep}>
                    <Text style={styles.stepTitle}>Step 2: Select Replacement Player</Text>
                    {!selectedPlayerIn ? (
                      <FlatList
                        data={substitutionTeam?.players?.filter((p: any) => p.id !== selectedPlayerOut.id) || []}
                        renderItem={({ item }) => (
                          <TouchableOpacity 
                            style={styles.playerItem}
                            onPress={() => setSelectedPlayerIn(item)}
                          >
                            <View style={styles.playerItemContent}>
                              <View style={[styles.playerNumber, { backgroundColor: getPositionColor(item.position) }]}>
                                <Text style={styles.playerNumberText}>
                                  {item.jerseyNumber || '--'}
                                </Text>
                              </View>
                              <View style={styles.playerDetails}>
                                <Text style={styles.playerName}>{item.name}</Text>
                                <Text style={styles.playerPosition}>{item.position}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        )}
                        keyExtractor={(item) => item.id || item.name}
                        style={styles.playersList}
                        showsVerticalScrollIndicator={false}
                      />
                    ) : (
                      <View style={styles.selectedPlayerContainer}>
                        <View style={styles.selectedPlayerCard}>
                          <View style={[styles.playerNumber, { backgroundColor: getPositionColor(selectedPlayerIn.position) }]}>
                            <Text style={styles.playerNumberText}>
                              {selectedPlayerIn.jerseyNumber || '--'}
                            </Text>
                          </View>
                          <View style={styles.playerDetails}>
                            <Text style={styles.playerName}>{selectedPlayerIn.name}</Text>
                            <Text style={styles.playerPosition}>{selectedPlayerIn.position}</Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.changePlayerButton}
                            onPress={() => setSelectedPlayerIn(null)}
                          >
                            <Ionicons name="create" size={20} color="#00E676" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {selectedPlayerOut && selectedPlayerIn && (
                  <View style={styles.substitutionConfirm}>
                    <Text style={styles.confirmTitle}>Confirm Substitution</Text>
                    <Text style={styles.confirmText}>
                      Replace {selectedPlayerOut.name} with {selectedPlayerIn.name}?
                    </Text>
                    <TouchableOpacity 
                      style={styles.confirmSubstitutionButton}
                      onPress={makePlayerSubstitution}
                      disabled={isProcessingEvent}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text style={styles.confirmButtonText}>Make Substitution</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.formationChangeContent}>
              <Text style={styles.formationChangeTitle}>Select New Formation</Text>
              <View style={styles.formationOptions}>
                {['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2'].map((formation) => (
                  <TouchableOpacity 
                    key={formation}
                    style={styles.formationOption}
                    onPress={() => makeFormationChange({ formation, gameFormat: '11v11' })}
                  >
                    <Text style={styles.formationOptionText}>{formation}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
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
  formationInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2D31',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  teamFormationInfo: {
    flex: 1,
    alignItems: 'center',
  },
  teamFormationTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  formationText: {
    color: '#4FC3F7',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  gameFormatText: {
    color: '#81C784',
    fontSize: 12,
    fontWeight: '600',
  },
  vsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
  },
  formationActionsContainer: {
    marginTop: 20,
    marginBottom: 12,
  },
  formationActionButton: {
    backgroundColor: '#4FC3F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexWrap: 'wrap',
  },
  formationActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noFormationContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noFormationTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noFormationSubtitle: {
    color: '#B0BEC5',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  setFormationButton: {
    backgroundColor: '#00C853',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  setFormationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Enhanced Timeline Styles
  goalEventItem: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderLeftColor: '#00E676',
    borderLeftWidth: 4,
  },
  cardEventItem: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderLeftColor: '#FFC107',
    borderLeftWidth: 4,
  },
  goalEventMinute: {
    backgroundColor: '#00E676',
  },
  goalEventMinuteText: {
    color: '#000',
    fontWeight: 'bold',
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalEventIconContainer: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
  },
  goalEventIcon: {
    fontSize: 20,
  },
  goalEventPlayerName: {
    color: '#00E676',
    fontWeight: 'bold',
  },
  goalEventType: {
    color: '#00E676',
  },
  eventTeam: {
    color: '#B0BEC5',
    fontSize: 12,
    marginTop: 2,
  },
  eventDescription: {
    color: '#90A4AE',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  goalBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  eventImpactLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  goalImpactLine: {
    backgroundColor: '#00E676',
    width: 3,
  },
  cardImpactLine: {
    backgroundColor: '#FFC107',
    width: 3,
  },
  
  // Enhanced Commentary Styles
  matchStatsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsColumn: {
    flex: 1,
    alignItems: 'center',
  },
  teamStatsHeader: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  teamStat: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    color: '#00E676',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statName: {
    color: '#B0BEC5',
    fontSize: 12,
  },
  statsDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  liveCommentarySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
  },
  liveIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: 'rgba(255, 23, 68, 0.1)',
    borderRadius: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF1744',
    marginRight: 8,
  },
  liveText: {
    color: '#FF1744',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  currentMinuteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  latestCommentaryItem: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderColor: '#00E676',
    borderWidth: 1,
  },
  commentaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentaryTime: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  newBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF1744',
  },
  latestCommentaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Enhanced Timeline Styles
  matchProgressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  matchProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: 8,
  },
  matchProgress: {
    height: '100%',
    backgroundColor: '#00E676',
    borderRadius: 3,
  },
  matchProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#B0BEC5',
    fontSize: 12,
  },
  currentProgressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  eventsTimeline: {
    marginBottom: 20,
  },
  timelineEventWrapper: {
    position: 'relative',
  },
  timelineConnector: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 60,
    marginVertical: 4,
  },
  timelineLegend: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
  },
  legendTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '48%',
  },
  legendIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  legendText: {
    color: '#B0BEC5',
    fontSize: 12,
  },
  
  // Substitution and Additional Actions Styles
  substitutionCard: {
    backgroundColor: '#9C27B0',
  },
  substitutionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  additionalActionsContainer: {
    marginTop: 24,
  },
  sectionSubtitle: {
    color: '#B0BEC5',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  additionalActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  additionalActionCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  additionalActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  saveCard: {
    backgroundColor: '#2196F3',
  },
  missCard: {
    backgroundColor: '#FF5722',
  },
  cornerCard: {
    backgroundColor: '#FF9800',
  },
  foulCard: {
    backgroundColor: '#795548',
  },
  
  // Compact Actions Styles
  teamHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  teamHeaderText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  vsText: {
    color: '#B0BEC5',
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  compactActionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 4,
  },
  actionRowLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  compactActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  goalButton: {
    backgroundColor: '#00C853',
  },
  yellowButton: {
    backgroundColor: '#FFC107',
  },
  redButton: {
    backgroundColor: '#F44336',
  },
  substitutionButton: {
    backgroundColor: '#9C27B0',
  },
  compactCardEmoji: {
    fontSize: 16,
  },
  subsRemainingText: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.3,
  },
  quickCommentaryContainer: {
    marginTop: 8,
  },
  quickCommentaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  quickCommentaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
    marginBottom: 8,
  },
  quickCommentaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Undo Button Styles
  sectionHeaderWithUndo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  undoButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  undoButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  lastActionIndicator: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  lastActionText: {
    color: '#fff',
    fontSize: 12,
    fontStyle: 'italic',
  },
  
  // Tactical Substitutions Styles
  tacticalSubstitutionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  tacticalSubstitutionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  substitutionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamSubstitutionCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  teamSubstitutionHeader: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  substitutionsRemaining: {
    color: '#B0BEC5',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  substitutionActions: {
    marginTop: 8,
  },
  substitutionActionButton: {
    backgroundColor: '#9C27B0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  tacticalChangeButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  substitutionActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Substitution Modal Styles
  substitutionContent: {
    flex: 1,
  },
  substitutionSteps: {
    flex: 1,
  },
  substitutionStep: {
    marginBottom: 20,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  selectedPlayerContainer: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  selectedPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePlayerButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  substitutionConfirm: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  confirmTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confirmText: {
    color: '#B0BEC5',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmSubstitutionButton: {
    backgroundColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexWrap: 'wrap',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formationChangeContent: {
    flex: 1,
    padding: 16,
  },
  formationChangeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formationOptions: {
    marginBottom: 12,
  },
  formationOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  formationOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});