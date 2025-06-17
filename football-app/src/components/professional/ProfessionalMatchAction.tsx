import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ProfessionalMatchActionProps {
  homeTeamName: string;
  awayTeamName: string;
  isLive: boolean;
  availableSubstitutions: {
    home: number;
    away: number;
  };
  onAction: (team: 'home' | 'away', actionType: string) => void;
  onQuickEvent?: (eventType: string) => void;
}

export const ProfessionalMatchAction: React.FC<ProfessionalMatchActionProps> = ({
  homeTeamName,
  awayTeamName,
  isLive,
  availableSubstitutions,
  onAction,
  onQuickEvent,
}) => {
  const ActionButton = ({ 
    team, 
    actionType, 
    icon, 
    color, 
    emoji,
    disabled = false 
  }: any) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: color },
        disabled && styles.disabledButton
      ]}
      onPress={() => onAction(team, actionType)}
      disabled={disabled || !isLive}
    >
      {icon && <Ionicons name={icon} size={20} color="#FFFFFF" />}
      {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      {actionType === 'SUBSTITUTION' && (
        <Text style={styles.subsCount}>{availableSubstitutions[team]}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Team Headers */}
      <View style={styles.teamHeaders}>
        <Text style={styles.teamHeader}>{homeTeamName}</Text>
        <View style={styles.centerDivider} />
        <Text style={styles.teamHeader}>{awayTeamName}</Text>
      </View>

      {/* Action Grid */}
      <View style={styles.actionGrid}>
        {/* Goals Row */}
        <View style={styles.actionRow}>
          <ActionButton
            team="home"
            actionType="GOAL"
            icon="football"
            color={colors.primary.main}
          />
          <View style={styles.actionLabel}>
            <Ionicons name="football" size={16} color={colors.primary.main} />
            <Text style={styles.actionText}>Goals</Text>
          </View>
          <ActionButton
            team="away"
            actionType="GOAL"
            icon="football"
            color={colors.primary.main}
          />
        </View>

        {/* Yellow Cards Row */}
        <View style={styles.actionRow}>
          <ActionButton
            team="home"
            actionType="YELLOW_CARD"
            emoji="🟨"
            color={colors.semantic.warning}
          />
          <View style={styles.actionLabel}>
            <Text style={styles.cardEmoji}>🟨</Text>
            <Text style={styles.actionText}>Yellow</Text>
          </View>
          <ActionButton
            team="away"
            actionType="YELLOW_CARD"
            emoji="🟨"
            color={colors.semantic.warning}
          />
        </View>

        {/* Red Cards Row */}
        <View style={styles.actionRow}>
          <ActionButton
            team="home"
            actionType="RED_CARD"
            emoji="🟥"
            color={colors.semantic.error}
          />
          <View style={styles.actionLabel}>
            <Text style={styles.cardEmoji}>🟥</Text>
            <Text style={styles.actionText}>Red</Text>
          </View>
          <ActionButton
            team="away"
            actionType="RED_CARD"
            emoji="🟥"
            color={colors.semantic.error}
          />
        </View>

        {/* Substitutions Row */}
        <View style={styles.actionRow}>
          <ActionButton
            team="home"
            actionType="SUBSTITUTION"
            icon="people"
            color={colors.accent.purple}
            disabled={availableSubstitutions.home === 0}
          />
          <View style={styles.actionLabel}>
            <Ionicons name="swap-horizontal" size={16} color={colors.accent.purple} />
            <Text style={styles.actionText}>Subs</Text>
          </View>
          <ActionButton
            team="away"
            actionType="SUBSTITUTION"
            icon="people"
            color={colors.accent.purple}
            disabled={availableSubstitutions.away === 0}
          />
        </View>
      </View>

      {/* Quick Events */}
      {onQuickEvent && (
        <View style={styles.quickEvents}>
          <Text style={styles.quickEventsTitle}>Quick Events</Text>
          <View style={styles.quickEventGrid}>
            <TouchableOpacity 
              style={styles.quickEventButton}
              onPress={() => onQuickEvent('SAVE')}
            >
              <Text style={styles.quickEventIcon}>🧤</Text>
              <Text style={styles.quickEventText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickEventButton}
              onPress={() => onQuickEvent('MISS')}
            >
              <Text style={styles.quickEventIcon}>❌</Text>
              <Text style={styles.quickEventText}>Miss</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickEventButton}
              onPress={() => onQuickEvent('CORNER')}
            >
              <Text style={styles.quickEventIcon}>🚩</Text>
              <Text style={styles.quickEventText}>Corner</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickEventButton}
              onPress={() => onQuickEvent('FOUL')}
            >
              <Text style={styles.quickEventIcon}>⚠️</Text>
              <Text style={styles.quickEventText}>Foul</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    margin: spacing.screenPadding,
    ...shadows.md,
  },
  teamHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  teamHeader: {
    flex: 1,
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.md,
  },
  actionGrid: {
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadows.sm,
  },
  disabledButton: {
    opacity: 0.3,
  },
  emoji: {
    fontSize: 20,
  },
  subsCount: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.accent.purple,
  },
  actionLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  cardEmoji: {
    fontSize: 16,
  },
  quickEvents: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickEventsTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickEventGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickEventButton: {
    flex: 1,
    backgroundColor: colors.background.accent,
    marginHorizontal: spacing.xxs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickEventIcon: {
    fontSize: 20,
    marginBottom: spacing.xxs,
  },
  quickEventText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
});