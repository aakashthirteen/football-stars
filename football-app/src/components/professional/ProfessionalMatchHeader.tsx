import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';
import { ProfessionalTeamBadge } from './ProfessionalTeamBadge';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ProfessionalMatchHeaderProps {
  homeTeam: {
    id?: string;
    name: string;
    badge?: string;
    logoUrl?: string;
    logo_url?: string;
  };
  awayTeam: {
    id?: string;
    name: string;
    badge?: string;
    logoUrl?: string;
    logo_url?: string;
  };
  homeScore: number;
  awayScore: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'HALFTIME';
  currentMinute?: number;
  currentSecond?: number;
  venue?: string;
  duration?: number;
  competition?: string;
  onBack?: () => void;
  onEndMatch?: () => void;
  addedTime?: number;
  events?: Array<{
    id: string;
    minute: number;
    type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
    playerName: string;
    teamId: string;
  }>;
  matchId?: string;
}

export const ProfessionalMatchHeader: React.FC<ProfessionalMatchHeaderProps> = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  currentMinute = 0,
  currentSecond = 0,
  venue,
  duration = 90,
  competition = 'Grassroots League',
  onBack,
  onEndMatch,
  addedTime = 0,
  events = [],
  matchId,
}) => {
  const displayAddedTime = addedTime;
  const displayEvents = events;
  const isLive = status === 'LIVE' || status === 'HALFTIME';
  const wavePositionAnim = useRef(new Animated.Value(-0.5)).current;

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
  
  const getStatusDisplay = () => {
    switch (status) {
      case 'LIVE':
        // Professional MM:SS format like ESPN/BBC Sport
        const displaySeconds = currentSecond ? String(currentSecond).padStart(2, '0') : '00';
        return `${currentMinute}:${displaySeconds}`;
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
            <View style={styles.eventsContainer}>
              {displayEvents
                .filter(event => event.teamId === 'home')
                .slice(0, 3)
                .map(event => (
                  <View key={event.id} style={styles.eventItem}>
                    <Text style={styles.eventMinute}>{event.minute}'</Text>
                    {event.type === 'GOAL' && <Text style={styles.eventIcon}>⚽</Text>}
                    {event.type === 'YELLOW_CARD' && <Text style={styles.eventIcon}>🟨</Text>}
                    {event.type === 'RED_CARD' && <Text style={styles.eventIcon}>🟥</Text>}
                    <Text style={styles.eventPlayer} numberOfLines={1}>{event.playerName}</Text>
                  </View>
                ))}
            </View>
          </View>
          
          {/* Center Status */}
          <View style={styles.centerSection}>
            {/* Added Time Display */}
            {displayAddedTime > 0 && status === 'LIVE' && (
              <View style={styles.addedTimeContainer}>
                <Text style={styles.addedTimeText}>+{displayAddedTime}</Text>
              </View>
            )}
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>{getStatusDisplay()}</Text>
              {isLive && (
                <View style={styles.minuteIndicator}>
                  <View style={styles.minuteDot} />
                </View>
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
            <View style={styles.eventsContainer}>
              {displayEvents
                .filter(event => event.teamId === 'away')
                .slice(0, 3)
                .map(event => (
                  <View key={event.id} style={styles.eventItem}>
                    <Text style={styles.eventMinute}>{event.minute}'</Text>
                    {event.type === 'GOAL' && <Text style={styles.eventIcon}>⚽</Text>}
                    {event.type === 'YELLOW_CARD' && <Text style={styles.eventIcon}>🟨</Text>}
                    {event.type === 'RED_CARD' && <Text style={styles.eventIcon}>🟥</Text>}
                    <Text style={styles.eventPlayer} numberOfLines={1}>{event.playerName}</Text>
                  </View>
                ))}
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
    maxWidth: '30%',
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
    maxWidth: '40%',
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
  addedTimeContainer: {
    position: 'absolute',
    top: -25,
    backgroundColor: colors.accent.orange,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.badge,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addedTimeText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  eventsContainer: {
    marginTop: spacing.xs,
    width: '100%',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  eventMinute: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.medium,
    marginRight: spacing.xxs,
    minWidth: 20,
  },
  eventIcon: {
    fontSize: 12,
    marginRight: spacing.xxs,
  },
  eventPlayer: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
});