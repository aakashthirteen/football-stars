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
import { ProfessionalTeamBadge } from './ProfessionalTeamBadge';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ProfessionalTeamCardProps {
  team: {
    id: string;
    name: string;
    description?: string;
    players: any[];
    badge?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  onPress: () => void;
  variant?: 'default' | 'compact';
}

export const ProfessionalTeamCard: React.FC<ProfessionalTeamCardProps> = ({
  team,
  onPress,
  variant = 'default',
}) => {
  const playerCount = team.players?.length || 0;
  const captainCount = team.players?.filter(p => p.role === 'CAPTAIN').length || 0;
  const isActive = playerCount > 0;
  
  const teamColors = team.primaryColor 
    ? [team.primaryColor, team.secondaryColor || team.primaryColor]
    : [colors.team.home.primary, colors.team.home.secondary];

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.compactContent}>
          <ProfessionalTeamBadge
            teamName={team.name}
            badgeUrl={team.badge}
            size="small"
            teamColor={team.primaryColor}
          />
          <Text style={styles.compactName} numberOfLines={1}>{team.name}</Text>
          <View style={styles.compactStats}>
            <Ionicons name="people" size={14} color={colors.text.secondary} />
            <Text style={styles.compactStatText}>{playerCount}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Team Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={teamColors}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerPattern} />
          <View style={styles.headerContent}>
            <ProfessionalTeamBadge
              teamName={team.name}
              badgeUrl={team.badge}
              size="large"
              variant="detailed"
            />
            <View style={styles.headerInfo}>
              <Text style={styles.teamName}>{team.name}</Text>
              {team.description && (
                <Text style={styles.teamDescription} numberOfLines={2}>
                  {team.description}
                </Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: colors.accent.blue + '20' }]}>
            <Ionicons name="people" size={20} color={colors.accent.blue} />
          </View>
          <View>
            <Text style={styles.statValue}>{playerCount}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: colors.accent.gold + '20' }]}>
            <Ionicons name="star" size={20} color={colors.accent.gold} />
          </View>
          <View>
            <Text style={styles.statValue}>{captainCount}</Text>
            <Text style={styles.statLabel}>Captain{captainCount !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary.main + '20' }]}>
            <Ionicons name="football" size={20} color={colors.primary.main} />
          </View>
          <View>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.statusBadge}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isActive ? colors.primary.main : colors.text.tertiary }
          ]} />
          <Text style={[
            styles.statusText,
            { color: isActive ? colors.primary.main : colors.text.tertiary }
          ]}>
            {isActive ? 'Active Squad' : 'Building Squad'}
          </Text>
        </View>

        <View style={styles.actionButton}>
          <Text style={styles.actionText}>View Team</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary.main} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  header: {
    height: 120,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    padding: spacing.lg,
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  teamName: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xxs,
  },
  teamDescription: {
    fontSize: typography.fontSize.small,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.tertiary,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginTop: -2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badge,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary.main,
    marginRight: spacing.xxs,
  },
  // Compact variant styles
  compactContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: 100,
    alignItems: 'center',
    ...shadows.sm,
  },
  compactContent: {
    alignItems: 'center',
  },
  compactName: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  compactStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  compactStatText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xxs,
  },
});