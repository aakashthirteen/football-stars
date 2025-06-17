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

const { width } = Dimensions.get('window');
const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface MatchScoringScreenProps {
  navigation: any;
  route: any;
}

const TABS = ['Actions', 'Timeline', 'Formation', 'Stats'];

const COMMENTARY_TEMPLATES = {
  GOAL: [
    "GOOOOOAL! 🔥 What a strike from {player}!",
    "⚽ {player} finds the back of the net! Incredible finish!",
    "SCORED! {player} makes no mistake from there!",
    "🎯 {player} with a clinical finish! The crowd goes wild!",
  ],
  YELLOW_CARD: [
    "🟨 {player} sees yellow for that challenge",
    "Referee shows {player} a yellow card",
    "⚠️ {player} needs to be careful now with that yellow",
  ],
  RED_CARD: [
    "🟥 {player} is sent off! Down to 10 men!",
    "RED CARD! {player} has to leave the field",
  ],
  SUBSTITUTION: [
    "CHANGE! 🔄 {player} comes off the field",
    "SUBSTITUTION! 👥 {player} makes way for a teammate",
  ],
};

export default function MatchScoringScreen({ navigation, route }: MatchScoringScreenProps) {
  const { matchId } = route?.params || {};
  const [match, setMatch] = useState<any>(null);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Actions');
  const [latestCommentary, setLatestCommentary] = useState<string>('');
  const [availableSubstitutions, setAvailableSubstitutions] = useState({
    home: 3,
    away: 3,
  });
  
  // Modals
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [modalTeam, setModalTeam] = useState<any>(null);
  const [modalActionType, setModalActionType] = useState<string>('');
  
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setCurrentMinute(prev => Math.min(prev + 1, 90));
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [isLive]);

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
      setIsLive(matchData.status === 'LIVE');
      
      if (matchData.status === 'LIVE') {
        // Calculate current minute based on match start time
        const matchStart = new Date(matchData.matchDate || matchData.match_date);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - matchStart.getTime()) / 60000);
        setCurrentMinute(Math.max(1, Math.min(elapsed, 90)));
      }
    } catch (error: any) {
      console.error('Error loading match:', error);
      Alert.alert('Error', 'Failed to load match details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const startMatch = async () => {
    try {
      await apiService.startMatch(matchId);
      await loadMatchDetails();
      showCommentary("⚽ KICK-OFF! The match is underway!");
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
              showCommentary("📢 FULL-TIME! The match has ended!");
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
      
      // Send notifications
      if (modalActionType === 'GOAL') {
        const team = modalTeam.id === match.homeTeam.id ? 'home' : 'away';
        const newScore = team === 'home' 
          ? `${match.homeScore + 1}-${match.awayScore}`
          : `${match.homeScore}-${match.awayScore + 1}`;
        notifyGoal(player?.name || 'Unknown', modalTeam.name, newScore);
        animateScore();
        Vibration.vibrate([0, 200, 100, 200]);
      } else if (modalActionType === 'YELLOW_CARD' || modalActionType === 'RED_CARD') {
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
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {isLive ? (
              <>
                <ProfessionalMatchAction
                  homeTeamName={match.homeTeam?.name || 'Home'}
                  awayTeamName={match.awayTeam?.name || 'Away'}
                  isLive={isLive}
                  availableSubstitutions={availableSubstitutions}
                  onAction={handleAction}
                  onQuickEvent={handleQuickEvent}
                />
                
                <View style={styles.endMatchContainer}>
                  <ProfessionalButton
                    title="End Match"
                    icon="stop"
                    variant="primary"
                    onPress={endMatch}
                    fullWidth
                  />
                </View>
              </>
            ) : (
              <View style={styles.startMatchContainer}>
                <LinearGradient
                  colors={[colors.primary.main, colors.primary.dark]}
                  style={styles.startMatchGradient}
                >
                  <Ionicons name="football" size={64} color="#FFFFFF" />
                  <Text style={styles.startMatchTitle}>Ready to Start?</Text>
                  <Text style={styles.startMatchSubtitle}>
                    Begin tracking this match
                  </Text>
                  <TouchableOpacity
                    style={styles.startMatchButton}
                    onPress={startMatch}
                  >
                    <Ionicons name="play" size={24} color={colors.primary.main} />
                    <Text style={styles.startMatchButtonText}>Start Match</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </ScrollView>
        );
        
      case 'Timeline':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.timelineHeader}>
              <Text style={styles.sectionTitle}>Match Events</Text>
              {isLive && (
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>
            
            {match?.events && match.events.length > 0 ? (
              <View style={styles.timeline}>
                {match.events
                  .sort((a: any, b: any) => b.minute - a.minute)
                  .map((event: any, index: number) => (
                    <ProfessionalMatchEvent
                      key={event.id}
                      event={{
                        ...event,
                        team: {
                          name: event.teamId === match.homeTeam.id 
                            ? match.homeTeam.name 
                            : match.awayTeam.name,
                          isHome: event.teamId === match.homeTeam.id,
                        },
                      }}
                      showConnector={index < match.events.length - 1}
                    />
                  ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>No events yet</Text>
                <Text style={styles.emptySubtext}>
                  {isLive ? 'Events will appear here' : 'Start the match to add events'}
                </Text>
              </View>
            )}
          </ScrollView>
        );
        
      case 'Formation':
        return (
          <View style={[styles.tabContent, styles.comingSoon]}>
            <Ionicons name="football-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.comingSoonText}>Formation View</Text>
            <Text style={styles.comingSoonSubtext}>Coming soon...</Text>
          </View>
        );
        
      case 'Stats':
        return (
          <View style={[styles.tabContent, styles.comingSoon]}>
            <Ionicons name="stats-chart" size={64} color={colors.text.tertiary} />
            <Text style={styles.comingSoonText}>Match Statistics</Text>
            <Text style={styles.comingSoonSubtext}>Coming soon...</Text>
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
      
      {/* Match Header */}
      <Animated.View style={{ transform: [{ scale: scoreAnimation }] }}>
        <ProfessionalMatchHeader
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          homeScore={match.homeScore}
          awayScore={match.awayScore}
          status={match.status}
          currentMinute={currentMinute}
          venue={match.venue}
          onBack={() => navigation.goBack()}
        />
      </Animated.View>
      
      {/* Live Commentary */}
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
          <LinearGradient
            colors={[colors.accent.orange, colors.accent.red]}
            style={styles.commentaryGradient}
          >
            <Text style={styles.commentaryText}>{latestCommentary}</Text>
          </LinearGradient>
        </Animated.View>
      )}
      
      {/* Tabs */}
      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Tab Content */}
      {renderTabContent()}
      
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
              Select Player - {modalActionType?.replace(/_/g, ' ')}
            </Text>
            <TouchableOpacity onPress={() => setShowPlayerModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={modalTeam?.players || []}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalPlayerItem}
                onPress={() => addEvent(item.id)}
              >
                <ProfessionalPlayerCard
                  player={item}
                  variant="compact"
                />
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
          />
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
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  tabs: {
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
});