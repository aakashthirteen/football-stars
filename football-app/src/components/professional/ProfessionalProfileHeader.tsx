import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { width: screenWidth } = Dimensions.get('window');
const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface PlayerStats {
  matchesPlayed: number;
  goals: number;
  assists: number;
  averageRating: number;
  position: string;
  team?: string;
}

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    coverImage?: string;
  };
  stats?: PlayerStats;
  onBack?: () => void;
  onSettings?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  showActions?: boolean;
  editable?: boolean;
  animateOnMount?: boolean;
  showStats?: boolean;
  customBackground?: string;
  tintColor?: string;
}

export const ProfessionalProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  stats,
  onBack,
  onSettings,
  onEdit,
  onShare,
  showActions = true,
  editable = false,
  animateOnMount = true,
  showStats = true,
  customBackground,
  tintColor,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(animateOnMount ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animateOnMount ? -30 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(animateOnMount ? 0.8 : 1)).current;
  const parallaxAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animateOnMount) {
      Animated.stagger(150, [
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animateOnMount, fadeAnim, slideAnim, scaleAnim]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getPositionColor = (position?: string) => {
    switch (position) {
      case 'GK': return colors.semantic.error.main;
      case 'DEF': return colors.primary.main;
      case 'MID': return colors.secondary.main;
      case 'FWD': return colors.semantic.warning.main;
      default: return colors.primary.main;
    }
  };

  const getPositionIcon = (position?: string) => {
    switch (position) {
      case 'GK': return 'shield';
      case 'DEF': return 'shield-outline';
      case 'MID': return 'football';
      case 'FWD': return 'flash';
      default: return 'person';
    }
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  const renderStatsCard = (label: string, value: string | number, icon: string, color?: string) => (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={[styles.statIcon, color && { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={16} color="#FFFFFF" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );

  const renderCoverImage = () => {
    if (customBackground || user.coverImage) {
      return (
        <Animated.View
          style={[
            styles.coverImageContainer,
            {
              transform: [
                {
                  translateY: parallaxAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  })
                }
              ]
            }
          ]}
        >
          <Image
            source={{ uri: customBackground || user.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.coverOverlay} />
        </Animated.View>
      );
    }
    return null;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background */}
      {renderCoverImage()}
      <LinearGradient
        colors={customBackground 
          ? ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.6)']
          : [colors.background.secondary, colors.background.primary]
        }
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Pattern Overlay */}
      <View style={styles.patternOverlay} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header Actions */}
        {showActions && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>

            <View style={styles.rightActions}>
              {onShare && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onShare}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="share-outline" size={22} color={colors.text.primary} />
                </TouchableOpacity>
              )}
              
              {editable && onEdit && (
                <TouchableOpacity
                  style={[styles.actionButton, { marginLeft: spacing.sm }]}
                  onPress={onEdit}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="create-outline" size={22} color={colors.text.primary} />
                </TouchableOpacity>
              )}

              {onSettings && (
                <TouchableOpacity
                  style={[styles.actionButton, { marginLeft: spacing.sm }]}
                  onPress={onSettings}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="settings-outline" size={22} color={colors.text.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Profile Content */}
        <View style={styles.profileContent}>
          {/* Avatar Section */}
          <Animated.View
            style={[
              styles.avatarContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: getPositionColor(stats?.position) }]}>
                <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
              </View>
            )}
            
            {/* Position Badge */}
            {stats?.position && (
              <View style={[styles.positionBadge, { backgroundColor: getPositionColor(stats.position) }]}>
                <Ionicons 
                  name={getPositionIcon(stats.position) as any} 
                  size={12} 
                  color="#FFFFFF" 
                />
                <Text style={styles.positionText}>{stats.position}</Text>
              </View>
            )}
          </Animated.View>

          {/* User Info */}
          <Animated.View
            style={[
              styles.userInfo,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            {stats?.team && (
              <View style={styles.teamInfo}>
                <Ionicons name="shield" size={14} color={colors.text.secondary} />
                <Text style={styles.teamText}>{stats.team}</Text>
              </View>
            )}
          </Animated.View>

          {/* Stats Section */}
          {showStats && stats && (
            <View style={styles.statsContainer}>
              {renderStatsCard(
                'Matches',
                stats.matchesPlayed,
                'calendar',
                colors.primary.main
              )}
              {renderStatsCard(
                'Goals',
                stats.goals,
                'football',
                colors.semantic.success.main
              )}
              {renderStatsCard(
                'Assists',
                stats.assists,
                'hand-left',
                colors.secondary.main
              )}
              {renderStatsCard(
                'Rating',
                formatRating(stats.averageRating),
                'star',
                colors.semantic.warning.main
              )}
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Bottom Separator */}
      <View style={styles.bottomSeparator} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 280,
    maxHeight: 340,
    backgroundColor: colors.background.secondary,
  },
  coverImageContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -2,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    zIndex: -1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 0 : spacing.md,
    height: 44,
    marginBottom: spacing.md,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...shadows.lg,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...shadows.lg,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  positionBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.md,
  },
  positionText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  userName: {
    fontSize: typography.fontSize.title1,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  teamText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.xxs,
    fontWeight: typography.fontWeight.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...shadows.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    backgroundColor: colors.primary.main,
  },
  statValue: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  statLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  bottomSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});