import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface LineupPlayer {
  id: string;
  name: string;
  firstName?: string;
  jerseyNumber: number;
  position: string;
  rating?: number;
  image?: string;
  isCaptain?: boolean;
  isSubstitute?: boolean;
  x: number; // Position on pitch (0-100)
  y: number; // Position on pitch (0-100)
}

interface Formation {
  name: string; // e.g., "4-3-3", "4-4-2"
  positions: {
    [key: string]: { x: number; y: number };
  };
}

interface ProfessionalLineupCardProps {
  team: {
    id: string;
    name: string;
    badge?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  players: LineupPlayer[];
  formation: Formation;
  substitutes?: LineupPlayer[];
  onPlayerPress?: (player: LineupPlayer) => void;
  onSubstitutePress?: (player: LineupPlayer) => void;
  variant?: 'full' | 'compact' | 'tactical';
  showSubstitutes?: boolean;
  showRatings?: boolean;
  editable?: boolean;
}

export const ProfessionalLineupCard: React.FC<ProfessionalLineupCardProps> = ({
  team,
  players,
  formation,
  substitutes = [],
  onPlayerPress,
  onSubstitutePress,
  variant = 'full',
  showSubstitutes = true,
  showRatings = true,
  editable = false,
}) => {
  const teamColors = team.primaryColor 
    ? [team.primaryColor, team.secondaryColor || team.primaryColor] as const
    : [colors.primary.main, colors.primary.light] as const;

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK':
        return colors.semantic.warning.main;
      case 'DEF':
      case 'CB':
      case 'LB':
      case 'RB':
      case 'LWB':
      case 'RWB':
        return colors.primary.light;
      case 'MID':
      case 'CM':
      case 'CDM':
      case 'CAM':
      case 'LM':
      case 'RM':
        return colors.primary.main;
      case 'FWD':
      case 'LW':
      case 'RW':
      case 'ST':
      case 'CF':
        return colors.semantic.error.main;
      default:
        return colors.text.tertiary;
    }
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return colors.text.secondary;
    if (rating >= 85) return colors.primary.main;
    if (rating >= 75) return colors.semantic.success.main;
    if (rating >= 65) return colors.semantic.warning.main;
    return colors.text.secondary;
  };

  const renderPlayer = (player: LineupPlayer, isSubstitute = false) => {
    const positionColor = getPositionColor(player.position);
    
    return (
      <TouchableOpacity
        key={player.id}
        style={[
          isSubstitute ? styles.substitutePlayer : styles.pitchPlayer,
          variant === 'compact' && styles.compactPlayer,
          !isSubstitute && {
            position: 'absolute',
            left: `${player.x}%`,
            top: `${player.y}%`,
            transform: [{ translateX: -25 }, { translateY: -25 }],
          }
        ]}
        onPress={() => {
          if (isSubstitute && onSubstitutePress) {
            onSubstitutePress(player);
          } else if (!isSubstitute && onPlayerPress) {
            onPlayerPress(player);
          }
        }}
        activeOpacity={0.8}
      >
        <View style={[
          styles.playerContainer,
          variant === 'compact' && styles.compactPlayerContainer
        ]}>
          {/* Player Image */}
          <View style={styles.playerImageContainer}>
            {player.image ? (
              <Image 
                source={{ uri: player.image }} 
                style={[
                  styles.playerImage,
                  variant === 'compact' && styles.compactPlayerImage
                ]} 
              />
            ) : (
              <View style={[
                styles.playerImagePlaceholder,
                variant === 'compact' && styles.compactPlayerImagePlaceholder,
                { backgroundColor: positionColor }
              ]}>
                <Ionicons 
                  name="person" 
                  size={variant === 'compact' ? 16 : 20} 
                  color="#FFFFFF" 
                />
              </View>
            )}
            
            {/* Jersey Number */}
            <View style={[
              styles.jerseyBadge,
              variant === 'compact' && styles.compactJerseyBadge
            ]}>
              <Text style={[
                styles.jerseyNumber,
                variant === 'compact' && styles.compactJerseyNumber
              ]}>
                {player.jerseyNumber}
              </Text>
            </View>
            
            {/* Captain Badge */}
            {player.isCaptain && (
              <View style={styles.captainBadge}>
                <Ionicons name="star" size={12} color={colors.primary.main} />
              </View>
            )}
          </View>
          
          {/* Player Info */}
          {variant !== 'compact' && (
            <View style={styles.playerInfo}>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.firstName || player.name.split(' ')[0]}
              </Text>
              <Text style={styles.playerPosition}>{player.position}</Text>
              {showRatings && player.rating && (
                <Text style={[
                  styles.playerRating,
                  { color: getRatingColor(player.rating) }
                ]}>
                  {player.rating}
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>{team.name} - {formation.name}</Text>
          <Text style={styles.compactSubtitle}>{players.length} players</Text>
        </View>
        <View style={styles.compactPlayerList}>
          {players.map(player => renderPlayer(player))}
        </View>
      </View>
    );
  }

  if (variant === 'tactical') {
    return (
      <View style={styles.tacticalContainer}>
        {/* Header */}
        <View style={styles.tacticalHeader}>
          <LinearGradient colors={teamColors} style={styles.tacticalHeaderGradient}>
            <View style={styles.tacticalHeaderContent}>
              {team.badge && (
                <Image source={{ uri: team.badge }} style={styles.teamBadge} />
              )}
              <View style={styles.tacticalHeaderInfo}>
                <Text style={styles.tacticalTeamName}>{team.name}</Text>
                <Text style={styles.tacticalFormation}>Formation: {formation.name}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Pitch */}
        <View style={styles.tacticalPitch}>
          <LinearGradient
            colors={['#2E7D32', '#1B5E20']}
            style={styles.pitchGradient}
          >
            {/* Pitch markings */}
            <View style={styles.pitchMarkings}>
              {/* Center circle */}
              <View style={styles.centerCircle} />
              {/* Goal areas */}
              <View style={[styles.goalArea, styles.topGoalArea]} />
              <View style={[styles.goalArea, styles.bottomGoalArea]} />
              {/* Center line */}
              <View style={styles.centerLine} />
            </View>
            
            {/* Players */}
            {players.map(player => renderPlayer(player))}
          </LinearGradient>
        </View>

        {/* Formation stats */}
        <View style={styles.formationStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{players.filter(p => p.position === 'GK').length}</Text>
            <Text style={styles.statLabel}>GK</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{players.filter(p => ['DEF', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position)).length}</Text>
            <Text style={styles.statLabel}>DEF</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{players.filter(p => ['MID', 'CM', 'CDM', 'CAM', 'LM', 'RM'].includes(p.position)).length}</Text>
            <Text style={styles.statLabel}>MID</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{players.filter(p => ['FWD', 'LW', 'RW', 'ST', 'CF'].includes(p.position)).length}</Text>
            <Text style={styles.statLabel}>FWD</Text>
          </View>
        </View>
      </View>
    );
  }

  // Full variant (default)
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient colors={teamColors} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            {team.badge && (
              <Image source={{ uri: team.badge }} style={styles.teamBadge} />
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.formation}>Formation: {formation.name}</Text>
            </View>
            {editable && (
              <TouchableOpacity style={styles.editButton}>
                <Ionicons name="create" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Pitch */}
      <View style={styles.pitch}>
        <LinearGradient
          colors={['#2E7D32', '#1B5E20']}
          style={styles.pitchGradient}
        >
          {/* Pitch markings */}
          <View style={styles.pitchMarkings}>
            <View style={styles.centerCircle} />
            <View style={[styles.goalArea, styles.topGoalArea]} />
            <View style={[styles.goalArea, styles.bottomGoalArea]} />
            <View style={styles.centerLine} />
          </View>
          
          {/* Players */}
          {players.map(player => renderPlayer(player))}
        </LinearGradient>
      </View>

      {/* Substitutes */}
      {showSubstitutes && substitutes.length > 0 && (
        <View style={styles.substitutesSection}>
          <Text style={styles.substitutesTitle}>Substitutes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.substitutesList}>
              {substitutes.map(player => renderPlayer(player, true))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Team Stats */}
      <View style={styles.teamStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{players.filter(p => p.rating && p.rating >= 80).length}</Text>
          <Text style={styles.statLabel}>80+ Rated</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{players.filter(p => p.isCaptain).length}</Text>
          <Text style={styles.statLabel}>Captains</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {showRatings && players.some(p => p.rating) 
              ? Math.round(players.reduce((sum, p) => sum + (p.rating || 0), 0) / players.length)
              : '-'
            }
          </Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Main container
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },

  // Header
  header: {
    height: 80,
  },
  headerGradient: {
    flex: 1,
    padding: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xxs,
  },
  formation: {
    fontSize: typography.fontSize.small,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeight.medium,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: spacing.sm,
  },

  // Pitch
  pitch: {
    height: 400,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  pitchGradient: {
    flex: 1,
    position: 'relative',
  },
  pitchMarkings: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerCircle: {
    position: 'absolute',
    top: '40%',
    left: '35%',
    width: '30%',
    height: '20%',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  goalArea: {
    position: 'absolute',
    left: '25%',
    width: '50%',
    height: '15%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  topGoalArea: {
    top: 0,
    borderBottomWidth: 2,
    borderTopWidth: 0,
  },
  bottomGoalArea: {
    bottom: 0,
    borderTopWidth: 2,
    borderBottomWidth: 0,
  },

  // Players
  pitchPlayer: {
    position: 'absolute',
  },
  playerContainer: {
    alignItems: 'center',
  },
  playerImageContainer: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  playerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  playerImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  jerseyBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  jerseyNumber: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  captainBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: colors.primary.main,
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  playerInfo: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    minWidth: 60,
  },
  playerName: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  playerPosition: {
    fontSize: typography.fontSize.micro,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  playerRating: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },

  // Substitutes
  substitutesSection: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  substitutesTitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  substitutesList: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  substitutePlayer: {
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Team stats
  teamStats: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },

  // Compact variant
  compactContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  compactHeader: {
    marginBottom: spacing.md,
  },
  compactTitle: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  compactSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
  },
  compactPlayerList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  compactPlayer: {
    position: 'relative',
  },
  compactPlayerContainer: {
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 60,
  },
  compactPlayerImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  compactPlayerImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  compactJerseyBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    bottom: -2,
    right: -2,
  },
  compactJerseyNumber: {
    fontSize: 8,
  },

  // Tactical variant
  tacticalContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  tacticalHeader: {
    height: 60,
  },
  tacticalHeaderGradient: {
    flex: 1,
    padding: spacing.md,
  },
  tacticalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tacticalHeaderInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tacticalTeamName: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  tacticalFormation: {
    fontSize: typography.fontSize.small,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tacticalPitch: {
    height: 300,
    margin: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  formationStats: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
});