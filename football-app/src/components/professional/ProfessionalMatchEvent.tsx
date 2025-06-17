import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius } = DesignSystem;

interface ProfessionalMatchEventProps {
  event: {
    id: string;
    eventType: string;
    minute: number;
    player: {
      name: string;
      jerseyNumber?: number;
    };
    team: {
      name: string;
      isHome: boolean;
    };
    description?: string;
  };
  showConnector?: boolean;
}

export const ProfessionalMatchEvent: React.FC<ProfessionalMatchEventProps> = ({
  event,
  showConnector = true,
}) => {
  const getEventConfig = (eventType: string) => {
    switch (eventType) {
      case 'GOAL':
        return {
          icon: 'football',
          emoji: '⚽',
          color: colors.primary.main,
          backgroundColor: colors.primary.main + '20',
          label: 'Goal',
        };
      case 'ASSIST':
        return {
          icon: 'hand-right',
          emoji: '🤝',
          color: colors.accent.blue,
          backgroundColor: colors.accent.blue + '20',
          label: 'Assist',
        };
      case 'YELLOW_CARD':
        return {
          icon: 'card',
          emoji: '🟨',
          color: colors.semantic.warning,
          backgroundColor: colors.semantic.warning + '20',
          label: 'Yellow Card',
        };
      case 'RED_CARD':
        return {
          icon: 'card',
          emoji: '🟥',
          color: colors.semantic.error,
          backgroundColor: colors.semantic.error + '20',
          label: 'Red Card',
        };
      case 'SUBSTITUTION':
        return {
          icon: 'swap-horizontal',
          emoji: '🔄',
          color: colors.accent.purple,
          backgroundColor: colors.accent.purple + '20',
          label: 'Substitution',
        };
      default:
        return {
          icon: 'information-circle',
          emoji: '📝',
          color: colors.text.secondary,
          backgroundColor: colors.background.accent,
          label: eventType,
        };
    }
  };

  const config = getEventConfig(event.eventType);
  const isGoal = event.eventType === 'GOAL';

  return (
    <View style={styles.container}>
      {/* Timeline Line */}
      <View style={styles.timelineSection}>
        <View style={[styles.timelineDot, { backgroundColor: config.color }]} />
        {showConnector && <View style={styles.timelineConnector} />}
      </View>

      {/* Event Content */}
      <View style={[
        styles.eventCard,
        isGoal && styles.goalCard,
        { borderLeftColor: config.color }
      ]}>
        {/* Minute Badge */}
        <View style={[styles.minuteBadge, { backgroundColor: config.backgroundColor }]}>
          <Text style={[styles.minuteText, { color: config.color }]}>{event.minute}'</Text>
        </View>

        {/* Event Info */}
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={[styles.eventIcon, { backgroundColor: config.backgroundColor }]}>
              <Text style={styles.eventEmoji}>{config.emoji}</Text>
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.playerName}>
                {event.player.jerseyNumber && `#${event.player.jerseyNumber} `}
                {event.player.name}
              </Text>
              <View style={styles.eventMeta}>
                <Text style={[styles.eventLabel, { color: config.color }]}>
                  {config.label}
                </Text>
                <Text style={styles.teamName}>• {event.team.name}</Text>
              </View>
            </View>
          </View>
          
          {event.description && (
            <Text style={styles.description}>{event.description}</Text>
          )}
        </View>

        {/* Goal Star */}
        {isGoal && (
          <View style={styles.goalStar}>
            <Ionicons name="star" size={16} color={colors.accent.gold} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  timelineSection: {
    width: 40,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: spacing.md,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: spacing.xs,
  },
  eventCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginLeft: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  goalCard: {
    backgroundColor: colors.primary.main + '10',
  },
  minuteBadge: {
    position: 'absolute',
    top: -8,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  minuteText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  eventContent: {
    marginTop: spacing.xs,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  eventEmoji: {
    fontSize: 18,
  },
  eventInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLabel: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
  },
  teamName: {
    fontSize: typography.fontSize.small,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  goalStar: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent.gold + '20',
    padding: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
});