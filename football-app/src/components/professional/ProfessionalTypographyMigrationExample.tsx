/**
 * Typography Migration Example
 * 
 * This file demonstrates how to migrate from the old typography system
 * to the new professional typography system. It shows before/after
 * examples and best practices for using the new components.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  H1Text,
  H2Text,
  H3Text,
  BodyText,
  BodyBoldText,
  CaptionText,
  LabelText,
  ScoreMainText,
  TimerText,
  TeamNameText,
  PlayerNameText,
  StatValueText,
  StatLabelText,
  LiveIndicatorText,
  CompetitionText,
  MatchEventText,
} from './ProfessionalText';
import DesignSystem from '../../theme/designSystem';

const { colors, spacing, borderRadius } = DesignSystem;

export const ProfessionalTypographyMigrationExample: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <H1Text align="center">Typography Migration</H1Text>
        <CaptionText align="center" color={colors.text.secondary}>
          Before & After Examples
        </CaptionText>
      </View>

      {/* Before & After Sections */}
      
      {/* Match Card Example */}
      <View style={styles.section}>
        <H2Text>Match Card</H2Text>
        
        {/* OLD WAY */}
        <View style={styles.exampleCard}>
          <LabelText>❌ OLD WAY (Don't use)</LabelText>
          <View style={styles.oldMatchCard}>
            <Text style={styles.oldCompetition}>PREMIER LEAGUE</Text>
            
            <View style={styles.oldMatchContent}>
              <View style={styles.oldTeam}>
                <Text style={styles.oldTeamName}>Manchester United</Text>
                <Text style={styles.oldScore}>3</Text>
              </View>
              
              <View style={styles.oldTimer}>
                <Text style={styles.oldTimerText}>FT</Text>
              </View>
              
              <View style={styles.oldTeam}>
                <Text style={styles.oldTeamName}>Liverpool</Text>
                <Text style={styles.oldScore}>1</Text>
              </View>
            </View>
            
            <Text style={styles.oldVenue}>Old Trafford • Yesterday</Text>
          </View>
        </View>

        {/* NEW WAY */}
        <View style={styles.exampleCard}>
          <LabelText>✅ NEW WAY (Recommended)</LabelText>
          <View style={styles.newMatchCard}>
            <CompetitionText>Premier League</CompetitionText>
            
            <View style={styles.newMatchContent}>
              <View style={styles.newTeam}>
                <TeamNameText>Manchester United</TeamNameText>
                <ScoreMainText>3</ScoreMainText>
              </View>
              
              <View style={styles.newTimer}>
                <TimerText>FT</TimerText>
              </View>
              
              <View style={styles.newTeam}>
                <TeamNameText>Liverpool</TeamNameText>
                <ScoreMainText>1</ScoreMainText>
              </View>
            </View>
            
            <CaptionText align="center" color={colors.text.secondary}>
              Old Trafford • Yesterday
            </CaptionText>
          </View>
        </View>
      </View>

      {/* Player Stats Example */}
      <View style={styles.section}>
        <H2Text>Player Statistics</H2Text>
        
        {/* OLD WAY */}
        <View style={styles.exampleCard}>
          <LabelText>❌ OLD WAY</LabelText>
          <View style={styles.oldPlayerCard}>
            <Text style={styles.oldPlayerName}>Cristiano Ronaldo</Text>
            
            <View style={styles.oldStatsContainer}>
              <View style={styles.oldStatItem}>
                <Text style={styles.oldStatValue}>15</Text>
                <Text style={styles.oldStatLabel}>GOALS</Text>
              </View>
              <View style={styles.oldStatItem}>
                <Text style={styles.oldStatValue}>8</Text>
                <Text style={styles.oldStatLabel}>ASSISTS</Text>
              </View>
              <View style={styles.oldStatItem}>
                <Text style={styles.oldStatValue}>28</Text>
                <Text style={styles.oldStatLabel}>MATCHES</Text>
              </View>
            </View>
          </View>
        </View>

        {/* NEW WAY */}
        <View style={styles.exampleCard}>
          <LabelText>✅ NEW WAY</LabelText>
          <View style={styles.newPlayerCard}>
            <PlayerNameText align="center">Cristiano Ronaldo</PlayerNameText>
            
            <View style={styles.newStatsContainer}>
              <View style={styles.newStatItem}>
                <StatValueText>15</StatValueText>
                <StatLabelText>Goals</StatLabelText>
              </View>
              <View style={styles.newStatItem}>
                <StatValueText>8</StatValueText>
                <StatLabelText>Assists</StatLabelText>
              </View>
              <View style={styles.newStatItem}>
                <StatValueText>28</StatValueText>
                <StatLabelText>Matches</StatLabelText>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Live Match Example */}
      <View style={styles.section}>
        <H2Text>Live Match</H2Text>
        
        {/* OLD WAY */}
        <View style={styles.exampleCard}>
          <LabelText>❌ OLD WAY</LabelText>
          <View style={styles.oldLiveCard}>
            <View style={styles.oldLiveIndicator}>
              <Text style={styles.oldLiveText}>LIVE</Text>
            </View>
            <Text style={styles.oldLiveTimer}>75'</Text>
            <Text style={styles.oldEvent}>Goal by Marcus Rashford (75')</Text>
          </View>
        </View>

        {/* NEW WAY */}
        <View style={styles.exampleCard}>
          <LabelText>✅ NEW WAY</LabelText>
          <View style={styles.newLiveCard}>
            <View style={styles.newLiveIndicator}>
              <LiveIndicatorText>LIVE</LiveIndicatorText>
            </View>
            <TimerText color={colors.status.live.main}>75'</TimerText>
            <MatchEventText>Goal by Marcus Rashford (75')</MatchEventText>
          </View>
        </View>
      </View>

      {/* Content Hierarchy Example */}
      <View style={styles.section}>
        <H2Text>Content Hierarchy</H2Text>
        
        <View style={styles.exampleCard}>
          <H3Text>Page Title (H3)</H3Text>
          <BodyText style={styles.spacedText}>
            This is body text that provides detailed information about the content.
            It's easy to read and properly spaced for optimal readability.
          </BodyText>
          
          <BodyBoldText style={styles.spacedText}>
            This is bold body text for emphasis within the content.
          </BodyBoldText>
          
          <CaptionText style={styles.spacedText}>
            This is caption text for additional information, metadata, or image captions.
          </CaptionText>
        </View>
      </View>

      {/* Migration Benefits */}
      <View style={styles.section}>
        <H2Text>Migration Benefits</H2Text>
        
        <View style={styles.benefitsCard}>
          <H3Text color={colors.semantic.success.main}>✅ Benefits</H3Text>
          
          <BodyText style={styles.benefit}>
            • <BodyBoldText>Consistent Typography:</BodyBoldText> All text follows the same professional standards
          </BodyText>
          
          <BodyText style={styles.benefit}>
            • <BodyBoldText>Accessibility:</BodyBoldText> WCAG AA compliant contrast ratios and font sizes
          </BodyText>
          
          <BodyText style={styles.benefit}>
            • <BodyBoldText>Responsive Design:</BodyBoldText> Text automatically scales for different screen sizes
          </BodyText>
          
          <BodyText style={styles.benefit}>
            • <BodyBoldText>Performance:</BodyBoldText> Optimized font loading and rendering
          </BodyText>
          
          <BodyText style={styles.benefit}>
            • <BodyBoldText>Maintainability:</BodyBoldText> Easy to update typography across the entire app
          </BodyText>
          
          <BodyText style={styles.benefit}>
            • <BodyBoldText>Sports-Specific:</BodyBoldText> Components designed for football app needs
          </BodyText>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  exampleCard: {
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  benefitsCard: {
    backgroundColor: colors.semantic.success.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.semantic.success.border,
  },
  benefit: {
    marginBottom: spacing.sm,
  },
  spacedText: {
    marginTop: spacing.sm,
  },

  // OLD STYLES (examples of what NOT to do)
  oldMatchCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  oldCompetition: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  oldMatchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  oldTeam: {
    flex: 1,
    alignItems: 'center',
  },
  oldTeamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: spacing.xs,
  },
  oldScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  oldTimer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  oldTimerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  oldVenue: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  oldPlayerCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  oldPlayerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  oldStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  oldStatItem: {
    alignItems: 'center',
  },
  oldStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  oldStatLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
    marginTop: spacing.xs,
  },
  oldLiveCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  oldLiveIndicator: {
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
    marginBottom: spacing.sm,
  },
  oldLiveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  oldLiveTimer: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: spacing.xs,
  },
  oldEvent: {
    fontSize: 14,
    color: '#666',
  },

  // NEW STYLES (recommended approach)
  newMatchCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  newMatchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  newTeam: {
    flex: 1,
    alignItems: 'center',
  },
  newTimer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  newPlayerCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  newStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  newStatItem: {
    alignItems: 'center',
  },
  newLiveCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  newLiveIndicator: {
    backgroundColor: colors.status.live.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
    marginBottom: spacing.sm,
  },
});

export default ProfessionalTypographyMigrationExample;