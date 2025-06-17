import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ProfessionalMatchCardProps {
  match: {
    id: string;
    status: 'LIVE' | 'SCHEDULED' | 'COMPLETED';
    homeTeam: {
      id: string;
      name: string;
      shortName?: string;
      badge?: string;
    };
    awayTeam: {
      id: string;
      name: string;
      shortName?: string;
      badge?: string;
    };
    homeScore: number;
    awayScore: number;
    matchDate: string;
    competition?: string;
    minute?: number;
  };
  onPress: () => void;
  style?: any;
}

export const ProfessionalMatchCard: React.FC<ProfessionalMatchCardProps> = ({ match, onPress, style }) => {
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (isLive) {
      // Breathing animation for live matches
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
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
    }
  }, [isLive]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusColor = () => {
    switch (match.status) {
      case 'LIVE':
        return colors.status.live;
      case 'COMPLETED':
        return colors.status.completed;
      default:
        return colors.status.scheduled;
    }
  };
  
  const getStatusText = () => {
    switch (match.status) {
      case 'LIVE':
        return match.minute ? `${match.minute}'` : 'LIVE';
      case 'COMPLETED':
        return 'FT';
      default:
        return formatDate(match.matchDate);
    }
  };

  const getCardStyle = () => {
    switch (match.status) {
      case 'LIVE':
        return {
          borderLeftWidth: 3,
          borderLeftColor: colors.status.live,
        };
      case 'COMPLETED':
        return {
          borderLeftWidth: 3,
          borderLeftColor: colors.status.completed,
        };
      default:
        return {
          borderLeftWidth: 3,
          borderLeftColor: colors.status.scheduled,
        };
    }
  };

  return (
    <Animated.View
      style={[
        { transform: isLive ? [{ scale: pulseAnim }] : [] },
        style,
      ]}
    >
      <TouchableOpacity 
        style={[styles.container, getCardStyle()]} 
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Competition Header */}
        {match.competition && (
          <View style={styles.competitionHeader}>
            <View style={styles.competitionInfo}>
              <View style={styles.competitionBadge}>
                <Ionicons name="trophy" size={12} color={colors.text.secondary} />
              </View>
              <Text style={styles.competitionText}>{match.competition}</Text>
            </View>
            {isLive && (
              <View style={styles.liveIndicator}>
                <Animated.View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Match Content */}
        <View style={styles.matchContent}>
          {/* Home Team */}
          <View style={styles.teamSection}>
            <View style={styles.teamInfo}>
              <View style={styles.teamBadge}>
                {match.homeTeam.badge ? (
                  <Image source={{ uri: match.homeTeam.badge }} style={styles.badgeImage} />
                ) : (
                  <Text style={styles.badgePlaceholder}>
                    {match.homeTeam.shortName?.substring(0, 3) || match.homeTeam.name.substring(0, 3)}
                  </Text>
                )}
              </View>
              <View style={styles.teamNameContainer}>
                <Text style={styles.teamName} numberOfLines={1}>
                  {match.homeTeam.name}
                </Text>
                {isCompleted && match.homeScore > match.awayScore && (
                  <View style={styles.winnerIndicator}>
                    <Ionicons name="trophy" size={12} color={colors.accent.gold} />
                  </View>
                )}
              </View>
            </View>
            {(isLive || isCompleted) && (
              <Text style={[
                styles.score,
                isCompleted && match.homeScore > match.awayScore && styles.winnerScore
              ]}>
                {match.homeScore}
              </Text>
            )}
          </View>
          
          {/* Status/Time */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
            {match.status === 'SCHEDULED' && (
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
              </View>
            )}
          </View>
          
          {/* Away Team */}
          <View style={styles.teamSection}>
            <View style={styles.teamInfo}>
              <View style={styles.teamBadge}>
                {match.awayTeam.badge ? (
                  <Image source={{ uri: match.awayTeam.badge }} style={styles.badgeImage} />
                ) : (
                  <Text style={styles.badgePlaceholder}>
                    {match.awayTeam.shortName?.substring(0, 3) || match.awayTeam.name.substring(0, 3)}
                  </Text>
                )}
              </View>
              <View style={styles.teamNameContainer}>
                <Text style={styles.teamName} numberOfLines={1}>
                  {match.awayTeam.name}
                </Text>
                {isCompleted && match.awayScore > match.homeScore && (
                  <View style={styles.winnerIndicator}>
                    <Ionicons name="trophy" size={12} color={colors.accent.gold} />
                  </View>
                )}
              </View>
            </View>
            {(isLive || isCompleted) && (
              <Text style={[
                styles.score,
                isCompleted && match.awayScore > match.homeScore && styles.winnerScore
              ]}>
                {match.awayScore}
              </Text>
            )}
          </View>
        </View>
        
        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="stats-chart" size={14} color={colors.text.secondary} />
            <Text style={styles.actionText}>Stats</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.actionText}>Timeline</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="people-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.actionText}>Lineups</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  competitionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  competitionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  competitionBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  competitionText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: spacing.xxs,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  matchContent: {
    padding: spacing.lg,
  },
  teamSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  badgePlaceholder: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  teamNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamName: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  winnerIndicator: {
    marginLeft: spacing.xs,
  },
  score: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    minWidth: 30,
    textAlign: 'right',
  },
  winnerScore: {
    color: colors.accent.gold,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badge,
  },
  statusText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  vsContainer: {
    marginTop: spacing.xs,
  },
  vsText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    paddingVertical: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxs,
  },
  actionDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xxs,
    fontWeight: typography.fontWeight.medium,
  },
});