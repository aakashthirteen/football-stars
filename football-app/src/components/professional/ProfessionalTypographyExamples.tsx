/**
 * Professional Typography Examples & Usage Guide
 * 
 * This file demonstrates how to use the professional typography system
 * in various contexts throughout the Football Stars app. It serves as both
 * documentation and a testing ground for typography components.
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  HeroText,
  Display1Text,
  Display2Text,
  H1Text,
  H2Text,
  H3Text,
  H4Text,
  H5Text,
  H6Text,
  BodyLargeText,
  BodyText,
  BodySmallText,
  BodyBoldText,
  CaptionText,
  CaptionBoldText,
  LabelText,
  LabelSmallText,
  ButtonPrimaryText,
  ButtonSecondaryText,
  ButtonSmallText,
  ScoreMainText,
  ScoreSecondaryText,
  TimerText,
  TimerLargeText,
  StatValueText,
  StatLabelText,
  TeamNameText,
  TeamNameLargeText,
  PlayerNameText,
  PlayerNameLargeText,
  MatchEventText,
  LiveIndicatorText,
  CompetitionText,
  PositionText,
} from './ProfessionalText';
import DesignSystem from '../../theme/designSystem';

const { colors, spacing, borderRadius } = DesignSystem;

// Section wrapper component
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <H3Text color={colors.text.primary} style={styles.sectionTitle}>
      {title}
    </H3Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

// Example card wrapper
const ExampleCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.exampleCard}>
    <LabelText style={styles.exampleTitle}>
      {title}
    </LabelText>
    <View style={styles.exampleContent}>
      {children}
    </View>
  </View>
);

export const ProfessionalTypographyExamples: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero & Display Text Examples */}
      <Section title="Hero & Display Text">
        <ExampleCard title="Hero Text">
          <HeroText align="center">
            Champions League
          </HeroText>
        </ExampleCard>
        
        <ExampleCard title="Display 1">
          <Display1Text align="center">
            Manchester United
          </Display1Text>
        </ExampleCard>
        
        <ExampleCard title="Display 2">
          <Display2Text align="center">
            Premier League
          </Display2Text>
        </ExampleCard>
      </Section>

      {/* Heading Hierarchy Examples */}
      <Section title="Heading Hierarchy">
        <ExampleCard title="H1 - Main Page Title">
          <H1Text>
            Match Overview
          </H1Text>
        </ExampleCard>
        
        <ExampleCard title="H2 - Section Header">
          <H2Text>
            Team Statistics
          </H2Text>
        </ExampleCard>
        
        <ExampleCard title="H3 - Subsection">
          <H3Text>
            Player Performance
          </H3Text>
        </ExampleCard>
        
        <ExampleCard title="H4 - Card Title">
          <H4Text>
            Recent Matches
          </H4Text>
        </ExampleCard>
        
        <ExampleCard title="H5 - Small Header">
          <H5Text>
            Last 5 Games
          </H5Text>
        </ExampleCard>
        
        <ExampleCard title="H6 - Micro Header">
          <H6Text>
            Formation
          </H6Text>
        </ExampleCard>
      </Section>

      {/* Body Text Examples */}
      <Section title="Body Text">
        <ExampleCard title="Body Large">
          <BodyLargeText>
            This is important content that needs emphasis. Perfect for key information and highlights.
          </BodyLargeText>
        </ExampleCard>
        
        <ExampleCard title="Body Regular">
          <BodyText>
            This is the standard body text used throughout the application. It provides excellent readability and is optimized for longer content.
          </BodyText>
        </ExampleCard>
        
        <ExampleCard title="Body Small">
          <BodySmallText>
            This is smaller body text used for secondary information, descriptions, and supplementary content.
          </BodySmallText>
        </ExampleCard>
        
        <ExampleCard title="Body Bold">
          <BodyBoldText>
            This is bold body text for emphasis within paragraphs and important statements.
          </BodyBoldText>
        </ExampleCard>
      </Section>

      {/* Caption & Label Examples */}
      <Section title="Captions & Labels">
        <ExampleCard title="Caption">
          <CaptionText>
            Image caption or additional information
          </CaptionText>
        </ExampleCard>
        
        <ExampleCard title="Caption Bold">
          <CaptionBoldText>
            Important caption or metadata
          </CaptionBoldText>
        </ExampleCard>
        
        <ExampleCard title="Label">
          <LabelText>
            Field Label
          </LabelText>
        </ExampleCard>
        
        <ExampleCard title="Label Small">
          <LabelSmallText>
            Micro Label
          </LabelSmallText>
        </ExampleCard>
      </Section>

      {/* Button Text Examples */}
      <Section title="Button Text">
        <ExampleCard title="Primary Button">
          <View style={styles.buttonPrimary}>
            <ButtonPrimaryText>
              Start Match
            </ButtonPrimaryText>
          </View>
        </ExampleCard>
        
        <ExampleCard title="Secondary Button">
          <View style={styles.buttonSecondary}>
            <ButtonSecondaryText>
              View Details
            </ButtonSecondaryText>
          </View>
        </ExampleCard>
        
        <ExampleCard title="Small Button">
          <View style={styles.buttonSmall}>
            <ButtonSmallText>
              Edit
            </ButtonSmallText>
          </View>
        </ExampleCard>
      </Section>

      {/* Sports-Specific Typography */}
      <Section title="Sports Typography">
        {/* Score Display */}
        <ExampleCard title="Score Display">
          <View style={styles.scoreContainer}>
            <View style={styles.scoreTeam}>
              <TeamNameText align="center">Manchester United</TeamNameText>
              <ScoreMainText>3</ScoreMainText>
            </View>
            
            <View style={styles.scoreVs}>
              <TimerText>45'</TimerText>
            </View>
            
            <View style={styles.scoreTeam}>
              <TeamNameText align="center">Liverpool</TeamNameText>
              <ScoreMainText>1</ScoreMainText>
            </View>
          </View>
        </ExampleCard>

        {/* Live Match Status */}
        <ExampleCard title="Live Match Status">
          <View style={styles.liveContainer}>
            <View style={styles.liveIndicator}>
              <LiveIndicatorText>LIVE</LiveIndicatorText>
            </View>
            <TimerLargeText color={colors.status.live.main}>75'</TimerLargeText>
          </View>
        </ExampleCard>

        {/* Player Statistics */}
        <ExampleCard title="Player Statistics">
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <StatValueText>15</StatValueText>
              <StatLabelText>Goals</StatLabelText>
            </View>
            <View style={styles.statItem}>
              <StatValueText>8</StatValueText>
              <StatLabelText>Assists</StatLabelText>
            </View>
            <View style={styles.statItem}>
              <StatValueText>28</StatValueText>
              <StatLabelText>Matches</StatLabelText>
            </View>
            <View style={styles.statItem}>
              <StatValueText>2</StatValueText>
              <StatLabelText>Cards</StatLabelText>
            </View>
          </View>
        </ExampleCard>

        {/* Player Card */}
        <ExampleCard title="Player Information">
          <View style={styles.playerCard}>
            <PlayerNameLargeText>Cristiano Ronaldo</PlayerNameLargeText>
            <PositionText color={colors.semantic.info.main}>CF</PositionText>
            <CaptionText>32 years • Portugal</CaptionText>
          </View>
        </ExampleCard>

        {/* Match Events */}
        <ExampleCard title="Match Events">
          <View style={styles.eventsContainer}>
            <MatchEventText>15' - Goal by Marcus Rashford</MatchEventText>
            <MatchEventText>23' - Yellow card for Henderson</MatchEventText>
            <MatchEventText>45' - Substitution: Fernandes in</MatchEventText>
          </View>
        </ExampleCard>

        {/* Competition Header */}
        <ExampleCard title="Competition">
          <View style={styles.competitionContainer}>
            <CompetitionText>Premier League 2023/24</CompetitionText>
            <CaptionText>Matchday 15</CaptionText>
          </View>
        </ExampleCard>

        {/* Table Position */}
        <ExampleCard title="League Table">
          <View style={styles.tableRow}>
            <PositionText>1</PositionText>
            <TeamNameText style={styles.tableTeam}>Manchester City</TeamNameText>
            <StatValueText style={styles.tablePoints}>45</StatValueText>
          </View>
        </ExampleCard>
      </Section>

      {/* Color Variations */}
      <Section title="Color Variations">
        <ExampleCard title="Text Colors">
          <BodyText color={colors.text.primary}>Primary text color</BodyText>
          <BodyText color={colors.text.secondary}>Secondary text color</BodyText>
          <BodyText color={colors.text.tertiary}>Tertiary text color</BodyText>
          <BodyText color={colors.primary.main}>Primary brand color</BodyText>
          <BodyText color={colors.secondary.main}>Secondary brand color</BodyText>
          <BodyText color={colors.semantic.success.main}>Success color</BodyText>
          <BodyText color={colors.semantic.error.main}>Error color</BodyText>
          <BodyText color={colors.semantic.warning.main}>Warning color</BodyText>
        </ExampleCard>
      </Section>

      {/* Text Alignment Examples */}
      <Section title="Text Alignment">
        <ExampleCard title="Alignment Options">
          <BodyText align="left">Left aligned text</BodyText>
          <BodyText align="center">Center aligned text</BodyText>
          <BodyText align="right">Right aligned text</BodyText>
        </ExampleCard>
      </Section>

      {/* Responsive Examples */}
      <Section title="Responsive Typography">
        <ExampleCard title="Auto-scaling Text">
          <BodyText responsive={true}>
            This text automatically scales based on screen size for optimal readability.
          </BodyText>
        </ExampleCard>
        
        <ExampleCard title="Fixed Size Text">
          <BodyText responsive={false}>
            This text maintains a fixed size regardless of screen dimensions.
          </BodyText>
        </ExampleCard>
      </Section>

      {/* Accessibility Examples */}
      <Section title="Accessibility Features">
        <ExampleCard title="Enhanced Accessibility">
          <BodyText accessible={true}>
            This text uses enhanced accessibility features including minimum font sizes and improved line heights for better readability.
          </BodyText>
        </ExampleCard>
      </Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionContent: {
    gap: spacing.md,
  },
  exampleCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  exampleTitle: {
    marginBottom: spacing.sm,
    color: colors.text.tertiary,
  },
  exampleContent: {
    gap: spacing.xs,
  },
  
  // Button styles for examples
  buttonPrimary: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    alignItems: 'center',
  },
  buttonSmall: {
    backgroundColor: colors.secondary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
  },
  
  // Sports-specific example styles
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  scoreTeam: {
    flex: 1,
    alignItems: 'center',
  },
  scoreVs: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  liveIndicator: {
    backgroundColor: colors.status.live.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badge,
  },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  
  playerCard: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  
  eventsContainer: {
    gap: spacing.sm,
  },
  
  competitionContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tableTeam: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tablePoints: {
    minWidth: 40,
    textAlign: 'center',
  },
});

export default ProfessionalTypographyExamples;