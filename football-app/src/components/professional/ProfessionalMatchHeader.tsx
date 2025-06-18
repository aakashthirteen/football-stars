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
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'HALFTIME';
  currentMinute?: number;
  venue?: string;
  competition?: string;
  onBack?: () => void;
  onEndMatch?: () => void;
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
  onEndMatch,
}) => {
  const isLive = status === 'LIVE' || status === 'HALFTIME';
  const liveProgressAnim = useRef(new Animated.Value(0)).current;
  const wavePositionAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'LIVE') {
      // Continuous wave animation that creates a flowing effect
      Animated.loop(
        Animated.sequence([
          // Wave starts from left, builds up intensity
          Animated.parallel([
            Animated.timing(wavePositionAnim, {
              toValue: 150,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.sequence([
              // Fade in quickly
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
              }),
              // Stay visible in middle
              Animated.delay(800),
              // Fade out gradually
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 900,
                useNativeDriver: false,
              }),
            ]),
          ]),
          // Small pause before next wave
          Animated.delay(400),
          // Reset for next wave
          Animated.timing(wavePositionAnim, {
            toValue: -150,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      wavePositionAnim.setValue(-150);
      fadeAnim.setValue(0);
    }
  }, [status]);
  
  const getStatusDisplay = () => {
    switch (status) {
      case 'LIVE':
        return `${currentMinute}'`;
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
                
                {/* Live Progress Bar Wave */}
                {status === 'LIVE' && (
                  <View style={styles.liveProgressContainer}>
                    {/* Multiple wave segments for the effect */}
                    {[0, 1, 2].map((index) => (
                      <Animated.View 
                        key={index}
                        style={[
                          styles.liveProgressBar,
                          {
                            transform: [
                              {
                                translateX: wavePositionAnim.interpolate({
                                  inputRange: [-150, 0, 150],
                                  outputRange: [-30 - (index * 8), 0 + (index * 3), 50 + (index * 8)],
                                }),
                              },
                              {
                                scaleX: fadeAnim.interpolate({
                                  inputRange: [0, 0.5, 1],
                                  outputRange: [0.2, 1.2, 0.2],
                                }),
                              },
                            ],
                            opacity: fadeAnim.interpolate({
                              inputRange: [0, 0.3, 0.7, 1],
                              outputRange: [0, 1, 1, 0],
                            }),
                            width: fadeAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [5, 15, 5],
                            }),
                          }
                        ]} 
                      />
                    ))}
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
  liveProgressContainer: {
    width: 40,
    height: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
    borderRadius: 1,
    backgroundColor: 'rgba(0, 212, 87, 0.2)',
  },
  liveProgressBar: {
    position: 'absolute',
    height: '100%',
    width: 20,
    backgroundColor: colors.primary.main,
    borderRadius: 1,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
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
});