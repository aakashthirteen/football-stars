import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ProfessionalCardLoadingStatesProps {
  variant: 'team' | 'player' | 'lineup' | 'branding' | 'list' | 'grid' | 'comparison';
  count?: number;
  showLabels?: boolean;
}

export const ProfessionalCardLoadingStates: React.FC<ProfessionalCardLoadingStatesProps> = ({
  variant,
  count = 1,
  showLabels = false,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, [animatedValue]);

  const shimmerOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const ShimmerBox = ({ style, children }: { style?: any; children?: React.ReactNode }) => (
    <Animated.View style={[style, { opacity: shimmerOpacity }]}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: style?.borderRadius || 0 }]}
      />
      {children}
    </Animated.View>
  );

  const renderTeamCardLoading = () => (
    <View style={styles.teamCardContainer}>
      {showLabels && <Text style={styles.loadingLabel}>Loading Team...</Text>}
      
      {/* Header */}
      <View style={styles.teamCardHeader}>
        <ShimmerBox style={styles.teamBadgeLoading} />
        <View style={styles.teamHeaderInfo}>
          <ShimmerBox style={styles.teamNameLoading} />
          <ShimmerBox style={styles.teamDescriptionLoading} />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.teamStatsLoading}>
        <View style={styles.teamStatLoading}>
          <ShimmerBox style={styles.statIconLoading} />
          <View style={styles.statTextLoading}>
            <ShimmerBox style={styles.statValueLoading} />
            <ShimmerBox style={styles.statLabelLoading} />
          </View>
        </View>
        <View style={styles.teamStatLoading}>
          <ShimmerBox style={styles.statIconLoading} />
          <View style={styles.statTextLoading}>
            <ShimmerBox style={styles.statValueLoading} />
            <ShimmerBox style={styles.statLabelLoading} />
          </View>
        </View>
        <View style={styles.teamStatLoading}>
          <ShimmerBox style={styles.statIconLoading} />
          <View style={styles.statTextLoading}>
            <ShimmerBox style={styles.statValueLoading} />
            <ShimmerBox style={styles.statLabelLoading} />
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.teamFooterLoading}>
        <ShimmerBox style={styles.statusBadgeLoading} />
        <ShimmerBox style={styles.actionButtonLoading} />
      </View>
    </View>
  );

  const renderPlayerCardLoading = () => (
    <View style={styles.playerCardContainer}>
      {showLabels && <Text style={styles.loadingLabel}>Loading Player...</Text>}
      
      {/* Header */}
      <View style={styles.playerCardHeader}>
        <View style={styles.playerImageContainer}>
          <ShimmerBox style={styles.playerImageLoading} />
          <ShimmerBox style={styles.positionBadgeLoading} />
        </View>
        <View style={styles.playerInfo}>
          <ShimmerBox style={styles.playerNameLoading} />
          <ShimmerBox style={styles.playerDetailsLoading} />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.playerStatsLoading}>
        <View style={styles.playerStatLoading}>
          <ShimmerBox style={styles.statIconLoading} />
          <ShimmerBox style={styles.statValueLoading} />
          <ShimmerBox style={styles.statLabelLoading} />
        </View>
        <View style={styles.playerStatLoading}>
          <ShimmerBox style={styles.statIconLoading} />
          <ShimmerBox style={styles.statValueLoading} />
          <ShimmerBox style={styles.statLabelLoading} />
        </View>
        <View style={styles.playerStatLoading}>
          <ShimmerBox style={styles.statIconLoading} />
          <ShimmerBox style={styles.statValueLoading} />
          <ShimmerBox style={styles.statLabelLoading} />
        </View>
        <View style={styles.playerStatLoading}>
          <ShimmerBox style={styles.statIconLoading} />
          <ShimmerBox style={styles.statValueLoading} />
          <ShimmerBox style={styles.statLabelLoading} />
        </View>
      </View>
    </View>
  );

  const renderListItemLoading = () => (
    <View style={styles.listItemContainer}>
      <ShimmerBox style={styles.listImageLoading} />
      <View style={styles.listContentLoading}>
        <ShimmerBox style={styles.listTitleLoading} />
        <ShimmerBox style={styles.listSubtitleLoading} />
        <View style={styles.listMetaLoading}>
          <ShimmerBox style={styles.listMetaItemLoading} />
          <ShimmerBox style={styles.listMetaItemLoading} />
          <ShimmerBox style={styles.listMetaItemLoading} />
        </View>
      </View>
      <ShimmerBox style={styles.listChevronLoading} />
    </View>
  );

  const renderGridItemLoading = () => (
    <View style={styles.gridItemContainer}>
      <ShimmerBox style={styles.gridImageLoading} />
      <View style={styles.gridContentLoading}>
        <ShimmerBox style={styles.gridTitleLoading} />
        <ShimmerBox style={styles.gridSubtitleLoading} />
      </View>
      <ShimmerBox style={styles.gridRatingLoading} />
    </View>
  );

  const renderLineupLoading = () => (
    <View style={styles.lineupContainer}>
      {showLabels && <Text style={styles.loadingLabel}>Loading Lineup...</Text>}
      
      {/* Header */}
      <View style={styles.lineupHeader}>
        <ShimmerBox style={styles.teamBadgeLoading} />
        <View style={styles.lineupHeaderInfo}>
          <ShimmerBox style={styles.teamNameLoading} />
          <ShimmerBox style={styles.formationLoading} />
        </View>
      </View>

      {/* Pitch */}
      <View style={styles.pitchLoading}>
        <ShimmerBox style={styles.pitchBackground} />
        {/* Players */}
        {[...Array(11)].map((_, index) => (
          <ShimmerBox
            key={index}
            style={[
              styles.pitchPlayerLoading,
              {
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
              }
            ]}
          />
        ))}
      </View>

      {/* Substitutes */}
      <View style={styles.substitutesLoading}>
        <ShimmerBox style={styles.substitutesTitle} />
        <View style={styles.substitutesList}>
          {[...Array(7)].map((_, index) => (
            <ShimmerBox key={index} style={styles.substitutePlayerLoading} />
          ))}
        </View>
      </View>
    </View>
  );

  const renderBrandingLoading = () => (
    <View style={styles.brandingContainer}>
      {showLabels && <Text style={styles.loadingLabel}>Loading Team Branding...</Text>}
      
      {/* Hero section */}
      <View style={styles.brandingHero}>
        <ShimmerBox style={styles.brandingBackground} />
        <View style={styles.brandingContent}>
          <ShimmerBox style={styles.teamBadgeLoading} />
          <View style={styles.brandingInfo}>
            <ShimmerBox style={styles.brandingTeamName} />
            <ShimmerBox style={styles.brandingNickname} />
            <ShimmerBox style={styles.brandingLeague} />
          </View>
        </View>
      </View>

      {/* Identity section */}
      <View style={styles.brandingIdentity}>
        <View style={styles.brandingRow}>
          <View style={styles.brandingItem}>
            <ShimmerBox style={styles.brandingIconLoading} />
            <ShimmerBox style={styles.brandingLabelLoading} />
            <ShimmerBox style={styles.brandingValueLoading} />
          </View>
          <View style={styles.brandingItem}>
            <ShimmerBox style={styles.brandingIconLoading} />
            <ShimmerBox style={styles.brandingLabelLoading} />
            <ShimmerBox style={styles.brandingValueLoading} />
          </View>
        </View>
      </View>

      {/* Jersey section */}
      <View style={styles.brandingJerseys}>
        <ShimmerBox style={styles.jerseySectionTitle} />
        <View style={styles.jerseyRow}>
          <View style={styles.jerseyItem}>
            <ShimmerBox style={styles.jerseyColorLoading} />
            <ShimmerBox style={styles.jerseyLabelLoading} />
          </View>
          <View style={styles.jerseyItem}>
            <ShimmerBox style={styles.jerseyColorLoading} />
            <ShimmerBox style={styles.jerseyLabelLoading} />
          </View>
          <View style={styles.jerseyItem}>
            <ShimmerBox style={styles.jerseyColorLoading} />
            <ShimmerBox style={styles.jerseyLabelLoading} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderComparisonLoading = () => (
    <View style={styles.comparisonContainer}>
      {showLabels && <Text style={styles.loadingLabel}>Loading Comparison...</Text>}
      
      {/* Header */}
      <View style={styles.comparisonHeader}>
        <View style={styles.comparisonPlayerSection}>
          <ShimmerBox style={styles.comparisonImageLoading} />
          <View style={styles.comparisonPlayerInfo}>
            <ShimmerBox style={styles.comparisonNameLoading} />
            <ShimmerBox style={styles.comparisonMetaLoading} />
          </View>
        </View>
        <ShimmerBox style={styles.comparisonRatingLoading} />
      </View>

      {/* Attributes */}
      <View style={styles.comparisonAttributes}>
        <View style={styles.attributeRow}>
          {[...Array(3)].map((_, index) => (
            <View key={index} style={styles.attributeItem}>
              <ShimmerBox style={styles.attributeValueLoading} />
              <ShimmerBox style={styles.attributeLabelLoading} />
            </View>
          ))}
        </View>
        <View style={styles.attributeRow}>
          {[...Array(3)].map((_, index) => (
            <View key={index} style={styles.attributeItem}>
              <ShimmerBox style={styles.attributeValueLoading} />
              <ShimmerBox style={styles.attributeLabelLoading} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderLoadingCard = () => {
    switch (variant) {
      case 'team':
        return renderTeamCardLoading();
      case 'player':
        return renderPlayerCardLoading();
      case 'list':
        return renderListItemLoading();
      case 'grid':
        return renderGridItemLoading();
      case 'lineup':
        return renderLineupLoading();
      case 'branding':
        return renderBrandingLoading();
      case 'comparison':
        return renderComparisonLoading();
      default:
        return renderTeamCardLoading();
    }
  };

  return (
    <View style={styles.container}>
      {[...Array(count)].map((_, index) => (
        <View key={index} style={styles.cardWrapper}>
          {renderLoadingCard()}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  loadingLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Team Card Loading
  teamCardContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  teamCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.tertiary,
  },
  teamBadgeLoading: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background.accent,
    marginRight: spacing.md,
  },
  teamHeaderInfo: {
    flex: 1,
  },
  teamNameLoading: {
    height: 24,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    width: '70%',
  },
  teamDescriptionLoading: {
    height: 16,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    width: '50%',
  },
  teamStatsLoading: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.background.tertiary,
  },
  teamStatLoading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconLoading: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.accent,
    marginRight: spacing.sm,
  },
  statTextLoading: {
    flex: 1,
  },
  statValueLoading: {
    height: 20,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xxs,
    width: '60%',
  },
  statLabelLoading: {
    height: 14,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    width: '80%',
  },
  teamFooterLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  statusBadgeLoading: {
    height: 28,
    width: 100,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.badge,
  },
  actionButtonLoading: {
    height: 20,
    width: 80,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
  },

  // Player Card Loading
  playerCardContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  playerImageContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  playerImageLoading: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background.accent,
  },
  positionBadgeLoading: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 16,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.xs,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameLoading: {
    height: 20,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    width: '70%',
  },
  playerDetailsLoading: {
    height: 16,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    width: '50%',
  },
  playerStatsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerStatLoading: {
    flex: 1,
    alignItems: 'center',
  },

  // List Item Loading
  listItemContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.sm,
  },
  listImageLoading: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.accent,
    marginRight: spacing.md,
  },
  listContentLoading: {
    flex: 1,
  },
  listTitleLoading: {
    height: 18,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    width: '70%',
  },
  listSubtitleLoading: {
    height: 14,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    width: '50%',
  },
  listMetaLoading: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  listMetaItemLoading: {
    height: 12,
    width: 40,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
  },
  listChevronLoading: {
    width: 20,
    height: 20,
    backgroundColor: colors.background.accent,
    borderRadius: 4,
  },

  // Grid Item Loading
  gridItemContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    width: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.sm,
  },
  gridImageLoading: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background.accent,
    marginBottom: spacing.sm,
  },
  gridContentLoading: {
    alignItems: 'center',
    width: '100%',
  },
  gridTitleLoading: {
    height: 16,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    width: '80%',
  },
  gridSubtitleLoading: {
    height: 12,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    width: '60%',
  },
  gridRatingLoading: {
    height: 20,
    width: 30,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.xs,
    marginTop: spacing.xs,
  },

  // Lineup Loading
  lineupContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  lineupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.tertiary,
  },
  lineupHeaderInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  formationLoading: {
    height: 16,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    width: '60%',
  },
  pitchLoading: {
    height: 300,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  pitchBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.accent,
  },
  pitchPlayerLoading: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  substitutesLoading: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  substitutesTitle: {
    height: 16,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    width: 100,
    marginBottom: spacing.sm,
  },
  substitutesList: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  substitutePlayerLoading: {
    width: 60,
    height: 80,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.md,
  },

  // Branding Loading
  brandingContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  brandingHero: {
    height: 200,
    position: 'relative',
  },
  brandingBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.accent,
  },
  brandingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  brandingInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  brandingTeamName: {
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    width: '70%',
  },
  brandingNickname: {
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    width: '50%',
  },
  brandingLeague: {
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.sm,
    width: '40%',
  },
  brandingIdentity: {
    padding: spacing.lg,
  },
  brandingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  brandingItem: {
    alignItems: 'center',
    flex: 1,
  },
  brandingIconLoading: {
    width: 20,
    height: 20,
    backgroundColor: colors.background.accent,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  brandingLabelLoading: {
    height: 12,
    width: 60,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xxs,
  },
  brandingValueLoading: {
    height: 16,
    width: 80,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
  },
  brandingJerseys: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  jerseySectionTitle: {
    height: 14,
    width: 80,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  jerseyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  jerseyItem: {
    alignItems: 'center',
  },
  jerseyColorLoading: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.accent,
    marginBottom: spacing.xs,
  },
  jerseyLabelLoading: {
    height: 12,
    width: 30,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
  },

  // Comparison Loading
  comparisonContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.md,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  comparisonPlayerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  comparisonImageLoading: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background.accent,
    marginRight: spacing.md,
  },
  comparisonPlayerInfo: {
    flex: 1,
  },
  comparisonNameLoading: {
    height: 20,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    width: '80%',
  },
  comparisonMetaLoading: {
    height: 14,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    width: '60%',
  },
  comparisonRatingLoading: {
    width: 50,
    height: 50,
    backgroundColor: colors.background.accent,
    borderRadius: 8,
  },
  comparisonAttributes: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.md,
  },
  attributeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  attributeItem: {
    alignItems: 'center',
  },
  attributeValueLoading: {
    height: 18,
    width: 30,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xxs,
  },
  attributeLabelLoading: {
    height: 12,
    width: 25,
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
  },
});