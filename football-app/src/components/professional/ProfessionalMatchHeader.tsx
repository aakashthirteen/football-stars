import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ProfessionalMatchHeaderProps {
  homeTeam: {
    name: string;
    badge?: string;
  };
  awayTeam: {
    name: string;
    badge?: string;
  };
  homeScore: number;
  awayScore: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  currentMinute?: number;
  venue?: string;
  competition?: string;
  onBack?: () => void;
}

export const ProfessionalMatchHeader: React.FC<ProfessionalMatchHeaderProps> = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  currentMinute = 0,
  venue,
  competition = 'Grassroots League',
  onBack,
}) => {
  const isLive = status === 'LIVE';
  
  const getStatusDisplay = () => {
    switch (status) {
      case 'LIVE':
        return `${currentMinute}'`;
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
          ? [colors.status.live, '#B91C1C', colors.background.secondary]
          : [colors.background.secondary, colors.background.tertiary]
        }
        style={styles.gradient}
        locations={isLive ? [0, 0.3, 1] : [0, 1]}
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
          
          {isLive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
        
        {/* Score Section */}
        <View style={styles.scoreSection}>
          {/* Home Team */}
          <View style={styles.teamSection}>
            <View style={styles.teamBadge}>
              <Text style={styles.teamBadgeText}>
                {homeTeam.name.substring(0, 3).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.teamName} numberOfLines={1}>{homeTeam.name}</Text>
            <Text style={[
              styles.score,
              status === 'COMPLETED' && homeScore > awayScore && styles.winnerScore
            ]}>
              {homeScore}
            </Text>
          </View>
          
          {/* Center Status */}
          <View style={styles.centerSection}>
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
            <View style={styles.teamBadge}>
              <Text style={styles.teamBadgeText}>
                {awayTeam.name.substring(0, 3).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.teamName} numberOfLines={1}>{awayTeam.name}</Text>
            <Text style={[
              styles.score,
              status === 'COMPLETED' && awayScore > homeScore && styles.winnerScore
            ]}>
              {awayScore}
            </Text>
          </View>
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
    paddingBottom: spacing.xl,
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
  },
  competitionText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
    letterSpacing: 0.5,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  teamBadgeText: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
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
});