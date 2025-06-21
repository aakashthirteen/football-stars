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
import { useMatchTimer, useHalftimeBreakDisplay } from '../../hooks/useMatchTimer';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMatchNotifications } from '../../hooks/useNotifications';

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
import { SSETestButton } from '../../components/SSETestButton';

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
  const { matchId, matchStatus: routeMatchStatus, isLive: routeIsLive } = route?.params || {};
  
  console.log('🚀 INSTANT: Screen opened with params:', {
    matchId,
    routeMatchStatus,
    routeIsLive
  });
  const [match, setMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Actions');
  const [latestCommentary, setLatestCommentary] = useState<string>('');
  const [commentaryHistory, setCommentaryHistory] = useState<Array<{id: string, text: string, minute: number, timestamp: Date}>>([]);
  const [availableSubstitutions, setAvailableSubstitutions] = useState({
    home: 3,
    away: 3,
  });
  
  // Use the new SSE-based timer hook
  const timerState = useMatchTimer(matchId);
  const { breakTimeDisplay, isBreakEnding } = useHalftimeBreakDisplay(timerState.halftimeBreakRemaining);
  
  // CONSOLIDATED: Single effect for timer state management (prevents multiple re-renders)
  useEffect(() => {
    // Reset manual start flag once timer confirms live status (SSE or polling)
    if (matchStartRequested && timerState.status === 'LIVE') {
      console.log('✅ Timer confirmed live status, resetting manual flag');
      setMatchStartRequested(false);
    }
    
    // Debug logging (consolidated)
    console.log('🔍 CONSOLIDATED State Update:', {
      timerStatus: timerState.status,
      isHalftime: timerState.isHalftime,
      matchStatus: match?.status,
      matchStartRequested: matchStartRequested,
      connectionStatus: timerState.connectionStatus,
      currentMinute: timerState.currentMinute
    });
  }, [timerState.status, timerState.isHalftime, match?.status, matchStartRequested, timerState.connectionStatus, timerState.currentMinute]);
  
  // Formation data
  const [homeFormation, setHomeFormation] = useState<any>(null);
  const [awayFormation, setAwayFormation] = useState<any>(null);
  const [formationsLoaded, setFormationsLoaded] = useState(false);
  
  // Halftime modal
  const [showHalftimeModal, setShowHalftimeModal] = useState(false);
  const [showManualControls, setShowManualControls] = useState(false);
  
  // Track if match has been manually started (to handle SSE delay)
  const [matchStartRequested, setMatchStartRequested] = useState(false);
  
  // Safety timeout to prevent infinite loading
  const [dataReadyTimeout, setDataReadyTimeout] = useState(false);
  
  // Note: showLiveView is now computed via useMemo for instant updates
  
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
    timerState.currentMinute
  );

  useEffect(() => {
    loadMatchDetails();
    
    // Safety timeout - force data ready after 3 seconds to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⏰ SAFETY TIMEOUT: Forcing data ready after 3 seconds');
      setDataReadyTimeout(true);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Handle halftime modal based on timer state
  useEffect(() => {
    if (timerState.isHalftime && !showHalftimeModal && timerState.status === 'HALFTIME') {
      setShowHalftimeModal(true);
      soundService.playHalftimeWhistle();
      showCommentary("⏱️ HALF-TIME! 15-minute break begins.");
    } else if (!timerState.isHalftime && showHalftimeModal) {
      setShowHalftimeModal(false);
    }
  }, [timerState.isHalftime, timerState.status]);

  // Handle fulltime
  useEffect(() => {
    if (timerState.status === 'COMPLETED' && match?.status !== 'COMPLETED') {
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
  }, [timerState.status]);

  // INSTANT: Calculate live view state synchronously (no delays)
  const shouldShowLiveView = React.useMemo(() => {
    // FIRST PRIORITY: Route params for instant navigation (no API wait)
    const isLiveFromRoute = routeIsLive === true;
    const isMatchLiveInDB = match?.status === 'LIVE' || match?.status === 'HALFTIME';
    const hasStartBeenRequested = matchStartRequested === true;
    const isTimerLive = timerState.status === 'LIVE';
    const isInHalftime = timerState.isHalftime;
    
    // Priority: Route params > DB status > Manual request > Timer status
    const shouldShow = isLiveFromRoute || isMatchLiveInDB || hasStartBeenRequested || isTimerLive || isInHalftime;
    
    console.log('⚡ INSTANT VIEW DECISION:', {
      isLiveFromRoute,
      isMatchLiveInDB,
      hasStartBeenRequested,
      isTimerLive,
      isInHalftime,
      shouldShow,
      routeStatus: routeMatchStatus,
      matchStatus: match?.status,
      timerStatus: timerState.status
    });
    
    return shouldShow;
  }, [routeIsLive, match?.status, matchStartRequested, timerState.status, timerState.isHalftime, routeMatchStatus]);

  // Enhanced loading state: Keep loading until we have enough data to make correct view decision
  const isDataReady = React.useMemo(() => {
    // Safety timeout - force ready after 3 seconds to prevent infinite loading
    if (dataReadyTimeout) {
      console.log('⏰ FORCED DATA READY due to timeout');
      return true;
    }
    
    // Simple approach: just need match data to be ready
    const ready = match !== null;
    console.log('🔍 DATA READY CHECK:', {
      matchLoaded: match !== null,
      isReady: ready
    });
    
    return ready;
  }, [match, dataReadyTimeout]);

  // No state updates needed - using computed value directly for instant rendering

  // REMOVED: Manual polling trigger (timer hook now handles SSE-first approach)

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

  const loadFormationData = async (matchData: any) => {
    try {
      console.log('🧮 Loading formation data for match:', matchId);
      
      const [homeFormationResponse, awayFormationResponse] = await Promise.all([
        apiService.getFormationForMatch(matchId, matchData.homeTeam.id),
        apiService.getFormationForMatch(matchId, matchData.awayTeam.id)
      ]);

      setHomeFormation(homeFormationResponse?.formation || null);
      setAwayFormation(awayFormationResponse?.formation || null);
      setFormationsLoaded(true);
    } catch (error) {
      console.error('Error loading formation data:', error);
      setHomeFormation(null);
      setAwayFormation(null);
      setFormationsLoaded(true);
    }
  };

  const startMatch = async () => {
    try {
      console.log('🚀 Starting match:', matchId);
      console.log('🔍 Before start - Timer state:', timerState.status, 'Match state:', match?.status);
      
      // Set flag IMMEDIATELY to show live screen
      setMatchStartRequested(true);
      console.log('✅ Match start requested - showing live screen immediately');
      
      await soundService.initializeSounds();
      
      // Use SSE-based match start
      console.log('📡 Calling SSE start match API...');
      const startResponse = await apiService.startMatchWithSSE(matchId);
      console.log('✅ SSE start response:', startResponse);
      
      await soundService.playMatchStartWhistle();
      
      showCommentary("⚽ KICK-OFF! The referee blows the whistle and the match is underway!");
      
      // Reload match data immediately and trigger polling fallback if needed
      setTimeout(async () => {
        console.log('🔍 Reloading match data after start...');
        try {
          await loadMatchDetails();
          console.log('✅ Match data reloaded - should now show LIVE status');
          
          // If timer hook hasn't started polling yet, trigger it manually
          if (timerState.connectionStatus === 'connecting') {
            console.log('⚡ Triggering manual polling fallback after match start');
            timerState.startPolling?.();
          }
        } catch (error) {
          console.error('❌ Failed to reload match data:', error);
        }
      }, 1000); // Faster reload - 1 second instead of 2
      
      Vibration.vibrate(100);
    } catch (error) {
      console.error('❌ Failed to start match:', error);
      // Reset the flag if match start fails
      setMatchStartRequested(false);
      Alert.alert('Error', 'Failed to start match: ' + (error?.message || 'Unknown error'));
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
              console.log('🏁 Attempting to end match:', matchId);
              console.log('🔍 Current match status:', match?.status);
              console.log('🔍 Current timer status:', timerState.status);
              
              // Try SSE-based end first if match was started with SSE
              if (matchStartRequested || timerState.status === 'LIVE') {
                try {
                  console.log('📡 Using SSE end match endpoint...');
                  await apiService.endMatchSSE(matchId);
                  console.log('✅ SSE end match successful');
                } catch (sseError) {
                  console.warn('⚠️ SSE end failed, trying regular endpoint:', sseError);
                  await apiService.endMatch(matchId);
                  console.log('✅ Regular end match successful');
                }
              } else {
                // Use regular endpoint for non-SSE matches
                console.log('📊 Using regular end match endpoint...');
                await apiService.endMatch(matchId);
                console.log('✅ Regular end match successful');
              }
              
              await soundService.playFullTimeWhistle();
              showCommentary("📢 FULL-TIME! The referee blows the final whistle! The match has ended!");
              
              // Reset the start requested flag
              setMatchStartRequested(false);
              
              setTimeout(() => {
                navigation.replace('PlayerRating', { 
                  matchId,
                  homeTeamId: match?.homeTeam?.id,
                  homeTeamName: match?.homeTeam?.name,
                  awayTeamId: match?.awayTeam?.id,
                  awayTeamName: match?.awayTeam?.name
                });
              }, 1500);
            } catch (error) {
              console.error('❌ Failed to end match:', error);
              Alert.alert('Error', 'Failed to end match: ' + (error?.message || 'Unknown error'));
            }
          }
        }
      ]
    );
  };

  const showCommentary = (text: string) => {
    setLatestCommentary(text);
    
    const newCommentary = {
      id: Date.now().toString(),
      text,
      minute: timerState.currentMinute,
      timestamp: new Date()
    };
    setCommentaryHistory(prev => [newCommentary, ...prev]);
    
    // Toast notification animation
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
      setLatestCommentary('');
    });
  };

  // Manual control handlers using SSE endpoints
  const handleStartSecondHalf = async () => {
    try {
      console.log('⚽ Starting second half manually');
      setShowHalftimeModal(false);
      
      await apiService.startSecondHalfSSE(matchId);
      await soundService.playSecondHalfWhistle();
      showCommentary("⚽ SECOND HALF! The match resumes!");
      
      await loadMatchDetails();
    } catch (error) {
      console.error('❌ Failed to start second half:', error);
      Alert.alert('Error', 'Failed to start second half');
    }
  };

  const handleAddStoppageTime = async () => {
    try {
      await apiService.addStoppageTimeSSE(matchId, 1);
      const halfText = timerState.currentHalf === 1 ? 'first' : 'second';
      showCommentary(`⏱️ +1 minute of stoppage time added to the ${halfText} half.`);
      await loadMatchDetails();
    } catch (error) {
      Alert.alert('Error', 'Failed to add stoppage time');
    }
  };

  const handlePauseMatch = async () => {
    try {
      await apiService.pauseMatchSSE(matchId);
      showCommentary('⏸️ Match paused by referee');
      await loadMatchDetails();
    } catch (error) {
      Alert.alert('Error', 'Failed to pause match');
    }
  };

  const handleResumeMatch = async () => {
    try {
      await apiService.resumeMatchSSE(matchId);
      showCommentary('▶️ Match resumed by referee');
      await loadMatchDetails();
    } catch (error) {
      Alert.alert('Error', 'Failed to resume match');
    }
  };

  const handleAction = (team: 'home' | 'away', actionType: string) => {
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
        minute: timerState.currentMinute,
        description: `${modalActionType} by ${modalTeam.name}`,
      };

      await apiService.addMatchEvent(matchId, eventData);
      
      // Generate commentary
      const templates = COMMENTARY_TEMPLATES[modalActionType as keyof typeof COMMENTARY_TEMPLATES] || [];
      const template = templates[Math.floor(Math.random() * templates.length)];
      const commentary = template ? template.replace('{player}', player?.name || 'Unknown') : '';
      showCommentary(commentary);
      
      // Send notifications
      if (modalActionType === 'YELLOW_CARD' || modalActionType === 'RED_CARD') {
        notifyCard(player?.name || 'Unknown', modalTeam.name, 
          modalActionType === 'YELLOW_CARD' ? 'yellow' : 'red');
        Vibration.vibrate(100);
      } else if (modalActionType === 'SUBSTITUTION') {
        const team = modalTeam.id === match.homeTeam.id ? 'home' : 'away';
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
      
      const goalData = {
        playerId: goalScorerId,
        teamId: modalTeam.id,
        eventType: 'GOAL',
        minute: timerState.currentMinute,
        description: `GOAL by ${goalScorer?.name || 'Unknown'}${assistPlayer ? ` (Assist: ${assistPlayer.name})` : ''}`,
      };
      
      await apiService.addMatchEvent(matchId, goalData);
      
      if (assistPlayerId && assistPlayerId !== goalScorerId) {
        const assistData = {
          playerId: assistPlayerId,
          teamId: modalTeam.id,
          eventType: 'ASSIST',
          minute: timerState.currentMinute,
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
      const team = modalTeam.id === match.homeTeam.id ? 'home' : 'away';
      const newScore = team === 'home' 
        ? `${match.homeScore + 1}-${match.awayScore}`
        : `${match.homeScore}-${match.awayScore + 1}`;
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
            {shouldShowLiveView ? (
              <View style={styles.sectionContainer}>
                {/* Time Controls Bar */}
                <View style={styles.timeControlsBar}>
                  <LinearGradient
                    colors={[colors.accent.blue + '15', colors.accent.teal + '05']}
                    style={styles.timeControlsGradient}
                  >
                    <View style={styles.timeControlsContent}>
                      <View style={styles.timeInfo}>
                        {timerState.isHalftime || (match?.status === 'HALFTIME') ? (
                          <View style={styles.halftimeBreakInfo}>
                            <Text style={styles.halftimeBreakTitle}>⏰ Halftime Break</Text>
                            <Text style={styles.halftimeBreakCountdown}>
                              {breakTimeDisplay} remaining
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.timeInfoText}>
                            Half {timerState.currentHalf} | +{timerState.currentHalf === 1 ? timerState.addedTimeFirstHalf : timerState.addedTimeSecondHalf} min
                          </Text>
                        )}
                      </View>
                      
                      <View style={styles.timeControlButtons}>
                        {!timerState.isHalftime && (
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

                {/* Enhanced Connection Status Indicator */}
                <View style={styles.connectionStatusContainer}>
                  <LinearGradient
                    colors={
                      timerState.connectionStatus === 'connected' 
                        ? [colors.semantic.success + '20', colors.semantic.success + '10']
                        : timerState.connectionStatus === 'disconnected'
                        ? [colors.semantic.warning + '20', colors.semantic.warning + '10'] 
                        : timerState.connectionStatus === 'error'
                        ? [colors.semantic.error + '20', colors.semantic.error + '10']
                        : [colors.accent.blue + '20', colors.accent.blue + '10']
                    }
                    style={styles.connectionStatusGradient}
                  >
                    <View style={styles.connectionStatusContent}>
                      <View style={styles.connectionStatusInfo}>
                        <View style={[
                          styles.connectionStatusDot,
                          {
                            backgroundColor: 
                              timerState.connectionStatus === 'connected' ? colors.semantic.success :
                              timerState.connectionStatus === 'disconnected' ? colors.semantic.warning :
                              timerState.connectionStatus === 'error' ? colors.semantic.error :
                              colors.accent.blue
                          }
                        ]} />
                        <Text style={styles.connectionStatusText}>
                          {timerState.connectionStatus === 'connected' && '📡 Live SSE Timer'}
                          {timerState.connectionStatus === 'disconnected' && '⏱️ Fallback Timer'}
                          {timerState.connectionStatus === 'connecting' && '🔄 Connecting...'}
                          {timerState.connectionStatus === 'error' && '❌ Connection Error'}
                        </Text>
                      </View>
                      
                      {timerState.connectionStatus === 'disconnected' && (
                        <TouchableOpacity 
                          style={styles.reconnectButton}
                          onPress={() => timerState.reconnect?.()}
                        >
                          <Ionicons name="refresh" size={14} color={colors.semantic.warning} />
                          <Text style={styles.reconnectButtonText}>Retry</Text>
                        </TouchableOpacity>
                      )}
                      
                      {timerState.connectionStatus === 'error' && (
                        <TouchableOpacity 
                          style={styles.reconnectButton}
                          onPress={() => timerState.reconnect?.()}
                        >
                          <Ionicons name="refresh" size={14} color={colors.semantic.error} />
                          <Text style={styles.reconnectButtonText}>Retry</Text>
                        </TouchableOpacity>
                      )}
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
                          {!timerState.isHalftime && timerState.status === 'LIVE' && !timerState.isPaused && (
                            <TouchableOpacity style={styles.manualControlButton} onPress={handlePauseMatch}>
                              <Ionicons name="pause" size={20} color={colors.accent.orange} />
                              <Text style={styles.manualControlButtonText}>Pause</Text>
                            </TouchableOpacity>
                          )}
                          
                          {timerState.isPaused && !timerState.isHalftime && (
                            <TouchableOpacity style={styles.manualControlButton} onPress={handleResumeMatch}>
                              <Ionicons name="play" size={20} color={colors.accent.teal} />
                              <Text style={styles.manualControlButtonText}>Resume</Text>
                            </TouchableOpacity>
                          )}
                          
                          {timerState.isHalftime && (
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
                      isLive={timerState.status === 'LIVE' && !timerState.isPaused}
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
                    {timerState.status === 'LIVE' && (
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
                        {timerState.status === 'LIVE' ? 'Commentary will appear as events happen' : 'Start the match to see live commentary'}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              )}
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };

  if (isLoading || !isDataReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>
          {isLoading ? 'Loading match...' : 'Preparing live view...'}
        </Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Match not found</Text>
        <ProfessionalButton
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
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
        {/* Professional Header with SSE Timer */}
        <Animated.View style={{ transform: [{ scale: scoreAnimation }] }}>
          <ProfessionalMatchHeader
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            homeScore={match.homeScore}
            awayScore={match.awayScore}
            status={timerState.status}
            currentMinute={timerState.currentMinute}
            currentSecond={timerState.currentSecond}
            venue={match.venue}
            duration={match.duration}
            onBack={() => navigation.goBack()}
          />
        </Animated.View>
        
        {/* SSE Test Button for Debugging */}
        {__DEV__ && <SSETestButton />}
        
        {/* Enhanced Connection Status Indicator */}
        <View style={styles.discreteConnectionIndicator}>
          <View style={styles.discreteConnectionContent}>
            <View style={[
              styles.discreteConnectionDot,
              {
                backgroundColor: 
                  timerState.connectionStatus === 'connected' ? colors.semantic.success : 
                  timerState.connectionStatus === 'connecting' ? colors.semantic.warning :
                  timerState.connectionStatus === 'error' ? colors.semantic.error :
                  colors.semantic.warning
              }
            ]} />
            <Text style={styles.discreteConnectionText}>
              {timerState.connectionStatus === 'connected' ? 'Real-time connected' : 
               timerState.connectionStatus === 'connecting' ? 'Connecting to SSE...' :
               timerState.connectionStatus === 'error' ? 'Connection failed' :
               'Connection lost - using local timer'}
            </Text>
            {timerState.connectionStatus !== 'connected' && (
              <TouchableOpacity 
                onPress={() => {
                  console.log('🔄 Manual reconnect triggered');
                  timerState.reconnect();
                }}
                style={{ marginLeft: 10, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.primary.main, borderRadius: 4 }}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>Retry</Text>
              </TouchableOpacity>
            )}
            {__DEV__ && (
              <TouchableOpacity 
                onPress={() => {
                  console.log('🧪 SSE Test triggered');
                  timerState.testSSEEndpoint?.();
                }}
                style={{ marginLeft: 10, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.accent.purple, borderRadius: 4 }}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>Test</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
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
                First half has ended
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
                Break time remaining: {breakTimeDisplay}
                {isBreakEnding && '\n⚠️ Break ending soon!'}
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
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  
  // Commentary Banner
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
  commentaryText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
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
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Tab Content Container
  tabContentContainer: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  tabContent: {
    flex: 1,
  },
  
  // Section Containers
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
  
  // Loading & Error
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
  
  // Enhanced Connection Status
  connectionStatusContainer: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  connectionStatusGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  connectionStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectionStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  connectionStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  connectionStatusText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    flex: 1,
  },
  reconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xxs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  reconnectButtonText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Discrete Connection Indicator
  discreteConnectionIndicator: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.xs,
  },
  discreteConnectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary + '80',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badge,
    alignSelf: 'center',
  },
  discreteConnectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  discreteConnectionText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Time Controls
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
  
  // Manual Controls
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
  
  // Start Match Card
  startMatchCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.card,
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
  
  // End Match Button
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
  
  // Live Indicator
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
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  
  // Commentary
  commentaryScrollArea: {
    maxHeight: height * 0.5,
  },
  commentaryCardGradient: {
    borderRadius: borderRadius.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },
  commentaryItem: {
    flexDirection: 'row',
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
  commentaryContentText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.primary,
    lineHeight: 22,
  },
  
  // Halftime Break
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
  
  // Modals
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
    fontWeight: typography.fontWeight.semibold,
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
  
  // Halftime Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  halftimeModalContent: {
    width: '100%',
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
});