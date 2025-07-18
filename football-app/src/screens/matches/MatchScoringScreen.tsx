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
  StatusBar,
} from 'react-native';
import { apiService } from '../../services/api';
import { soundService } from '../../services/soundService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMatchNotifications } from '../../hooks/useNotifications';
import { useSimpleMatchTimer } from '../../services/timerService';

// Professional Components
import {
  ProfessionalMatchHeader,
  ProfessionalMatchAction,
  ProfessionalMatchEvent,
  ProfessionalButton,
  ProfessionalPlayerCard,
  DesignSystem,
} from '../../components/professional';
import ModernPitchFormation from '../../components/ModernPitchFormation';

const { width, height } = Dimensions.get('window');
const { colors, typography, spacing, borderRadius, shadows, gradients } = DesignSystem;

interface MatchScoringScreenProps {
  navigation: any;
  route: any;
}

const TABS = ['Actions', 'Commentary', 'Formation', 'Timeline', 'Stats'];

const COMMENTARY_TEMPLATES = {
  GOAL: [
    "GOOOOOAL! 🔥 What a strike from {player}!",
    "⚽ {player} finds the back of the net! Incredible finish!",
    "SCORED! {player} makes no mistake from there!",
    "🎯 {player} with a clinical finish! The crowd goes wild!",
    "GOAL! 🚀 {player} unleashes a rocket into the top corner!",
    "MAGNIFICENT! ⚽ {player} shows pure class with that finish!",
  ],
  YELLOW_CARD: [
    "🟨 {player} sees yellow for that challenge",
    "Referee shows {player} a yellow card for that foul",
    "⚠️ {player} needs to be careful now with that yellow card",
    "BOOKING! 🟨 {player} goes into the referee's book",
  ],
  RED_CARD: [
    "🟥 {player} is sent off! Down to 10 men!",
    "RED CARD! {player} has to leave the field early",
    "DISMISSED! 🟥 {player} receives his marching orders!",
    "SENT OFF! {player} will have an early shower today!",
  ],
  SUBSTITUTION: [
    "CHANGE! 🔄 {player} comes off the field",
    "SUBSTITUTION! 👥 {player} makes way for a teammate",
    "TACTICAL SWITCH! 🔄 {player} is replaced",
    "FRESH LEGS! 👥 {player} heads to the bench",
  ],
  ASSIST: [
    "🎯 Brilliant assist from {player}!",
    "👏 {player} with the perfect pass!",
    "🔥 What a ball from {player}!",
    "⚡ {player} sets it up beautifully!",
  ],
};

export default function MatchScoringScreen({ navigation, route }: MatchScoringScreenProps) {
  const { matchId } = route?.params || {};
  const [match, setMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Match state (from database - immediate and reliable)
  const [isLive, setIsLive] = useState(false);
  const [isHalftime, setIsHalftime] = useState(false);
  const [currentHalf, setCurrentHalf] = useState(1);
  const [addedTimeFirstHalf, setAddedTimeFirstHalf] = useState(0);
  const [addedTimeSecondHalf, setAddedTimeSecondHalf] = useState(0);
  
  const timerData = useSimpleMatchTimer(match ? {
    id: match.id,
    status: match.status,
    duration: match.duration || 90,
    timerStartedAt: match.timer_started_at,
    // FIX: Use the field that actually has the timestamp data!
    secondHalfStartedAt: match.second_half_start_time || match.second_half_started_at,
    currentHalf: match.current_half || 1,
    addedTimeFirstHalf: match.added_time_first_half || 0,
    addedTimeSecondHalf: match.added_time_second_half || 0,
  } : null);
  
  // Timer values - use simple timer directly
  const currentMinute = timerData.minutes;
  const currentSecond = timerData.seconds;
  const displayText = timerData.displayText;
  
  console.log('🌍 MATCH SCORING TIMER:', {
    matchId,
    currentMinute,
    currentSecond,
    displayText,
    status: match?.status,
    isLive: timerData.isLive,
    // DEBUG: Show which field we're using for second half
    second_half_start_time: match?.second_half_start_time,
    second_half_started_at: match?.second_half_started_at,
    mapped_timestamp: match?.second_half_start_time || match?.second_half_started_at,
    current_half: match?.current_half
  });
  const [activeTab, setActiveTab] = useState('Actions');
  const [latestCommentary, setLatestCommentary] = useState<string>('');
  const [commentaryHistory, setCommentaryHistory] = useState<Array<{id: string, text: string, minute: number, timestamp: Date}>>([]);
  const [availableSubstitutions, setAvailableSubstitutions] = useState({
    home: 3,
    away: 3,
  });
  
  // Formation data
  const [homeFormation, setHomeFormation] = useState<any>(null);
  const [awayFormation, setAwayFormation] = useState<any>(null);
  const [formationsLoaded, setFormationsLoaded] = useState(false);
  
  // Halftime modal and break countdown
  const [showHalftimeModal, setShowHalftimeModal] = useState(false);
  const [halftimeBreakTimeRemaining, setHalftimeBreakTimeRemaining] = useState(0);
  const [showManualControls, setShowManualControls] = useState(false);
  
  // Modals
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showAssistModal, setShowAssistModal] = useState(false);
  const [modalTeam, setModalTeam] = useState<any>(null);
  const [modalActionType, setModalActionType] = useState<string>('');
  const [goalScorerId, setGoalScorerId] = useState<string>('');
  
  // Animations
  const commentaryAnimation = useRef(new Animated.Value(0)).current;
  const scoreAnimation = useRef(new Animated.Value(1)).current;
  
  // Notifications
  const { notifyGoal, notifyCard, notifySubstitution } = useMatchNotifications(
    matchId || '',
    match?.homeTeam?.name || 'Home Team',
    match?.awayTeam?.name || 'Away Team',
    currentMinute
  );

  useEffect(() => {
    loadMatchDetails();
  }, []);

  // SSE Timer hook is now handling all real-time updates

  // Polling for match status updates (since WebSocket is disabled)
  useEffect(() => {
    if (!matchId || (!isLive && !isHalftime)) return;

    const pollInterval = setInterval(async () => {
      try {
        console.log('🔄 POLLING: Checking match status for server-side changes...');
        const response = await apiService.getMatchById(matchId);
        const serverMatch = response?.match;
        
        if (serverMatch) {
          // Check if server status differs from local status
          if (serverMatch.status !== match?.status) {
            console.log(`🔄 POLLING: Status changed from ${match?.status} to ${serverMatch.status}`);
            
            if (serverMatch.status === 'HALFTIME' && match?.status === 'LIVE') {
              console.log('🟨 POLLING: Server triggered halftime - updating UI');
              showCommentary("⏱️ HALF-TIME! First half ends.");
              await soundService.playHalftimeWhistle();
            } else if (serverMatch.status === 'LIVE' && match?.status === 'HALFTIME') {
              console.log('⚽ POLLING: Server started second half - updating UI');
              showCommentary("⚽ SECOND HALF! Match resumes.");
              await soundService.playSecondHalfWhistle();
            } else if (serverMatch.status === 'COMPLETED') {
              console.log('🏁 POLLING: Server ended match - updating UI');
              showCommentary("📢 FULL-TIME! Match completed!");
              await soundService.playFullTimeWhistle();
            }
            
            // Reload full match details to sync everything
            await loadMatchDetails();
          }
        }
      } catch (error) {
        console.error('❌ POLLING: Error checking match status:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      console.log('🧹 POLLING: Cleaning up status polling');
      clearInterval(pollInterval);
    };
  }, [matchId, isLive, isHalftime, match?.status]);

  // SSE Timer provides real-time updates - no manual timer needed

  // SSE Timer hook handles all timer updates and events automatically

  // Automatic halftime and fulltime handling
  useEffect(() => {
    if (timerData.isHalftime && !showHalftimeModal && match?.status === 'HALFTIME') {
      setShowHalftimeModal(true);
      soundService.playHalftimeWhistle();
      showCommentary("⏱️ HALF-TIME! 15-minute break begins.");
    } else if (!timerData.isHalftime && showHalftimeModal) {
      setShowHalftimeModal(false);
    }
  }, [timerData.isHalftime, match?.status]);

  // Handle fulltime
  useEffect(() => {
    if (match?.status === 'COMPLETED' && match?.status !== 'COMPLETED') {
      soundService.playFullTimeWhistle();
      showCommentary("📢 FULL-TIME! Match completed!");
      setTimeout(() => {
        navigation.replace('PlayerRating', { 
          matchId,
          homeTeamId: match?.homeTeam?.id,
          homeTeamName: match?.homeTeam?.name,
          awayTeamId: match?.awayTeam?.id,
          awayTeamName: match?.awayTeam?.name
        });
      }, 2000);
    }
  }, [match?.status]);

  // Note: Timer calculation now handled by professional server-side timer service
  // No more client-side timer calculations - all timing comes from WebSocket updates

  const handleHalftime = async () => {
    try {
      console.log('🟨 HALFTIME: Starting halftime process for match:', matchId);
      console.log('🟨 HALFTIME: Current match state:', {
        status: match?.status,
        currentHalf: match?.current_half,
        currentMinute: currentMinute
      });
      
      // IMMEDIATELY set halftime state to stop timer (don't wait for server)
      setIsHalftime(true);
      setShowHalftimeModal(true);
      
      await soundService.playHalftimeWhistle();
      showCommentary("⏱️ HALF-TIME! The referee blows the whistle to end the first half.");
      
      // Now call server API in background
      const result = await apiService.pauseForHalftime(matchId);
      console.log('✅ HALFTIME: API call successful:', result);
      
      console.log('🔄 HALFTIME: Reloading match details...');
      await loadMatchDetails();
      
      console.log('📋 HALFTIME: Halftime modal already shown');
    } catch (error) {
      console.error('❌ HALFTIME: Failed to pause for halftime:', error);
      // Revert halftime state if API fails
      setIsHalftime(false);
      setShowHalftimeModal(false);
      Alert.alert('Error', `Failed to pause for halftime: ${error.message}`);
    }
  };

  const handleStartSecondHalf = async () => {
    try {
      console.log('⚽ SECOND_HALF: Starting second half for match:', matchId);
      console.log('⚽ SECOND_HALF: Current match state:', {
        status: match?.status,
        isHalftime,
        currentHalf: currentHalf,
        currentMinute: currentMinute
      });
      
      // IMMEDIATELY resume timer (don't wait for server)
      setIsHalftime(false);
      setCurrentHalf(2);
      setShowHalftimeModal(false);
      
      await soundService.playSecondHalfWhistle();
      const secondHalfMinutes = match?.second_half_minutes || (match?.duration || 90) / 2;
      showCommentary(`⚽ SECOND HALF! The match resumes for the final ${secondHalfMinutes} minutes!`);
      
      // Now call server API in background
      console.log('📡 SECOND_HALF: Calling SSE API to start second half...');
      const result = await apiService.startSecondHalfSSE(matchId);
      console.log('✅ SECOND_HALF: SSE API call successful:', result);
      
      console.log('🔄 SECOND_HALF: Reloading match details...');
      await loadMatchDetails();
      console.log('✅ SECOND_HALF: Second half started successfully');
    } catch (error) {
      console.error('❌ SECOND_HALF: Failed to start second half:', error);
      // Revert state if API fails
      setIsHalftime(true);
      setCurrentHalf(1);
      setShowHalftimeModal(true);
      Alert.alert('Error', `Failed to start second half: ${error.message}`);
    }
  };

  const handleFullTime = async () => {
    try {
      await apiService.endMatch(matchId);
      await soundService.playFullTimeWhistle();
      showCommentary("📢 FULL-TIME! The referee blows the final whistle! The match has ended!");
      
      // Navigate to player rating after a short delay
      setTimeout(() => {
        navigation.replace('PlayerRating', { 
          matchId,
          homeTeamId: match?.homeTeam?.id,
          homeTeamName: match?.homeTeam?.name,
          awayTeamId: match?.awayTeam?.id,
          awayTeamName: match?.awayTeam?.name
        });
      }, 2000);
    } catch (error) {
      console.error('Error ending match automatically:', error);
    }
  };

  const handleAddStoppageTime = async () => {
    try {
      // Use SSE endpoint to ensure timer service is updated immediately
      await apiService.addStoppageTimeSSE(matchId, 1);
      const halfText = currentHalf === 1 ? 'first' : 'second';
      showCommentary(`⏱️ +1 minute of stoppage time added to the ${halfText} half.`);
      
      // CRUCIAL: Update the local state immediately for instant UI feedback
      setMatch(prevMatch => {
        if (!prevMatch) return prevMatch;
        
        return {
          ...prevMatch,
          added_time_first_half: currentHalf === 1 
            ? (prevMatch.added_time_first_half || 0) + 1
            : prevMatch.added_time_first_half,
          added_time_second_half: currentHalf === 2 
            ? (prevMatch.added_time_second_half || 0) + 1
            : prevMatch.added_time_second_half,
          // Also update camelCase versions for consistency
          addedTimeFirstHalf: currentHalf === 1 
            ? (prevMatch.addedTimeFirstHalf || 0) + 1
            : prevMatch.addedTimeFirstHalf,
          addedTimeSecondHalf: currentHalf === 2 
            ? (prevMatch.addedTimeSecondHalf || 0) + 1
            : prevMatch.addedTimeSecondHalf,
        };
      });
      
      // Also trigger a fresh fetch to ensure server consistency
      setTimeout(() => {
        loadMatchDetails();
      }, 500); // Small delay to let server process the update
      
    } catch (error) {
      Alert.alert('Error', 'Failed to add stoppage time');
    }
  };

  // New Manual Control Handlers
  const handlePauseMatch = async () => {
    try {
      console.log('⏸️ PAUSE: Pausing match:', matchId);
      const result = await apiService.pauseMatch(matchId);
      console.log('✅ PAUSE: API call successful:', result);
      showCommentary('⏸️ Match paused by referee');
      await loadMatchDetails();
    } catch (error) {
      console.error('❌ PAUSE: Failed to pause match:', error);
      Alert.alert('Error', `Failed to pause match: ${error.message}`);
    }
  };

  const handleResumeMatch = async () => {
    try {
      console.log('▶️ RESUME: Resuming match:', matchId);
      const result = await apiService.resumeMatch(matchId);
      console.log('✅ RESUME: API call successful:', result);
      showCommentary('▶️ Match resumed by referee');
      await loadMatchDetails();
    } catch (error) {
      console.error('❌ RESUME: Failed to resume match:', error);
      Alert.alert('Error', `Failed to resume match: ${error.message}`);
    }
  };

  const handleManualHalftime = async () => {
    try {
      console.log('🟨 MANUAL_HT: Triggering manual halftime:', matchId);
      const result = await apiService.manualHalftime(matchId);
      console.log('✅ MANUAL_HT: API call successful:', result);
      showCommentary('🟨 HALF-TIME! Called by referee');
      await loadMatchDetails();
    } catch (error) {
      console.error('❌ MANUAL_HT: Failed to trigger halftime:', error);
      Alert.alert('Error', `Failed to trigger halftime: ${error.message}`);
    }
  };

  const loadMatchDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMatchById(matchId);
      
      if (!response?.match) {
        throw new Error('Invalid match data');
      }
      
      const matchData = response.match;
      
      // Ensure required data exists
      matchData.events = matchData.events || [];
      matchData.homeScore = matchData.homeScore || matchData.home_score || 0;
      matchData.awayScore = matchData.awayScore || matchData.away_score || 0;
      
      setMatch(matchData);
      
      
      // Set immediate match state from database (no waiting for SSE)
      setIsLive(matchData.status === 'LIVE');
      setIsHalftime(matchData.status === 'HALFTIME');
      setCurrentHalf(matchData.current_half || 1);
      setAddedTimeFirstHalf(matchData.added_time_first_half || 0);
      setAddedTimeSecondHalf(matchData.added_time_second_half || 0);
      
      console.log('⏱️ HYBRID_TIMER: Match state set immediately, SSE will provide real-time updates');
      console.log('🔍 MATCH_DEBUG: Match status:', matchData.status, 'isLive:', matchData.status === 'LIVE');

      // Load formation data
      await loadFormationData(matchData);
    } catch (error: any) {
      console.error('Error loading match:', error);
      Alert.alert('Error', 'Failed to load match details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // Halftime break countdown effect
  useEffect(() => {
    if (!isHalftime || !match) return;

    // Calculate time remaining in 15-minute break
    const calculateBreakTimeRemaining = () => {
      const now = Date.now();
      // Get halftime break start time from server (this would need to be in the match data)
      // For now, we'll calculate based on when status changed to HALFTIME
      const halftimeStartTime = new Date(match?.updated_at || match?.matchDate || Date.now()).getTime();
      const breakDurationMs = 15 * 60 * 1000; // 15 minutes
      const elapsedBreakTime = now - halftimeStartTime;
      const timeRemaining = Math.max(0, breakDurationMs - elapsedBreakTime);
      
      return Math.ceil(timeRemaining / 1000); // Return seconds remaining
    };

    // Update countdown every second during halftime break
    const breakTimer = setInterval(() => {
      const remaining = calculateBreakTimeRemaining();
      setHalftimeBreakTimeRemaining(remaining);
      
      if (remaining <= 0) {
        // Break should be over, but don't auto-start (server handles this)
        clearInterval(breakTimer);
      }
    }, 1000);

    // Initial calculation
    setHalftimeBreakTimeRemaining(calculateBreakTimeRemaining());

    return () => clearInterval(breakTimer);
  }, [isHalftime, match]);

  const loadFormationData = async (matchData: any) => {
    try {
      console.log('🧮 Loading formation data for match:', matchId);
      
      // Load formations for both teams
      const [homeFormationResponse, awayFormationResponse] = await Promise.all([
        apiService.getFormationForMatch(matchId, matchData.homeTeam.id),
        apiService.getFormationForMatch(matchId, matchData.awayTeam.id)
      ]);

      console.log('🧮 Home formation:', homeFormationResponse);
      console.log('🧮 Away formation:', awayFormationResponse);

      setHomeFormation(homeFormationResponse?.formation || null);
      setAwayFormation(awayFormationResponse?.formation || null);
      setFormationsLoaded(true);
    } catch (error) {
      console.error('Error loading formation data:', error);
      // Don't throw error - formations are optional
      setHomeFormation(null);
      setAwayFormation(null);
      setFormationsLoaded(true);
    }
  };

  const startMatch = async () => {
    try {
      await soundService.initializeSounds();
      await apiService.startMatch(matchId);
      await soundService.playMatchStartWhistle();
      await loadMatchDetails();
      showCommentary("⚽ KICK-OFF! The referee blows the whistle and the match is underway!");
      
      // Add some initial commentary
      setTimeout(() => {
        showCommentary(`🏟️ Welcome to ${match?.venue || 'the stadium'}! ${match?.homeTeam?.name} take on ${match?.awayTeam?.name} in what promises to be an exciting encounter!`);
      }, 2000);
      
      Vibration.vibrate(100);
    } catch (error) {
      Alert.alert('Error', 'Failed to start match');
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
              await soundService.playFullTimeWhistle();
              showCommentary("📢 FULL-TIME! The referee blows the final whistle! The match has ended!");
              setTimeout(() => {
                // Pass both teams for rating
                navigation.replace('PlayerRating', { 
                  matchId,
                  homeTeamId: match?.homeTeam?.id,
                  homeTeamName: match?.homeTeam?.name,
                  awayTeamId: match?.awayTeam?.id,
                  awayTeamName: match?.awayTeam?.name
                });
              }, 1500);
            } catch (error) {
              Alert.alert('Error', 'Failed to end match');
            }
          }
        }
      ]
    );
  };

  const showCommentary = (text: string) => {
    setLatestCommentary(text);
    
    // Add to commentary history
    const newCommentary = {
      id: Date.now().toString(),
      text,
      minute: currentMinute,
      timestamp: new Date()
    };
    setCommentaryHistory(prev => [newCommentary, ...prev]);
    
    // Toast notification animation - slide down from top
    Animated.sequence([
      Animated.spring(commentaryAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(commentaryAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Clear commentary after animation
      // Use setTimeout to avoid state update during render
      setTimeout(() => {
        setLatestCommentary('');
      }, 0);
    });
  };

  const handleAction = (team: 'home' | 'away', actionType: string) => {
    if (!match) return;
    const teamData = team === 'home' ? match.homeTeam : match.awayTeam;
    setModalTeam(teamData);
    setModalActionType(actionType);
    setShowPlayerModal(true);
  };

  const handleQuickEvent = (eventType: string) => {
    const commentary = eventType === 'SAVE' ? "SAVE! 🧤 Brilliant stop by the goalkeeper!" :
                      eventType === 'MISS' ? "MISS! 😬 The shot goes wide of the target!" :
                      eventType === 'CORNER' ? "Corner kick awarded! 🚩 Great opportunity here!" :
                      "Foul! ⚠️ Free kick awarded for the challenge!";
    showCommentary(commentary);
  };

  const addEvent = async (playerId: string) => {
    try {
      // If it's a goal, show assist modal instead of finishing
      if (modalActionType === 'GOAL') {
        setGoalScorerId(playerId);
        setShowPlayerModal(false);
        setShowAssistModal(true);
        return;
      }

      const player = modalTeam?.players?.find((p: any) => p.id === playerId);
      const eventData = {
        playerId,
        teamId: modalTeam.id,
        eventType: modalActionType,
        minute: currentMinute,
        description: `${modalActionType} by ${modalTeam.name}`,
      };

      await apiService.addMatchEvent(matchId, eventData);
      
      // Generate commentary
      const templates = COMMENTARY_TEMPLATES[modalActionType as keyof typeof COMMENTARY_TEMPLATES] || [];
      const template = templates[Math.floor(Math.random() * templates.length)];
      const commentary = template ? template.replace('{player}', player?.name || 'Unknown') : '';
      showCommentary(commentary);
      
      // Send notifications (non-goal events)
      if (modalActionType === 'YELLOW_CARD' || modalActionType === 'RED_CARD') {
        notifyCard(player?.name || 'Unknown', modalTeam.name, 
          modalActionType === 'YELLOW_CARD' ? 'yellow' : 'red');
        Vibration.vibrate(100);
      } else if (modalActionType === 'SUBSTITUTION') {
        const team = modalTeam?.id === match?.homeTeam?.id ? 'home' : 'away';
        setAvailableSubstitutions(prev => ({
          ...prev,
          [team]: Math.max(0, prev[team] - 1)
        }));
        notifySubstitution(player?.name || 'Unknown', 'Substitute', modalTeam.name);
        Vibration.vibrate(100);
      }

      await loadMatchDetails();
      setShowPlayerModal(false);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to add event');
    }
  };

  const addGoalWithAssist = async (assistPlayerId?: string) => {
    try {
      const goalScorer = modalTeam?.players?.find((p: any) => p.id === goalScorerId);
      const assistPlayer = assistPlayerId ? modalTeam?.players?.find((p: any) => p.id === assistPlayerId) : null;
      
      // Add goal event
      const goalData = {
        playerId: goalScorerId,
        teamId: modalTeam.id,
        eventType: 'GOAL',
        minute: currentMinute,
        description: `GOAL by ${goalScorer?.name || 'Unknown'}${assistPlayer ? ` (Assist: ${assistPlayer.name})` : ''}`,
      };
      
      await apiService.addMatchEvent(matchId, goalData);
      
      // Add assist event if selected
      if (assistPlayerId && assistPlayerId !== goalScorerId) {
        const assistData = {
          playerId: assistPlayerId,
          teamId: modalTeam.id,
          eventType: 'ASSIST',
          minute: currentMinute,
          description: `ASSIST by ${assistPlayer?.name || 'Unknown'}`,
        };
        
        await apiService.addMatchEvent(matchId, assistData);
      }
      
      // Generate commentary
      const goalTemplate = COMMENTARY_TEMPLATES.GOAL[Math.floor(Math.random() * COMMENTARY_TEMPLATES.GOAL.length)];
      const commentary = goalTemplate.replace('{player}', goalScorer?.name || 'Unknown') + 
                        (assistPlayer ? ` Great assist from ${assistPlayer.name}!` : '');
      showCommentary(commentary);
      
      // Send notifications
      const team = modalTeam?.id === match?.homeTeam?.id ? 'home' : 'away';
      const homeScore = match?.homeScore ?? 0;
      const awayScore = match?.awayScore ?? 0;
      const newScore = team === 'home' 
        ? `${homeScore + 1}-${awayScore}`
        : `${homeScore}-${awayScore + 1}`;
      notifyGoal(goalScorer?.name || 'Unknown', modalTeam.name, newScore);
      animateScore();
      Vibration.vibrate([0, 200, 100, 200]);
      
      setShowAssistModal(false);
      setModalTeam(null);
      setModalActionType('');
      setGoalScorerId('');
      
      await loadMatchDetails();
    } catch (error) {
      console.error('Error adding goal with assist:', error);
      Alert.alert('Error', 'Failed to add goal. Please try again.');
    }
  };

  const animateScore = () => {
    Animated.sequence([
      Animated.timing(scoreAnimation, {
        toValue: 1.2,
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Actions':
        return (
          <View style={styles.tabContent}>
            {(isLive || isHalftime) ? (
              <View style={styles.sectionContainer}>
                {/* Time Controls Bar */}
                <View style={styles.timeControlsBar}>
                  <LinearGradient
                    colors={[colors.accent.blue + '15', colors.accent.teal + '05']}
                    style={styles.timeControlsGradient}
                  >
                    <View style={styles.timeControlsContent}>
                      <View style={styles.timeInfo}>
                        {timerData.isHalftime ? (
                          <View style={styles.halftimeBreakInfo}>
                            <Text style={styles.halftimeBreakTitle}>⏰ Halftime Break</Text>
                            <Text style={styles.halftimeBreakCountdown}>
                              {Math.floor(halftimeBreakTimeRemaining / 60)}:{String(halftimeBreakTimeRemaining % 60).padStart(2, '0')} remaining
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.timeInfoText}>
                            Half {timerData.currentHalf} | +{timerData.currentHalf === 1 ? addedTimeFirstHalf : addedTimeSecondHalf} min
                          </Text>
                        )}
                      </View>
                      
                      <View style={styles.timeControlButtons}>
                        {!timerData.isHalftime && (
                          <TouchableOpacity
                            style={styles.quickButton}
                            onPress={handleAddStoppageTime}
                          >
                            <Ionicons name="add" size={16} color={colors.accent.blue} />
                            <Text style={styles.quickButtonText}>+1</Text>
                          </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity
                          style={[styles.quickButton, { marginLeft: 8 }]}
                          onPress={() => setShowManualControls(!showManualControls)}
                        >
                          <Ionicons name="settings" size={16} color={colors.accent.purple} />
                          <Text style={styles.quickButtonText}>Ref</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                {/* Manual Controls Panel */}
                {showManualControls && (
                  <View style={styles.cardSection}>
                    <LinearGradient
                      colors={[colors.accent.purple + '15', colors.accent.coral + '10']}
                      style={styles.cardGradient}
                    >
                      <View style={styles.manualControlsPanel}>
                        <Text style={styles.manualControlsTitle}>🧑‍⚖️ Referee Controls</Text>
                        <View style={styles.manualControlsGrid}>
                          {!isHalftime && isLive && (
                            <TouchableOpacity style={styles.manualControlButton} onPress={handlePauseMatch}>
                              <Ionicons name="pause" size={20} color={colors.accent.orange} />
                              <Text style={styles.manualControlButtonText}>Pause</Text>
                            </TouchableOpacity>
                          )}
                          
                          {!isHalftime && !isLive && match?.status === 'LIVE' && (
                            <TouchableOpacity style={styles.manualControlButton} onPress={handleResumeMatch}>
                              <Ionicons name="play" size={20} color={colors.accent.teal} />
                              <Text style={styles.manualControlButtonText}>Resume</Text>
                            </TouchableOpacity>
                          )}
                          
                          {currentHalf === 1 && !isHalftime && (
                            <TouchableOpacity style={styles.manualControlButton} onPress={handleManualHalftime}>
                              <Ionicons name="pause-circle" size={20} color={colors.accent.gold} />
                              <Text style={styles.manualControlButtonText}>Call HT</Text>
                            </TouchableOpacity>
                          )}
                          
                          {isHalftime && (
                            <TouchableOpacity style={styles.manualControlButton} onPress={handleStartSecondHalf}>
                              <Ionicons name="play-circle" size={20} color={colors.primary.main} />
                              <Text style={styles.manualControlButtonText}>Start 2nd</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                )}

                {/* Match Actions Card */}
                <View style={styles.cardSection}>
                  <LinearGradient
                    colors={[colors.background.secondary, colors.background.tertiary]}
                    style={styles.cardGradient}
                  >
                    <ProfessionalMatchAction
                      homeTeamName={match.homeTeam?.name || 'Home'}
                      awayTeamName={match.awayTeam?.name || 'Away'}
                      isLive={timerData.isLive}
                      availableSubstitutions={availableSubstitutions}
                      onAction={handleAction}
                      onQuickEvent={handleQuickEvent}
                    />
                  </LinearGradient>
                </View>

                {/* End Match Button */}
                <View style={styles.cardSection}>
                  <TouchableOpacity
                    style={styles.endMatchButton}
                    onPress={endMatch}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[colors.background.secondary, colors.background.tertiary]}
                      style={styles.endMatchGradient}
                    >
                      <Ionicons name="stop-circle" size={22} color={colors.accent.coral} />
                      <Text style={styles.endMatchButtonText}>End Match</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.sectionContainer}>
                <View style={styles.cardSection}>
                  <LinearGradient
                    colors={gradients.primary}
                    style={styles.startMatchCard}
                  >
                    <Ionicons name="football" size={64} color="#FFFFFF" />
                    <Text style={styles.startMatchTitle}>Ready to Kick Off?</Text>
                    <Text style={styles.startMatchSubtitle}>
                      Begin live match tracking and commentary
                    </Text>
                    <TouchableOpacity
                      style={styles.startMatchButton}
                      onPress={startMatch}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="play" size={24} color={colors.primary.main} />
                      <Text style={styles.startMatchButtonText}>Start Match</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              </View>
            )}
          </View>
        );
        
      case 'Commentary':
        return (
          <View style={styles.tabContent}>
            <View style={styles.sectionContainer}>
              {/* Commentary Header Card */}
              <View style={styles.cardSection}>
                <LinearGradient
                  colors={[colors.primary.main + '20', colors.primary.main + '10']}
                  style={styles.cardGradient}
                >
                  <View style={styles.sectionHeader}>
                    <Ionicons name="mic" size={24} color={colors.primary.main} />
                    <Text style={styles.sectionTitle}>Live Commentary</Text>
                    {isLive && (
                      <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </View>

              {/* Commentary Feed */}
              {commentaryHistory.length > 0 ? (
                <ScrollView style={styles.commentaryScrollArea} showsVerticalScrollIndicator={false}>
                  {commentaryHistory.map((commentary, index) => (
                    <View key={commentary.id} style={styles.cardSection}>
                      <LinearGradient
                        colors={[colors.background.secondary, colors.background.tertiary + '80']}
                        style={styles.commentaryCardGradient}
                      >
                        <View style={styles.commentaryItem}>
                          <View style={styles.commentaryTimeContainer}>
                            <Text style={styles.commentaryMinute}>{commentary.minute}'</Text>
                            <Text style={styles.commentaryTimestamp}>
                              {commentary.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </Text>
                          </View>
                          <View style={styles.commentaryContent}>
                            <Text style={styles.commentaryContentText}>{commentary.text}</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.cardSection}>
                  <LinearGradient
                    colors={[colors.background.secondary, colors.background.tertiary]}
                    style={styles.cardGradient}
                  >
                    <View style={styles.emptyState}>
                      <Ionicons name="mic-outline" size={48} color={colors.text.tertiary} />
                      <Text style={styles.emptyText}>No commentary yet</Text>
                      <Text style={styles.emptySubtext}>
                        {isLive ? 'Commentary will appear as events happen' : 'Start the match to see live commentary'}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              )}
            </View>
          </View>
        );
        
      case 'Timeline':
        return (
          <View style={styles.tabContent}>
            <View style={styles.sectionContainer}>
              {/* Timeline Header Card */}
              <View style={styles.cardSection}>
                <LinearGradient
                  colors={[colors.accent.blue + '20', colors.accent.purple + '10']}
                  style={styles.cardGradient}
                >
                  <View style={styles.sectionHeader}>
                    <Ionicons name="time" size={24} color={colors.accent.blue} />
                    <Text style={styles.sectionTitle}>Match Events</Text>
                    {isLive && (
                      <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </View>
              
              {/* Timeline Events */}
              {match?.events && match.events.length > 0 ? (
                <ScrollView style={styles.timelineScrollArea} showsVerticalScrollIndicator={false}>
                  <View style={styles.cardSection}>
                    <LinearGradient
                      colors={[colors.background.secondary, colors.background.tertiary]}
                      style={styles.cardGradient}
                    >
                      <View style={styles.timeline}>
                        {(match?.events || [])
                          .sort((a: any, b: any) => b.minute - a.minute)
                          .map((event: any, index: number) => (
                            <ProfessionalMatchEvent
                              key={event.id}
                              event={{
                                ...event,
                                team: {
                                  name: event.teamId === match?.homeTeam?.id 
                                    ? match?.homeTeam?.name || 'Home Team'
                                    : match?.awayTeam?.name || 'Away Team',
                                  isHome: event.teamId === match?.homeTeam?.id,
                                },
                              }}
                              showConnector={index < (match?.events?.length || 0) - 1}
                            />
                          ))}
                      </View>
                    </LinearGradient>
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.cardSection}>
                  <LinearGradient
                    colors={[colors.background.secondary, colors.background.tertiary]}
                    style={styles.cardGradient}
                  >
                    <View style={styles.emptyState}>
                      <Ionicons name="time-outline" size={48} color={colors.text.tertiary} />
                      <Text style={styles.emptyText}>No events yet</Text>
                      <Text style={styles.emptySubtext}>
                        {isLive ? 'Events will appear here' : 'Start the match to add events'}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              )}
            </View>
          </View>
        );
        
      case 'Formation':
        return (
          <View style={styles.tabContent}>
            <View style={styles.sectionContainer}>
              {/* Formation Header Card */}
              <View style={styles.cardSection}>
                <LinearGradient
                  colors={[colors.primary.main + '20', colors.accent.blue + '10']}
                  style={styles.cardGradient}
                >
                  <View style={styles.sectionHeader}>
                    <Ionicons name="football" size={24} color={colors.primary.main} />
                    <Text style={styles.sectionTitle}>Match Formation</Text>
                    {isLive && (
                      <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </View>

              {/* Formation Pitch */}
              <View style={styles.cardSection}>
                <LinearGradient
                  colors={[colors.background.secondary, colors.background.tertiary]}
                  style={styles.cardGradient}
                >
                  {formationsLoaded ? (
                    <ModernPitchFormation
                      homeTeam={{
                        id: match?.homeTeam?.id || 'home',
                        name: match?.homeTeam?.name || 'Home Team',
                        players: homeFormation?.players || match?.homeTeam?.players || []
                      }}
                      awayTeam={{
                        id: match?.awayTeam?.id || 'away',
                        name: match?.awayTeam?.name || 'Away Team',  
                        players: awayFormation?.players || match?.awayTeam?.players || []
                      }}
                      savedFormations={{
                        home: homeFormation,
                        away: awayFormation
                      }}
                      showPlayerNames={true}
                      style={styles.pitchFormation}
                    />
                  ) : (
                    <View style={styles.formationLoading}>
                      <ActivityIndicator size="large" color={colors.primary.main} />
                      <Text style={styles.formationLoadingText}>Loading formations...</Text>
                    </View>
                  )}
                </LinearGradient>
              </View>

              {/* Team Lists */}
              <ScrollView style={styles.teamListScrollArea} showsVerticalScrollIndicator={false}>
                {/* Home Team Players */}
                <View style={styles.cardSection}>
                  <LinearGradient
                    colors={[colors.primary.main + '15', colors.primary.main + '05']}
                    style={styles.cardGradient}
                  >
                    <View style={styles.teamListHeader}>
                      <Ionicons name="home" size={20} color={colors.primary.main} />
                      <Text style={styles.teamListTitle}>{match?.homeTeam?.name || 'Home Team'} (Home)</Text>
                      <Text style={styles.playerCount}>{match?.homeTeam?.players?.length || 0} players</Text>
                    </View>
                    <View style={styles.teamPlayersList}>
                      {(match?.homeTeam?.players || []).map((player: any, index: number) => (
                        <View key={player.id || index} style={styles.formationPlayerCard}>
                          <View style={styles.playerAvatarContainer}>
                            <View style={[styles.playerAvatar, { backgroundColor: colors.primary.main }]}>
                              <Text style={styles.playerAvatarText}>
                                {player.name?.charAt(0) || '?'}
                              </Text>
                            </View>
                            {player.jerseyNumber && (
                              <View style={styles.jerseyBadge}>
                                <Text style={styles.jerseyNumber}>{player.jerseyNumber}</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.playerInfo}>
                            <Text style={styles.playerName}>{player.name}</Text>
                            <Text style={styles.playerPosition}>{player.position}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </LinearGradient>
                </View>

                {/* Away Team Players */}
                <View style={styles.cardSection}>
                  <LinearGradient
                    colors={[colors.accent.coral + '15', colors.accent.coral + '05']}
                    style={styles.cardGradient}
                  >
                    <View style={styles.teamListHeader}>
                      <Ionicons name="airplane" size={20} color={colors.accent.coral} />
                      <Text style={styles.teamListTitle}>{match?.awayTeam?.name || 'Away Team'} (Away)</Text>
                      <Text style={styles.playerCount}>{match?.awayTeam?.players?.length || 0} players</Text>
                    </View>
                    <View style={styles.teamPlayersList}>
                      {(match?.awayTeam?.players || []).map((player: any, index: number) => (
                        <View key={player.id || index} style={styles.formationPlayerCard}>
                          <View style={styles.playerAvatarContainer}>
                            <View style={[styles.playerAvatar, { backgroundColor: colors.accent.coral }]}>
                              <Text style={styles.playerAvatarText}>
                                {player.name?.charAt(0) || '?'}
                              </Text>
                            </View>
                            {player.jerseyNumber && (
                              <View style={styles.jerseyBadge}>
                                <Text style={styles.jerseyNumber}>{player.jerseyNumber}</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.playerInfo}>
                            <Text style={styles.playerName}>{player.name}</Text>
                            <Text style={styles.playerPosition}>{player.position}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </LinearGradient>
                </View>
              </ScrollView>
            </View>
          </View>
        );
        
      case 'Stats':
        const homeGoals = match?.events?.filter((e: any) => e.eventType === 'GOAL' && e.teamId === match?.homeTeam?.id).length || 0;
        const awayGoals = match?.events?.filter((e: any) => e.eventType === 'GOAL' && e.teamId === match?.awayTeam?.id).length || 0;
        const homeCards = match?.events?.filter((e: any) => (e.eventType === 'YELLOW_CARD' || e.eventType === 'RED_CARD') && e.teamId === match?.homeTeam?.id).length || 0;
        const awayCards = match?.events?.filter((e: any) => (e.eventType === 'YELLOW_CARD' || e.eventType === 'RED_CARD') && e.teamId === match?.awayTeam?.id).length || 0;
        const totalEvents = match?.events?.length || 0;
        
        return (
          <View style={styles.tabContent}>
            <View style={styles.sectionContainer}>
              {/* Stats Header Card */}
              <View style={styles.cardSection}>
                <LinearGradient
                  colors={[colors.accent.teal + '20', colors.accent.blue + '10']}
                  style={styles.cardGradient}
                >
                  <View style={styles.sectionHeader}>
                    <Ionicons name="analytics" size={24} color={colors.accent.teal} />
                    <Text style={styles.sectionTitle}>Match Statistics</Text>
                  </View>
                </LinearGradient>
              </View>

              <ScrollView style={styles.statsScrollArea} showsVerticalScrollIndicator={false}>
                {/* Goals Stats Card */}
                <View style={styles.cardSection}>
                  <LinearGradient
                    colors={[colors.semantic.success + '20', colors.semantic.success + '10']}
                    style={styles.cardGradient}
                  >
                    <View style={styles.statCard}>
                      <Text style={styles.statCardTitle}>⚽ Goals</Text>
                      <View style={styles.statRow}>
                        <View style={styles.statTeam}>
                          <Text style={styles.statTeamName}>{match?.homeTeam?.name}</Text>
                          <Text style={styles.statValue}>{homeGoals}</Text>
                        </View>
                        <Text style={styles.statVs}>VS</Text>
                        <View style={styles.statTeam}>
                          <Text style={styles.statValue}>{awayGoals}</Text>
                          <Text style={styles.statTeamName}>{match?.awayTeam?.name}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                {/* Cards Stats Card */}
                <View style={styles.cardSection}>
                  <LinearGradient
                    colors={[colors.semantic.warning + '20', colors.semantic.warning + '10']}
                    style={styles.cardGradient}
                  >
                    <View style={styles.statCard}>
                      <Text style={styles.statCardTitle}>🟨 Cards</Text>
                      <View style={styles.statRow}>
                        <View style={styles.statTeam}>
                          <Text style={styles.statTeamName}>{match?.homeTeam?.name}</Text>
                          <Text style={styles.statValue}>{homeCards}</Text>
                        </View>
                        <Text style={styles.statVs}>VS</Text>
                        <View style={styles.statTeam}>
                          <Text style={styles.statValue}>{awayCards}</Text>
                          <Text style={styles.statTeamName}>{match?.awayTeam?.name}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                {/* Match Info Card */}
                <View style={styles.cardSection}>
                  <LinearGradient
                    colors={[colors.accent.blue + '20', colors.accent.purple + '10']}
                    style={styles.cardGradient}
                  >
                    <View style={styles.statCard}>
                      <Text style={styles.statCardTitle}>📊 Match Info</Text>
                      <View style={styles.matchInfoGrid}>
                        <View style={styles.matchInfoItem}>
                          <Text style={styles.matchInfoLabel}>Duration</Text>
                          <Text style={styles.matchInfoValue}>{currentMinute}'</Text>
                        </View>
                        <View style={styles.matchInfoItem}>
                          <Text style={styles.matchInfoLabel}>Total Events</Text>
                          <Text style={styles.matchInfoValue}>{totalEvents}</Text>
                        </View>
                        <View style={styles.matchInfoItem}>
                          <Text style={styles.matchInfoLabel}>Status</Text>
                          <Text style={[styles.matchInfoValue, { color: isLive ? colors.status.live : colors.status.scheduled }]}>
                            {isLive ? 'LIVE' : 'SCHEDULED'}
                          </Text>
                        </View>
                        <View style={styles.matchInfoItem}>
                          <Text style={styles.matchInfoLabel}>Venue</Text>
                          <Text style={styles.matchInfoValue}>{match?.venue || 'TBD'}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                {/* Event Timeline Card */}
                {match?.events && match.events.length > 0 && (
                  <View style={styles.cardSection}>
                    <LinearGradient
                      colors={[colors.background.secondary, colors.background.tertiary]}
                      style={styles.cardGradient}
                    >
                      <View style={styles.statCard}>
                        <Text style={styles.statCardTitle}>⏱️ Event Timeline</Text>
                        <View style={styles.eventBreakdown}>
                          {match.events
                            .sort((a: any, b: any) => a.minute - b.minute)
                            .map((event: any, index: number) => (
                              <View key={event.id} style={styles.eventBreakdownItem}>
                                <Text style={styles.eventMinute}>{event.minute}'</Text>
                                <View style={[styles.eventTypeIndicator, { 
                                  backgroundColor: event.eventType === 'GOAL' ? colors.semantic.success :
                                                 event.eventType === 'YELLOW_CARD' ? colors.semantic.warning :
                                                 event.eventType === 'RED_CARD' ? colors.semantic.error :
                                                 colors.accent.blue
                                }]} />
                                <Text style={styles.eventDescription}>{event.eventType}</Text>
                              </View>
                            ))}
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                )}
              </ScrollView>
            </View>
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
        <Text style={styles.loadingText}>Loading match...</Text>
      </View>
    );
  }

  if (isLoading || !match) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>
          {isLoading ? 'Loading match...' : 'Match not found'}
        </Text>
        {!isLoading && (
          <ProfessionalButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="secondary"
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Professional Header */}
        <Animated.View style={{ transform: [{ scale: scoreAnimation }] }}>
          <ProfessionalMatchHeader
            match={match}
            timer={{
              currentMinute,
              currentSecond,
              displayTime: timerData.displayTime,
              displayMinute: displayText,
              isHalftime: timerData.isHalftime,
              isLive: timerData.isLive,
              currentHalf: timerData.currentHalf,
              connectionStatus: 'connected'
            }}
            onBack={() => navigation.goBack()}
          />
        </Animated.View>
        
        {/* Live Commentary Toast */}
        {latestCommentary && (
          <Animated.View 
            style={[
              styles.commentaryBanner,
              {
                opacity: commentaryAnimation,
                transform: [{
                  translateY: commentaryAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0]
                  })
                }]
              }
            ]}
          >
            <LinearGradient
              colors={latestCommentary.includes('GOOOOOAL') || latestCommentary.includes('GOAL') 
                ? ['#10B981', '#059669'] 
                : latestCommentary.includes('CARD')
                ? ['#F59E0B', '#D97706']
                : ['#3B82F6', '#2563EB']
              }
              style={styles.commentaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.commentaryText}>{latestCommentary}</Text>
            </LinearGradient>
          </Animated.View>
        )}
        
        {/* Content Sections */}
        <View style={styles.content}>
          {/* Modern Tab Navigation */}
          <View style={styles.modernTabs}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.modernTab, activeTab === tab && styles.modernTabActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  {activeTab === tab && (
                    <LinearGradient
                      colors={gradients.primary}
                      style={styles.modernTabGradient}
                    />
                  )}
                  <Text style={[
                    styles.modernTabText,
                    activeTab === tab && styles.modernTabTextActive
                  ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Tab Content */}
          <View style={styles.tabContentContainer}>
            {renderTabContent()}
          </View>
        </View>
      </ScrollView>
      
      {/* Player Selection Modal */}
      <Modal
        visible={showPlayerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPlayerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modalActionType === 'GOAL' ? '⚽ Select Goal Scorer' : 
               modalActionType === 'YELLOW_CARD' ? '🟨 Select Player (Yellow Card)' :
               modalActionType === 'RED_CARD' ? '🟥 Select Player (Red Card)' :
               modalActionType === 'SUBSTITUTION' ? '🔄 Select Player (Substitution)' :
               `Select Player - ${modalActionType?.replace(/_/g, ' ')}`}
            </Text>
            <TouchableOpacity onPress={() => setShowPlayerModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={modalTeam?.players || []}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.enhancedModalPlayerItem}
                onPress={() => addEvent(item.id)}
              >
                <View style={styles.playerRowContainer}>
                  <View style={styles.playerAvatarContainer}>
                    <View style={[styles.playerAvatar, { backgroundColor: colors.primary.main }]}>
                      <Text style={styles.playerAvatarText}>
                        {item.name?.charAt(0) || '?'}
                      </Text>
                    </View>
                    {item.jerseyNumber && (
                      <View style={styles.jerseyBadge}>
                        <Text style={styles.jerseyNumber}>{item.jerseyNumber}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{item.name}</Text>
                    <Text style={styles.playerPosition}>{item.position}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
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
            <Text style={styles.modalTitle}>🎯 Select Assist Provider</Text>
            <TouchableOpacity onPress={() => setShowAssistModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.assistModalContent}>
            <TouchableOpacity
              style={styles.noAssistButton}
              onPress={() => addGoalWithAssist()}
            >
              <Ionicons name="close-circle-outline" size={24} color={colors.text.secondary} />
              <Text style={styles.noAssistText}>No Assist - Solo Goal</Text>
            </TouchableOpacity>
            
            <FlatList
              data={modalTeam?.players?.filter((p: any) => p.id !== goalScorerId) || []}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.enhancedModalPlayerItem}
                  onPress={() => addGoalWithAssist(item.id)}
                >
                  <View style={styles.playerRowContainer}>
                    <View style={styles.playerAvatarContainer}>
                      <View style={[styles.playerAvatar, { backgroundColor: colors.semantic.success }]}>
                        <Text style={styles.playerAvatarText}>
                          {item.name?.charAt(0) || '?'}
                        </Text>
                      </View>
                      {item.jerseyNumber && (
                        <View style={styles.jerseyBadge}>
                          <Text style={styles.jerseyNumber}>{item.jerseyNumber}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{item.name}</Text>
                      <Text style={styles.playerPosition}>{item.position}</Text>
                    </View>
                    <Ionicons name="add-circle" size={24} color={colors.semantic.success} />
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      {/* Halftime Modal */}
      <Modal
        visible={showHalftimeModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.halftimeModalContent}>
            <LinearGradient
              colors={[colors.background.secondary, colors.background.tertiary]}
              style={styles.halftimeModalGradient}
            >
              <View style={styles.halftimeIconContainer}>
                <Ionicons name="time-outline" size={48} color={colors.primary.main} />
              </View>
              
              <Text style={styles.halftimeTitle}>HALF TIME</Text>
              <Text style={styles.halftimeSubtitle}>
                First half has ended at {(match?.first_half_minutes || (match?.duration || 90) / 2) + addedTimeFirstHalf} minutes
              </Text>
              
              <View style={styles.halftimeStats}>
                <View style={styles.halftimeScore}>
                  <Text style={styles.halftimeTeamName}>{match?.homeTeam?.name}</Text>
                  <Text style={styles.halftimeScoreText}>{match?.homeScore}</Text>
                </View>
                <Text style={styles.halftimeDash}>-</Text>
                <View style={styles.halftimeScore}>
                  <Text style={styles.halftimeScoreText}>{match?.awayScore}</Text>
                  <Text style={styles.halftimeTeamName}>{match?.awayTeam?.name}</Text>
                </View>
              </View>
              
              <Text style={styles.halftimeInfo}>
                The teams are taking a 15-minute break. Press the button below when ready to start the second half.
              </Text>
              
              <TouchableOpacity
                style={styles.startSecondHalfButton}
                onPress={handleStartSecondHalf}
              >
                <LinearGradient
                  colors={gradients.primary}
                  style={styles.startSecondHalfGradient}
                >
                  <Ionicons name="play" size={20} color="#FFFFFF" />
                  <Text style={styles.startSecondHalfText}>Start Second Half</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  
  // Commentary Banner (replaces old commentary bar)
  commentaryBanner: {
    position: 'absolute',
    top: 50,
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    zIndex: 1000,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  commentaryGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Modern Tab Navigation
  modernTabs: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.screenPadding,
  },
  tabsScrollContent: {
    paddingVertical: spacing.xs,
  },
  modernTab: {
    position: 'relative',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.md,
    borderRadius: borderRadius.badge,
    backgroundColor: colors.surface.subtle,
    overflow: 'hidden',
  },
  modernTabActive: {
    backgroundColor: 'transparent',
  },
  modernTabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.badge,
  },
  modernTabText: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  modernTabTextActive: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  
  // Tab Content Container
  tabContentContainer: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  tabContent: {
    flex: 1,
  },
  
  // Section Containers (like HomeScreen)
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  cardSection: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.card,
  },
  
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.large,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  commentaryBar: {
    margin: spacing.screenPadding,
    marginTop: -spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  commentaryGradient: {
    padding: spacing.md,
  },
  commentaryText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    flex: 1,
  },
  tabs: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabsGradient: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
  },
  tabsContent: {
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.md,
    borderRadius: borderRadius.badge,
  },
  activeTab: {
    backgroundColor: colors.primary.main,
  },
  tabText: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
  },
  startMatchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  startMatchGradient: {
    width: '100%',
    alignItems: 'center',
    padding: spacing.xxxl,
    borderRadius: borderRadius.xl,
  },
  startMatchTitle: {
    fontSize: typography.fontSize.title1,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  startMatchSubtitle: {
    fontSize: typography.fontSize.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xl,
  },
  startMatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    ...shadows.md,
  },
  startMatchButtonText: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    marginLeft: spacing.sm,
  },
  endMatchContainer: {
    padding: spacing.screenPadding,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.live,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.badge,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: spacing.xs,
  },
  liveText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  timeline: {
    paddingHorizontal: spacing.screenPadding,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  comingSoon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  comingSoonSubtext: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.screenPadding,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  modalList: {
    padding: spacing.screenPadding,
  },
  modalPlayerItem: {
    marginBottom: spacing.sm,
  },
  enhancedModalPlayerItem: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playerRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  jerseyBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary.main,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  jerseyNumber: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  playerPosition: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  assistModalContent: {
    flex: 1,
  },
  noAssistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.text.tertiary + '40',
    borderStyle: 'dashed',
  },
  noAssistText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    fontStyle: 'italic',
  },
  
  // Commentary Tab Styles
  commentaryHeader: {
    marginBottom: spacing.lg,
  },
  commentaryHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    marginHorizontal: spacing.screenPadding,
  },
  commentaryTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  commentaryFeed: {
    paddingHorizontal: spacing.screenPadding,
  },
  commentaryItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },
  commentaryTimeContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
    minWidth: 50,
  },
  commentaryMinute: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  commentaryTimestamp: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  commentaryContent: {
    flex: 1,
  },
  commentaryText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.primary,
    lineHeight: 22,
  },
  
  // Stats Tab Styles
  statsHeader: {
    marginBottom: spacing.lg,
  },
  statsHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    marginHorizontal: spacing.screenPadding,
  },
  statsTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  statsContainer: {
    paddingHorizontal: spacing.screenPadding,
  },
  statCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardTitle: {
    fontSize: typography.fontSize.title4,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statTeam: {
    alignItems: 'center',
    flex: 1,
  },
  statTeamName: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.huge,
    fontWeight: typography.fontWeight.black,
    color: colors.text.primary,
  },
  statVs: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.tertiary,
    marginHorizontal: spacing.md,
  },
  matchInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  matchInfoItem: {
    width: '48%',
    marginBottom: spacing.md,
  },
  matchInfoLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchInfoValue: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  eventBreakdown: {
    gap: spacing.sm,
  },
  eventBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  eventMinute: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    width: 40,
  },
  eventTypeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
  },
  eventDescription: {
    fontSize: typography.fontSize.small,
    color: colors.text.primary,
    flex: 1,
  },
  
  // New Professional Styles
  startMatchCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.card,
  },
  endMatchCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  endMatchTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  endMatchSubtitle: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  endMatchButton: {
    minWidth: 120,
  },
  commentaryScrollArea: {
    maxHeight: height * 0.5,
  },
  commentaryCardGradient: {
    borderRadius: borderRadius.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },
  commentaryContentText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.primary,
    lineHeight: 22,
  },
  timelineScrollArea: {
    maxHeight: height * 0.5,
  },
  statsScrollArea: {
    maxHeight: height * 0.6,
  },
  
  // Formation Tab Styles
  pitchFormation: {
    marginVertical: spacing.md,
  },
  teamListScrollArea: {
    maxHeight: height * 0.4,
  },
  teamListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  teamListTitle: {
    fontSize: typography.fontSize.title4,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  playerCount: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    backgroundColor: colors.background.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.badge,
  },
  teamPlayersList: {
    gap: spacing.sm,
  },
  formationPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  formationLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  formationLoadingText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  
  // Compact Time Controls Styles
  timeControlsBar: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  timeControlsGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  timeControlsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInfo: {
    flex: 1,
  },
  timeInfoText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  timeControlButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.accent.blue + '30',
  },
  quickButtonText: {
    fontSize: typography.fontSize.caption,
    color: colors.accent.blue,
    fontWeight: typography.fontWeight.bold,
  },
  halftimeQuickButton: {
    backgroundColor: colors.accent.orange,
    borderColor: colors.accent.orange,
  },
  secondHalfQuickButton: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  
  // Halftime Modal Styles
  halftimeModalContent: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  halftimeModalGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  halftimeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  halftimeTitle: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  halftimeSubtitle: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  halftimeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  halftimeScore: {
    alignItems: 'center',
  },
  halftimeTeamName: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  halftimeScoreText: {
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  halftimeDash: {
    fontSize: typography.fontSize.h2,
    color: colors.text.secondary,
    marginHorizontal: spacing.lg,
  },
  halftimeInfo: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  startSecondHalfButton: {
    width: '100%',
    borderRadius: borderRadius.button,
    overflow: 'hidden',
  },
  startSecondHalfGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  startSecondHalfText: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  
  // Bottom End Match Button
  endMatchButton: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.button,
    overflow: 'hidden',
    ...shadows.large,
  },
  endMatchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  endMatchButtonText: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },

  // Halftime Break Styles
  halftimeBreakInfo: {
    alignItems: 'flex-start',
  },
  halftimeBreakTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.orange,
    marginBottom: 2,
  },
  halftimeBreakCountdown: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },

  // Manual Controls Styles
  manualControlsPanel: {
    padding: spacing.md,
  },
  manualControlsTitle: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  manualControlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  manualControlButton: {
    minWidth: 80,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.sm,
  },
  manualControlButtonText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginTop: 4,
  },
});