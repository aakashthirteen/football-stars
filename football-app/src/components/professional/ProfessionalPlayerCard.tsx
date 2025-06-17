import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ProfessionalPlayerCardProps {
  player: {
    id: string;
    name: string;
    position: string;
    jerseyNumber?: number;
    role?: string;
    image?: string;
    stats?: {
      goals: number;
      assists: number;
      matches: number;
      cards: number;
    };
  };
  onPress?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
}

export const ProfessionalPlayerCard: React.FC<ProfessionalPlayerCardProps> = ({
  player,
  onPress,
  variant = 'default',
}) => {
  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK':
        return colors.accent.orange;
      case 'DEF':
        return colors.accent.blue;
      case 'MID':
        return colors.primary.main;
      case 'FWD':
        return colors.status.live;
      default:
        return colors.text.tertiary;
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'CAPTAIN':
        return { icon: 'star', color: colors.accent.gold };
      case 'VICE_CAPTAIN':
        return { icon: 'star-half', color: colors.accent.gold };
      default:
        return null;
    }
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.9}
        disabled={!onPress}
      >
        <View style={styles.compactHeader}>
          <View style={[styles.compactPosition, { backgroundColor: getPositionColor(player.position) }]}>
            <Text style={styles.compactPositionText}>{player.position}</Text>
          </View>
          {player.jerseyNumber && (
            <Text style={styles.compactJersey}>#{player.jerseyNumber}</Text>
          )}
        </View>
        <Text style={styles.compactName} numberOfLines={1}>{player.name}</Text>
        {getRoleIcon(player.role) && (
          <Ionicons 
            name={getRoleIcon(player.role)!.icon as any} 
            size={16} 
            color={getRoleIcon(player.role)!.color} 
          />
        )}
      </TouchableOpacity>
    );
  }

  const roleIcon = getRoleIcon(player.role);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variant === 'detailed' && styles.detailedContainer
      ]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={!onPress}
    >
      {/* Player Header */}
      <View style={styles.header}>
        <View style={styles.playerImageContainer}>
          {player.image ? (
            <Image source={{ uri: player.image }} style={styles.playerImage} />
          ) : (
            <View style={styles.playerImagePlaceholder}>
              <Ionicons name="person" size={32} color={colors.text.tertiary} />
            </View>
          )}
          <View style={[styles.positionBadge, { backgroundColor: getPositionColor(player.position) }]}>
            <Text style={styles.positionText}>{player.position}</Text>
          </View>
        </View>

        <View style={styles.playerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
            {roleIcon && (
              <Ionicons 
                name={roleIcon.icon as any} 
                size={20} 
                color={roleIcon.color} 
                style={styles.roleIcon}
              />
            )}
          </View>
          
          {player.jerseyNumber && (
            <View style={styles.jerseyContainer}>
              <Ionicons name="shirt-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.jerseyNumber}>#{player.jerseyNumber}</Text>
            </View>
          )}
        </View>

        {onPress && (
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        )}
      </View>

      {/* Stats Section */}
      {player.stats ? (
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Ionicons name="football" size={16} color={colors.primary.main} />
            <Text style={styles.statValue}>{player.stats.goals}</Text>
            <Text style={styles.statLabel}>Goals</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={16} color={colors.accent.blue} />
            <Text style={styles.statValue}>{player.stats.assists}</Text>
            <Text style={styles.statLabel}>Assists</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="calendar" size={16} color={colors.accent.purple} />
            <Text style={styles.statValue}>{player.stats.matches}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="card" size={16} color={colors.semantic.warning} />
            <Text style={styles.statValue}>{player.stats.cards}</Text>
            <Text style={styles.statLabel}>Cards</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noStatsSection}>
          <Text style={styles.noStatsText}>No match data available</Text>
          <Text style={styles.noStatsSubtext}>Stats will appear after playing matches</Text>
        </View>
      )}

      {/* Detailed variant extras */}
      {variant === 'detailed' && player.stats && (
        <View style={styles.performanceSection}>
          <Text style={styles.performanceTitle}>Recent Form</Text>
          <View style={styles.formIndicators}>
            {[...Array(5)].map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.formDot,
                  { backgroundColor: index < 3 ? colors.semantic.success : colors.text.tertiary }
                ]} 
              />
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailedContainer: {
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  playerImageContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  playerImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  playerImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    borderWidth: 2,
    borderColor: colors.background.secondary,
  },
  positionText: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  playerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  roleIcon: {
    marginLeft: spacing.xs,
  },
  jerseyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  jerseyNumber: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.xxs,
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    padding: spacing.md,
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
    marginVertical: spacing.xxs,
  },
  statLabel: {
    fontSize: typography.fontSize.micro,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  noStatsSection: {
    backgroundColor: colors.background.accent,
    padding: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  noStatsText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  noStatsSubtext: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
  },
  performanceSection: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  performanceTitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  formIndicators: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  formDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Compact variant styles
  compactContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    width: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  compactPosition: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  compactPositionText: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  compactJersey: {
    fontSize: typography.fontSize.micro,
    color: colors.text.secondary,
    marginLeft: spacing.xxs,
  },
  compactName: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    textAlign: 'center',
  },
});