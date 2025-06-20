import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows, gradients } = DesignSystem;
const { width } = Dimensions.get('window');

interface ProfessionalPlayerStatsProps {
  playerName: string;
  position: string;
  stats: {
    goals: number;
    assists: number;
    matches: number;
    rating: number;
  };
  teamBadge?: string;
  playerImage?: string;
  onPress?: () => void;
}

export const ProfessionalPlayerStats: React.FC<ProfessionalPlayerStatsProps> = ({
  playerName,
  position,
  stats,
  teamBadge,
  playerImage,
  onPress,
}) => {
  // Validate required props
  if (!playerName || typeof playerName !== 'string') {
    console.warn('ProfessionalPlayerStats: playerName is required and must be a string');
    return null;
  }
  
  if (!position || typeof position !== 'string') {
    console.warn('ProfessionalPlayerStats: position is required and must be a string');
    return null;
  }
  
  if (!stats || typeof stats !== 'object') {
    console.warn('ProfessionalPlayerStats: stats is required and must be an object');
    return null;
  }
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // State for animated counters
  const [displayedGoals, setDisplayedGoals] = React.useState(0);
  const [displayedAssists, setDisplayedAssists] = React.useState(0);
  const [displayedMatches, setDisplayedMatches] = React.useState(0);

  useEffect(() => {
    // Entrance animation
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate counters
    const animateCounter = (
      startValue: number,
      endValue: number,
      duration: number,
      delay: number,
      setValue: (value: number) => void
    ) => {
      setTimeout(() => {
        let current = startValue;
        const increment = (endValue - startValue) / (duration / 16); // 60fps
        const timer = setInterval(() => {
          current += increment;
          if (current >= endValue) {
            setValue(endValue);
            clearInterval(timer);
          } else {
            setValue(Math.floor(current));
          }
        }, 16);
      }, delay);
    };

    animateCounter(0, stats.goals, 1000, 300, setDisplayedGoals);
    animateCounter(0, stats.assists, 1000, 400, setDisplayedAssists);
    animateCounter(0, stats.matches, 1000, 500, setDisplayedMatches);
  }, [stats]);

  const getPositionColor = (pos: string) => {
    switch (pos) {
      case 'GK':
        return colors.accent.orange;
      case 'DEF':
        return colors.accent.blue;
      case 'MID':
        return colors.primary.main;
      case 'FWD':
        return colors.accent.coral;
      default:
        return colors.primary.main;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return colors.primary.main;
    if (rating >= 7) return colors.semantic.success;
    if (rating >= 6) return colors.semantic.warning;
    return colors.semantic.error;
  };

  const StatItem = ({ icon, value, label, color }: any) => (
    <View style={styles.statItem}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderAchievements = () => {
    const achievements: { icon: string; color: string; label: string }[] = [];
    
    // Safe stats checking
    if (stats && typeof stats === 'object') {
      if (typeof stats.goals === 'number' && stats.goals >= 10) {
        achievements.push({ icon: 'football', color: colors.accent.gold, label: 'Goal Machine' });
      }
      if (typeof stats.assists === 'number' && stats.assists >= 5) {
        achievements.push({ icon: 'trending-up', color: colors.accent.purple, label: 'Playmaker' });
      }
      if (typeof stats.rating === 'number' && stats.rating >= 8) {
        achievements.push({ icon: 'star', color: colors.accent.gold, label: 'Top Performer' });
      }
    }
    
    if (!Array.isArray(achievements) || achievements.length === 0) return null;
    
    return (
      <View style={styles.achievementsRow}>
        {(Array.isArray(achievements) && achievements.length > 0 ? achievements : []).map((achievement, index) => (
          <View key={index} style={styles.achievementBadge}>
            <Ionicons name={achievement.icon as any} size={14} color={achievement.color} />
          </View>
        ))}
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity 
        style={styles.container} 
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Glass effect background */}
        <View style={styles.glassBackground} />
        
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.02)']}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.playerInfo}>
              <View style={styles.playerImageContainer}>
                {playerImage ? (
                  <Image source={{ uri: playerImage }} style={styles.playerImage} />
                ) : (
                  <LinearGradient
                    colors={[colors.background.tertiary, colors.background.accent]}
                    style={styles.playerImagePlaceholder}
                  >
                    <Ionicons name="person" size={28} color={colors.text.secondary} />
                  </LinearGradient>
                )}
                <View style={[styles.positionBadge, { backgroundColor: getPositionColor(position) }]}>
                  <Text style={styles.positionText}>{position}</Text>
                </View>
              </View>
              
              <View style={styles.playerDetails}>
                <Text style={styles.playerName}>{playerName}</Text>
                <View style={styles.ratingContainer}>
                  <LinearGradient
                    colors={[getRatingColor(stats.rating), getRatingColor(stats.rating) + 'CC']}
                    style={styles.ratingBadge}
                  >
                    <Text style={styles.ratingText}>{stats.rating.toFixed(1)}</Text>
                    <Ionicons name="star" size={10} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.ratingLabel}>Rating</Text>
                  {renderAchievements()}
                </View>
              </View>
            </View>
            
            {teamBadge && (
              <View style={styles.teamBadgeContainer}>
                <Image source={{ uri: teamBadge }} style={styles.teamBadge} />
              </View>
            )}
          </View>
          
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatItem 
              icon="football" 
              value={displayedGoals}
              label="Goals" 
              color={colors.primary.main}
            />
            <StatItem 
              icon="trending-up" 
              value={displayedAssists}
              label="Assists" 
              color={colors.accent.blue}
            />
            <StatItem 
              icon="calendar" 
              value={displayedMatches}
              label="Matches" 
              color={colors.accent.purple}
            />
          </View>
          
          {/* Recent Form - Last 5 matches */}
          <View style={styles.recentFormSection}>
            <Text style={styles.recentFormTitle}>Recent Form</Text>
            <View style={styles.formDots}>
              {[...Array(5)].map((_, index) => (
                <View 
                  key={index}
                  style={[
                    styles.formDot,
                    {
                      backgroundColor: index < 3 ? colors.semantic.success : colors.semantic.warning,
                    }
                  ]}
                />
              ))}
            </View>
          </View>
          
          {/* Action Button */}
          <TouchableOpacity style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>View Full Stats</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary.main} />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.screenPadding,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.secondary,
    opacity: 0.95,
  },
  gradientOverlay: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerImageContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  playerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  playerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  positionBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.badge,
    borderWidth: 2,
    borderColor: colors.background.secondary,
  },
  positionText: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginRight: spacing.xxs,
  },
  ratingLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  achievementsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xxs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamBadgeContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamBadge: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  statLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentFormSection: {
    marginBottom: spacing.md,
  },
  recentFormTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  formDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  viewDetailsText: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary.main,
    marginRight: spacing.xs,
  },
});