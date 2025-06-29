import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';
import { ProfessionalTeamBadge } from './ProfessionalTeamBadge';
import { ProfessionalMiniEvent } from './ProfessionalMiniEvent';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

import { Match } from '../../types';

interface ProfessionalMatchHeaderProps {
  match: Match;
  timer: {
    currentMinute: number;
    currentSecond: number;
    displayTime: string;
    displayMinute: string;
    isHalftime: boolean;
    isLive: boolean;
    currentHalf: number;
    connectionStatus: string;
  };
  onBack?: () => void;
  onEndMatch?: () => void;
  competition?: string;
}


export const ProfessionalMatchHeader: React.FC<ProfessionalMatchHeaderProps> = ({ match, timer, onBack, onEndMatch, competition = 'Grassroots League' }) => {
  // Early return if no match data
  if (!match) {
    console.error('❌ ProfessionalMatchHeader: No match data provided');
    return null;
  }

  // Debug log to verify we're getting the full match object
  console.log('🔍 FULL MATCH OBJECT:', JSON.stringify(match, null, 2));
  
  // Extract data from match object
  const homeTeam = match.homeTeam || { 
    id: match.homeTeamId || match.home_team_id,
    name: `Team ${match.homeTeamId?.substring(0, 8) || 'Home'}`,
    logoUrl: undefined,
    badge: undefined
  };
  const awayTeam = match.awayTeam || { 
    id: match.awayTeamId || match.away_team_id,
    name: `Team ${match.awayTeamId?.substring(0, 8) || 'Away'}`,
    logoUrl: undefined,
    badge: undefined
  };
  const homeScore = match.homeScore || 0;
  const awayScore = match.awayScore || 0;
  const status = timer.isHalftime ? 'HALFTIME' : match.status;
  const venue = match.venue;
  const duration = match.duration || 90;
  const matchId = match.id;
  
  // Extract events and timer data using multiple field variations
  const events = match.events || match.eventsData || match.events_data || [];
  const addedTimeFirstHalf = match.addedTimeFirstHalf || match.addedTimeFirst || match.added_time_first_half || 0;
  const addedTimeSecondHalf = match.addedTimeSecondHalf || match.addedTimeSecond || match.added_time_second_half || 0;
  const currentHalf = match.currentHalf || match.current_half || timer.currentHalf || 1;
  const currentMinute = timer.currentMinute;
  const currentSecond = timer.currentSecond;
  const isLive = status === 'LIVE' || status === 'HALFTIME';
  const wavePositionAnim = useRef(new Animated.Value(-0.5)).current;

  // Helper function to get first name only
  const getFirstName = (fullName: string) => {
    if (!fullName || fullName === 'Unknown') return fullName;
    return fullName.split(' ')[0];
  };

  // Debug logging for data flow
  useEffect(() => {
    console.log('🎯 ProfessionalMatchHeader Debug - MATCH OBJECT RECEIVED:', {
      hasMatch: !!match,
      events_received: events?.length || 0,
      events_data: events,
      added_time_first: addedTimeFirstHalf,
      added_time_second: addedTimeSecondHalf,
      current_half: currentHalf,
      current_minute: currentMinute,
      home_team_id: homeTeam?.id,
      away_team_id: awayTeam?.id,
      match_events: match?.events?.length || 0,
      match_added_time: match?.added_time_first_half,
    });
    
    console.log('🔍 EVENTS ARRAY CONTENT:', events?.map(e => ({
      id: e.id,
      eventType: e.eventType,
      event_type: e.event_type,
      teamId: e.teamId,
      team_id: e.team_id,
      playerName: e.player?.name || e.playerName || e.player_name
    })));
  }, [match, events, addedTimeFirstHalf, addedTimeSecondHalf]);

  useEffect(() => {
    if (status === 'LIVE') {
      // Wave animation that alternates directions
      Animated.loop(
        Animated.sequence([
          // Start from left, move to right and disappear
          Animated.timing(wavePositionAnim, {
            toValue: 1.5, // Go beyond the right container edge
            duration: 1500,
            useNativeDriver: true,
          }),
          // Reset to right side (off screen)
          Animated.timing(wavePositionAnim, {
            toValue: 1.5,
            duration: 0,
            useNativeDriver: true,
          }),
          // Move from right to left and disappear
          Animated.timing(wavePositionAnim, {
            toValue: -0.5, // Go beyond the left container edge
            duration: 1500,
            useNativeDriver: true,
          }),
          // Reset to left side (off screen) for next cycle
          Animated.timing(wavePositionAnim, {
            toValue: -0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      wavePositionAnim.setValue(-0.5);
    }
  }, [status]);
  
  const getTeamEvents = (teamId: string | undefined, eventTypes: string[]) => {
    if (!events || !teamId) {
      console.log('🚫 getTeamEvents early return:', { hasEvents: !!events, teamId });
      return [];
    }
    
    const filteredEvents = events.filter(event => {
      // Handle multiple possible field names for team ID
      const eventTeamId = event.teamId || event.team_id;
      // Handle multiple possible field names for event type
      const eventType = event.eventType || event.event_type;
      const matches = eventTeamId === teamId && eventTypes.includes(eventType);
      
      console.log('🔍 Event filter:', {
        eventId: event.id,
        eventTeamId,
        targetTeamId: teamId,
        eventType,
        eventType_snake: event.event_type,
        eventType_camel: event.eventType,
        matches
      });
      
      return matches;
    });
    
    const sortedEvents = filteredEvents
      .sort((a, b) => a.minute - b.minute);
      // Removed limit - now show all events with scrolling
    
    console.log('📋 Final team events:', { teamId, count: sortedEvents.length, events: sortedEvents });
    
    return sortedEvents;
  };
  
  const getStatusDisplay = () => {
    switch (status) {
      case 'LIVE':
        // Just use the timer's display format directly - don't mess with it
        return timer?.displayTime || timer?.displayText || `${currentMinute}:${String(currentSecond).padStart(2, '0')}`;
      case 'HALFTIME':
        return 'HT';
      case 'COMPLETED':
        return 'FT';
      default:
        return 'Scheduled';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isLive 
          ? [colors.background.secondary, colors.background.tertiary]
          : [colors.background.secondary, colors.background.tertiary]
        }
        style={styles.gradient}
      >
        
        {/* Top Bar */}
        <View style={styles.topBar}>
          {onBack && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onBack}
            >
              <View style={styles.backButtonBackground}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}
          
          <View style={styles.competitionBadge}>
            <Ionicons name="trophy" size={16} color={colors.text.secondary} />
            <Text style={styles.competitionText}>{competition}</Text>
          </View>
          
          <View style={styles.rightSection}>
            {isLive && (
              <View style={styles.liveSection}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>{status === 'HALFTIME' ? 'HT' : 'LIVE'}</Text>
                </View>
                
                {/* Live Progress Bar */}
                {status === 'LIVE' && (
                  <View style={styles.liveProgressContainer}>
                    <Animated.View 
                      style={[
                        styles.liveProgressBar,
                        {
                          transform: [
                            {
                              translateX: wavePositionAnim.interpolate({
                                inputRange: [-0.5, 1.5],
                                outputRange: [-30, 50],
                              }),
                            },
                          ],
                        }
                      ]} 
                    />
                  </View>
                )}
              </View>
            )}
            
            {(status === 'LIVE' || status === 'HALFTIME') && onEndMatch && (
              <TouchableOpacity 
                style={styles.endMatchButton}
                onPress={onEndMatch}
              >
                <Ionicons name="stop-circle" size={18} color="#FFFFFF" />
                <Text style={styles.endMatchText}>END</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        
        {/* Score Section */}
        <View style={styles.scoreSection}>
          {/* Home Team */}
          <View style={styles.teamSection}>
            <View style={styles.teamBadgeContainer}>
              <ProfessionalTeamBadge
                teamName={homeTeam?.name || 'Home Team'}
                badgeUrl={homeTeam?.logoUrl || homeTeam?.logo_url || homeTeam?.badge}
                size="large"
                variant="minimal"
              />
            </View>
            <Text style={styles.teamName} numberOfLines={1}>{homeTeam?.name || 'Home Team'}</Text>
            <Text style={[
              styles.score,
              status === 'COMPLETED' && homeScore > awayScore && styles.winnerScore
            ]}>
              {homeScore}
            </Text>
            {/* Home Team Events */}
            <View style={styles.teamEventsContainer}>
              <ScrollView 
                style={styles.teamEventsScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {getTeamEvents(homeTeam?.id, ['GOAL', 'YELLOW_CARD', 'RED_CARD']).map((event) => (
                  <ProfessionalMiniEvent
                    key={event.id}
                    eventType={(event.eventType || event.event_type) as 'GOAL' | 'YELLOW_CARD' | 'RED_CARD'}
                    playerName={getFirstName(event.player?.name || event.playerName || event.player_name || 'Unknown')}
                    minute={event.minute}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
          
          {/* Center Status */}
          <View style={styles.centerSection}>
            <View style={styles.statusContainer}>
              <Text style={styles.statusText} numberOfLines={1}>{getStatusDisplay()}</Text>
              {/* Extra Time Badges */}
              {status === 'LIVE' && (
                <>
                  {(() => {
                    const halfDuration = duration / 2;
                    
                    // Show badge when there's added time for the current half
                    const shouldShowBadge = 
                      (currentHalf === 1 && addedTimeFirstHalf > 0) ||
                      (currentHalf === 2 && addedTimeSecondHalf > 0);
                    
                    const badgeTime = currentHalf === 1 ? addedTimeFirstHalf : addedTimeSecondHalf;
                    
                    console.log('⏰ Extra Time Badge Logic:', {
                      currentHalf,
                      currentMinute,
                      duration,
                      halfDuration,
                      addedTimeFirstHalf,
                      addedTimeSecondHalf,
                      shouldShowBadge,
                      badgeTime,
                      timerDisplay: timer.displayMinute
                    });
                    
                    return (
                      <>
                        {shouldShowBadge && (
                          <View style={styles.extraTimeBadge}>
                            <Text style={styles.extraTimeText}>+{badgeTime}</Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </View>
            <Text style={styles.vsText}>VS</Text>
            {venue && (
              <View style={styles.venueContainer}>
                <Ionicons name="location-outline" size={14} color={colors.text.tertiary} />
                <Text style={styles.venueText} numberOfLines={1}>{venue}</Text>
              </View>
            )}
          </View>
          
          {/* Away Team */}
          <View style={styles.teamSection}>
            <View style={styles.teamBadgeContainer}>
              <ProfessionalTeamBadge
                teamName={awayTeam?.name || 'Away Team'}
                badgeUrl={awayTeam?.logoUrl || awayTeam?.logo_url || awayTeam?.badge}
                size="large"
                variant="minimal"
              />
            </View>
            <Text style={styles.teamName} numberOfLines={1}>{awayTeam?.name || 'Away Team'}</Text>
            <Text style={[
              styles.score,
              status === 'COMPLETED' && awayScore > homeScore && styles.winnerScore
            ]}>
              {awayScore}
            </Text>
            {/* Away Team Events */}
            <View style={styles.teamEventsContainer}>
              <ScrollView 
                style={styles.teamEventsScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {getTeamEvents(awayTeam?.id, ['GOAL', 'YELLOW_CARD', 'RED_CARD']).map((event) => (
                  <ProfessionalMiniEvent
                    key={event.id}
                    eventType={(event.eventType || event.event_type) as 'GOAL' | 'YELLOW_CARD' | 'RED_CARD'}
                    playerName={getFirstName(event.player?.name || event.playerName || event.player_name || 'Unknown')}
                    minute={event.minute}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
        
        {/* Match Info Section */}
        <View style={styles.matchInfoSection}>
          {venue && (
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={12} color={colors.text.tertiary} />
              <Text style={styles.infoText}>{venue}</Text>
            </View>
          )}
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={12} color={colors.text.tertiary} />
            <Text style={styles.infoText}>{duration} min match</Text>
          </View>
          {status === 'HALFTIME' && (
            <View style={styles.infoItem}>
              <Ionicons name="pause-circle-outline" size={12} color={colors.accent.orange} />
              <Text style={[styles.infoText, { color: colors.accent.orange }]}>Halftime Break</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    ...shadows.lg,
  },
  gradient: {
    paddingTop: 50,
    paddingBottom: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  competitionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badge,
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  competitionText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badge,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.main,
    marginRight: spacing.xs,
  },
  liveText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    letterSpacing: 0.5,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    minHeight: 120,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
    maxWidth: '35%', // Increased from 30% to 35% for more space
    minWidth: 120, // Minimum width to ensure content fits
  },
  teamBadgeContainer: {
    marginBottom: spacing.sm,
  },
  teamName: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
  },
  score: {
    fontSize: 48,
    fontWeight: typography.fontWeight.black,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  winnerScore: {
    color: colors.accent.gold,
  },
  centerSection: {
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    flex: 1,
    maxWidth: '35%', // Increased back to 35% to fit timer properly
    position: 'relative',
  },
  liveProgressContainer: {
    width: 40,
    height: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
    borderRadius: 1,
  },
  liveProgressBar: {
    height: '100%',
    width: 20,
    backgroundColor: colors.primary.main,
    borderRadius: 1,
  },
  statusContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.badge,
    marginBottom: spacing.xs,
    position: 'relative',
    minWidth: 100, // Increased width for full timer display
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  minuteIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  minuteDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.main,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  vsText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: spacing.xs,
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    marginLeft: spacing.xxs,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveSection: {
    alignItems: 'center',
  },
  endMatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.coral,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.badge,
    marginLeft: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  endMatchText: {
    fontSize: typography.fontSize.small,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    marginLeft: spacing.xxs,
  },
  matchInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  infoText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.medium,
  },
  extraTimeBadge: {
    position: 'absolute',
    top: -8,
    right: -24,
    backgroundColor: colors.accent.orange,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  extraTimeText: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  teamEventsContainer: {
    marginTop: spacing.xs,
    width: '100%',
    height: 100, // Increased height to show more events
    // Removed maxWidth constraint for better name visibility
  },
  teamEventsScroll: {
    flex: 1,
  },
});