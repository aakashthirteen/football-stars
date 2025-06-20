import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MatchesStackParamList } from '../../navigation/MatchesStack';
import { 
  ProfessionalHeader, 
  ProfessionalMatchHeader,
  ProfessionalButton,
  DesignSystem 
} from '../../components/professional';
import { apiService } from '../../services/api';
import { Match } from '../../types';

const { width } = Dimensions.get('window');
const { colors, gradients, spacing, typography, borderRadius, shadows } = DesignSystem;

type ScheduledMatchScreenRouteProp = RouteProp<MatchesStackParamList, 'ScheduledMatch'>;
type ScheduledMatchScreenNavigationProp = StackNavigationProp<MatchesStackParamList>;

export default function ScheduledMatchScreen() {
  const navigation = useNavigation<ScheduledMatchScreenNavigationProp>();
  const route = useRoute<ScheduledMatchScreenRouteProp>();
  const { matchId } = route.params;


  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingMatch, setIsStartingMatch] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadMatchData();
  }, [matchId]);

  useEffect(() => {
    if (!isLoading && match) {
      animateEntrance();
    }
  }, [isLoading, match]);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulse animation for kick off button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadMatchData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMatchById(matchId);
      
      // Handle different response formats
      const matchData = response.match || response;
      setMatch(matchData);
      
      // If match is actually live, this should never happen with proper navigation
      if (matchData.status === 'LIVE' || matchData.status === 'HALFTIME') {
        console.error('🚨 CRITICAL ERROR: ScheduledMatchScreen loaded for LIVE match! This indicates navigation bug.', { matchId, status: matchData.status });
        Alert.alert(
          'Navigation Error', 
          'This match is live. Redirecting to live screen.',
          [{ text: 'OK', onPress: () => navigation.replace('LiveMatch', { matchId }) }]
        );
        return;
      }
    } catch (error) {
      console.error('Failed to load match:', error);
      Alert.alert('Error', 'Failed to load match data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startMatch = async () => {
    if (!match) return;
    
    try {
      setIsStartingMatch(true);
      
      // Start the match via API
      await apiService.startMatch(matchId);

      // Navigate to LiveMatchScreen
      navigation.replace('LiveMatch', { matchId });
      
    } catch (error) {
      console.error('❌ Failed to start match:', error);
      Alert.alert('Error', 'Failed to start match. Please check your connection and try again.');
      setIsStartingMatch(false);
    }
  };

  const navigateToPreMatchPlanning = () => {
    if (!match) return;
    
    // Ensure team objects exist before navigation
    if (!match.homeTeam || !match.awayTeam) {
      Alert.alert('Error', 'Team information is missing. Please try refreshing the match data.');
      return;
    }
    
    navigation.navigate('PreMatchPlanning', {
      matchId: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      isNewMatch: false,
    });
  };

  const renderQuickActionCard = (
    title: string,
    subtitle: string,
    icon: string,
    gradient: string[],
    onPress: () => void,
    disabled?: boolean
  ) => (
    <TouchableOpacity
      style={[styles.actionCard, disabled && styles.disabledCard]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradient}
        style={styles.actionCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.actionCardContent}>
          <View style={styles.actionIcon}>
            <Ionicons name={icon as any} size={24} color="#FFFFFF" />
          </View>
          <View style={styles.actionTextContent}>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionSubtitle}>{subtitle}</Text>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderMatchInfo = () => {
    if (!match) return null;

    const matchDate = new Date(match.matchDate);
    const isToday = matchDate.toDateString() === new Date().toDateString();
    const timeString = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = isToday ? 'Today' : matchDate.toLocaleDateString();

    return (
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Match Details</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary.main} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>{dateString} at {timeString}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="location-outline" size={20} color={colors.primary.main} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Venue</Text>
              <Text style={styles.infoValue}>{match.venue || 'Venue TBD'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="time-outline" size={20} color={colors.primary.main} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{match.duration || 90} minutes</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="trophy-outline" size={20} color={colors.primary.main} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Competition</Text>
              <Text style={styles.infoValue}>Grassroots League</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading match details...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorCard}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.semantic.error} />
          </View>
          <Text style={styles.errorTitle}>Match Not Found</Text>
          <Text style={styles.errorMessage}>
            We couldn't find this match. It may have been cancelled or deleted.
          </Text>
          <ProfessionalButton
            title="Go Back"
            icon="arrow-back"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ProfessionalHeader 
        title="Match Details"
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      
      <ProfessionalMatchHeader 
        homeTeam={{
          name: match.homeTeam?.name || 'Home Team',
          logoUrl: match.homeTeam?.logoUrl || match.homeTeam?.logo_url,
        }}
        awayTeam={{
          name: match.awayTeam?.name || 'Away Team',
          logoUrl: match.awayTeam?.logoUrl || match.awayTeam?.logo_url,
        }}
        homeScore={match.homeScore || 0}
        awayScore={match.awayScore || 0}
        status={match.status || 'SCHEDULED'}
        venue={match.venue}
        duration={match.duration || 90}
        competition="Grassroots League"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Kick Off Section */}
          <View style={styles.kickOffSection}>
            <Text style={styles.sectionTitle}>Ready to Play?</Text>
            
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.kickOffCard}
                onPress={startMatch}
                disabled={isStartingMatch}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[colors.primary.main, colors.primary.dark]}
                  style={styles.kickOffGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.kickOffContent}>
                    <View style={styles.kickOffIcon}>
                      <Ionicons name="football" size={48} color="#FFFFFF" />
                    </View>
                    <Text style={styles.kickOffTitle}>Start Match</Text>
                    <Text style={styles.kickOffSubtitle}>
                      Begin the match when both teams are ready
                    </Text>
                    
                    {isStartingMatch ? (
                      <View style={styles.startingIndicator}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.startingText}>Starting...</Text>
                      </View>
                    ) : (
                      <View style={styles.kickOffButton}>
                        <Text style={styles.kickOffButtonText}>Kick Off!</Text>
                        <Ionicons name="play" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  
                  {/* Animated background pattern */}
                  <View style={styles.kickOffPattern} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Pre-Match Setup</Text>
            
            {renderQuickActionCard(
              'Team Formations',
              'Set lineups and tactics',
              'people-outline',
              [colors.accent.blue, colors.accent.purple],
              navigateToPreMatchPlanning
            )}

            {renderQuickActionCard(
              'Match Settings',
              'Configure game rules',
              'settings-outline',
              [colors.accent.orange, colors.accent.coral],
              () => Alert.alert('Coming Soon', 'Match settings will be available soon!'),
              true
            )}

            {renderQuickActionCard(
              'Team Chat',
              'Coordinate with players',
              'chatbubbles-outline',
              [colors.primary.main, colors.primary.dark],
              () => Alert.alert('Coming Soon', 'Team chat will be available soon!'),
              true
            )}
          </View>

          {/* Match Information */}
          {renderMatchInfo()}

          <View style={styles.bottomSpacing} />
        </Animated.View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  errorCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 320,
    ...shadows.lg,
  },
  errorIcon: {
    marginBottom: spacing.lg,
  },
  errorTitle: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  errorButton: {
    minWidth: 140,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.screenPadding,
  },
  
  // Kick Off Section
  kickOffSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  kickOffCard: {
    marginHorizontal: spacing.screenPadding,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  kickOffGradient: {
    padding: spacing.xl,
    position: 'relative',
    minHeight: 180,
  },
  kickOffContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  kickOffIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  kickOffTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  kickOffSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  kickOffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  kickOffButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    marginRight: spacing.xs,
  },
  startingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startingText: {
    ...typography.button,
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  kickOffPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.3,
  },

  // Actions Section
  actionsSection: {
    marginBottom: spacing.xl,
  },
  actionCard: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  disabledCard: {
    opacity: 0.6,
  },
  actionCardGradient: {
    padding: spacing.lg,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionTextContent: {
    flex: 1,
  },
  actionTitle: {
    ...typography.subtitle,
    color: '#FFFFFF',
    marginBottom: spacing.xxs,
  },
  actionSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionArrow: {
    marginLeft: spacing.sm,
  },

  // Info Section
  infoSection: {
    marginBottom: spacing.xl,
  },
  infoCard: {
    backgroundColor: colors.surface.primary,
    marginHorizontal: spacing.screenPadding,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 80,
  },
});