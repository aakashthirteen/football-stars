/**
 * Professional Card Components Usage Examples
 * 
 * This file demonstrates how to use the enhanced team and player card components
 * for different use cases throughout the football app.
 */

import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import {
  ProfessionalTeamCard,
  ProfessionalPlayerCard,
  ProfessionalTeamBrandingCard,
  ProfessionalLineupCard,
  ProfessionalCardLoadingStates,
} from './index';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing } = DesignSystem;

// Example data
const exampleTeam = {
  id: '1',
  name: 'Manchester United',
  shortName: 'MAN UTD',
  description: 'The Red Devils',
  players: [
    { id: '1', name: 'Marcus Rashford', position: 'FWD', role: 'CAPTAIN' },
    { id: '2', name: 'Bruno Fernandes', position: 'MID' },
    { id: '3', name: 'Harry Maguire', position: 'DEF' },
  ],
  badge: 'https://example.com/mu-badge.png',
  primaryColor: '#DA020E',
  secondaryColor: '#FFE500',
  league: 'Premier League',
  founded: 1878,
  stats: {
    wins: 15,
    draws: 8,
    losses: 5,
    goals_for: 45,
    goals_against: 28,
    points: 53,
    matches_played: 28,
    form: ['W', 'L', 'W', 'W', 'D'] as ('W' | 'D' | 'L')[],
    league_position: 3,
    clean_sheets: 12,
  },
  rating: 82.5,
  branding: {
    primaryColor: '#DA020E',
    secondaryColor: '#FFE500',
    backgroundColor: '#1a1a1a',
    jersey: {
      home: '#DA020E',
      away: '#FFFFFF',
      third: '#000000',
    },
    stadium: {
      name: 'Old Trafford',
      capacity: 74140,
      image: 'https://example.com/old-trafford.jpg',
    },
    founded: 1878,
    nickname: 'The Red Devils',
    motto: 'Youth, Courage, Greatness',
  },
};

const examplePlayer = {
  id: '1',
  name: 'Marcus Rashford',
  firstName: 'Marcus',
  lastName: 'Rashford',
  position: 'LW',
  jerseyNumber: 10,
  role: 'CAPTAIN',
  image: 'https://example.com/rashford.jpg',
  age: 26,
  nationality: 'England',
  height: '1.80m',
  weight: '70kg',
  preferred_foot: 'Right' as const,
  market_value: 75000000,
  contract_until: '2028-06-30',
  stats: {
    goals: 15,
    assists: 8,
    matches: 28,
    cards: 3,
    clean_sheets: 0,
    pass_accuracy: 82,
    tackles: 24,
    interceptions: 18,
    dribbles: 45,
    shots_on_target: 38,
    minutes_played: 2520,
  },
  rating: {
    overall: 84,
    pace: 88,
    shooting: 82,
    passing: 79,
    dribbling: 85,
    defending: 45,
    physical: 78,
  },
  form: ['W', 'W', 'L', 'W', 'D'] as ('W' | 'D' | 'L')[],
  injury_status: 'Fit' as const,
  team: {
    name: 'Manchester United',
    badge: 'https://example.com/mu-badge.png',
    primaryColor: '#DA020E',
  },
};

const exampleLineupPlayers = [
  { id: '1', name: 'David de Gea', firstName: 'David', jerseyNumber: 1, position: 'GK', rating: 85, x: 50, y: 90, isCaptain: false },
  { id: '2', name: 'Aaron Wan-Bissaka', firstName: 'Aaron', jerseyNumber: 29, position: 'RB', rating: 78, x: 80, y: 70, isCaptain: false },
  { id: '3', name: 'Harry Maguire', firstName: 'Harry', jerseyNumber: 5, position: 'CB', rating: 79, x: 65, y: 75, isCaptain: false },
  { id: '4', name: 'Raphael Varane', firstName: 'Raphael', jerseyNumber: 19, position: 'CB', rating: 84, x: 35, y: 75, isCaptain: false },
  { id: '5', name: 'Luke Shaw', firstName: 'Luke', jerseyNumber: 23, position: 'LB', rating: 81, x: 20, y: 70, isCaptain: false },
  { id: '6', name: 'Casemiro', firstName: 'Casemiro', jerseyNumber: 18, position: 'CDM', rating: 87, x: 50, y: 55, isCaptain: false },
  { id: '7', name: 'Bruno Fernandes', firstName: 'Bruno', jerseyNumber: 8, position: 'CAM', rating: 86, x: 50, y: 40, isCaptain: true },
  { id: '8', name: 'Antony', firstName: 'Antony', jerseyNumber: 21, position: 'RW', rating: 77, x: 75, y: 35, isCaptain: false },
  { id: '9', name: 'Marcus Rashford', firstName: 'Marcus', jerseyNumber: 10, position: 'LW', rating: 84, x: 25, y: 35, isCaptain: false },
  { id: '10', name: 'Wout Weghorst', firstName: 'Wout', jerseyNumber: 27, position: 'ST', rating: 76, x: 50, y: 20, isCaptain: false },
  { id: '11', name: 'Jadon Sancho', firstName: 'Jadon', jerseyNumber: 25, position: 'LW', rating: 80, x: 35, y: 25, isCaptain: false },
];

const exampleFormation = {
  name: '4-2-3-1',
  positions: {
    GK: { x: 50, y: 90 },
    RB: { x: 80, y: 70 },
    CB1: { x: 65, y: 75 },
    CB2: { x: 35, y: 75 },
    LB: { x: 20, y: 70 },
    CDM1: { x: 40, y: 55 },
    CDM2: { x: 60, y: 55 },
    CAM: { x: 50, y: 40 },
    RW: { x: 75, y: 35 },
    LW: { x: 25, y: 35 },
    ST: { x: 50, y: 20 },
  },
};

export const CardUsageExamples: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Professional Card Components</Text>
      <Text style={styles.subtitle}>Usage Examples for Football App</Text>

      {/* Team Card Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Cards</Text>
        
        {/* Default Team Card */}
        <Text style={styles.exampleTitle}>Default Team Card</Text>
        <ProfessionalTeamCard
          team={exampleTeam}
          onPress={() => console.log('Team pressed')}
          showStats={true}
          showForm={true}
        />

        {/* Compact Team Card */}
        <Text style={styles.exampleTitle}>Compact Team Card</Text>
        <View style={styles.row}>
          <ProfessionalTeamCard
            team={exampleTeam}
            onPress={() => console.log('Team pressed')}
            variant="compact"
          />
          <ProfessionalTeamCard
            team={{ ...exampleTeam, name: 'Arsenal FC', shortName: 'ARS' }}
            onPress={() => console.log('Team pressed')}
            variant="compact"
          />
          <ProfessionalTeamCard
            team={{ ...exampleTeam, name: 'Chelsea FC', shortName: 'CHE' }}
            onPress={() => console.log('Team pressed')}
            variant="compact"
          />
        </View>

        {/* List Team Card */}
        <Text style={styles.exampleTitle}>List Team Card</Text>
        <ProfessionalTeamCard
          team={exampleTeam}
          onPress={() => console.log('Team pressed')}
          variant="list"
          showStats={true}
          showForm={true}
        />

        {/* Grid Team Card */}
        <Text style={styles.exampleTitle}>Grid Team Cards</Text>
        <View style={styles.gridRow}>
          <ProfessionalTeamCard
            team={exampleTeam}
            onPress={() => console.log('Team pressed')}
            variant="grid"
            showStats={true}
          />
          <ProfessionalTeamCard
            team={{ ...exampleTeam, name: 'Liverpool FC', shortName: 'LIV' }}
            onPress={() => console.log('Team pressed')}
            variant="grid"
            showStats={true}
          />
        </View>

        {/* Loading Team Card */}
        <Text style={styles.exampleTitle}>Loading Team Card</Text>
        <ProfessionalTeamCard
          team={exampleTeam}
          onPress={() => console.log('Team pressed')}
          loading={true}
        />
      </View>

      {/* Player Card Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Player Cards</Text>
        
        {/* Default Player Card */}
        <Text style={styles.exampleTitle}>Default Player Card</Text>
        <ProfessionalPlayerCard
          player={examplePlayer}
          onPress={() => console.log('Player pressed')}
          showStats={true}
          showRating={true}
        />

        {/* Compact Player Card */}
        <Text style={styles.exampleTitle}>Compact Player Cards</Text>
        <View style={styles.row}>
          <ProfessionalPlayerCard
            player={examplePlayer}
            onPress={() => console.log('Player pressed')}
            variant="compact"
            showRating={true}
          />
          <ProfessionalPlayerCard
            player={{ ...examplePlayer, name: 'Bruno Fernandes', position: 'MID', jerseyNumber: 8 }}
            onPress={() => console.log('Player pressed')}
            variant="compact"
            showRating={true}
          />
          <ProfessionalPlayerCard
            player={{ ...examplePlayer, name: 'Harry Maguire', position: 'DEF', jerseyNumber: 5 }}
            onPress={() => console.log('Player pressed')}
            variant="compact"
            showRating={true}
          />
        </View>

        {/* List Player Card */}
        <Text style={styles.exampleTitle}>List Player Card</Text>
        <ProfessionalPlayerCard
          player={examplePlayer}
          onPress={() => console.log('Player pressed')}
          variant="list"
          showStats={true}
          showRating={true}
          showTeam={true}
        />

        {/* Grid Player Cards */}
        <Text style={styles.exampleTitle}>Grid Player Cards</Text>
        <View style={styles.gridRow}>
          <ProfessionalPlayerCard
            player={examplePlayer}
            onPress={() => console.log('Player pressed')}
            variant="grid"
            showStats={true}
            showRating={true}
          />
          <ProfessionalPlayerCard
            player={{ ...examplePlayer, name: 'Bruno Fernandes', position: 'MID' }}
            onPress={() => console.log('Player pressed')}
            variant="grid"
            showStats={true}
            showRating={true}
          />
        </View>

        {/* Comparison Player Card */}
        <Text style={styles.exampleTitle}>Comparison Player Card</Text>
        <ProfessionalPlayerCard
          player={examplePlayer}
          variant="comparison"
          showRating={true}
          showTeam={true}
        />

        {/* Selectable Player Cards */}
        <Text style={styles.exampleTitle}>Selectable Player Cards</Text>
        <View style={styles.row}>
          <ProfessionalPlayerCard
            player={examplePlayer}
            variant="compact"
            selectable={true}
            selected={true}
            onSelect={(id) => console.log('Selected player:', id)}
            showRating={true}
          />
          <ProfessionalPlayerCard
            player={{ ...examplePlayer, name: 'Bruno Fernandes', id: '2' }}
            variant="compact"
            selectable={true}
            selected={false}
            onSelect={(id) => console.log('Selected player:', id)}
            showRating={true}
          />
        </View>
      </View>

      {/* Team Branding Card Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Branding Cards</Text>
        
        {/* Hero Branding Card */}
        <Text style={styles.exampleTitle}>Hero Branding Card</Text>
        <ProfessionalTeamBrandingCard
          team={exampleTeam}
          onPress={() => console.log('Branding pressed')}
          variant="hero"
          showStadium={true}
          showHistory={true}
        />

        {/* Compact Branding Card */}
        <Text style={styles.exampleTitle}>Compact Branding Card</Text>
        <ProfessionalTeamBrandingCard
          team={exampleTeam}
          onPress={() => console.log('Branding pressed')}
          variant="compact"
        />

        {/* Stadium Branding Card */}
        <Text style={styles.exampleTitle}>Stadium Branding Card</Text>
        <ProfessionalTeamBrandingCard
          team={exampleTeam}
          onPress={() => console.log('Branding pressed')}
          variant="stadium"
        />
      </View>

      {/* Lineup Card Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lineup Cards</Text>
        
        {/* Full Lineup Card */}
        <Text style={styles.exampleTitle}>Full Lineup Card</Text>
        <ProfessionalLineupCard
          team={exampleTeam}
          players={exampleLineupPlayers}
          formation={exampleFormation}
          substitutes={exampleLineupPlayers.slice(0, 7)}
          onPlayerPress={(player) => console.log('Player pressed:', player.name)}
          variant="full"
          showSubstitutes={true}
          showRatings={true}
          editable={false}
        />

        {/* Tactical Lineup Card */}
        <Text style={styles.exampleTitle}>Tactical Lineup Card</Text>
        <ProfessionalLineupCard
          team={exampleTeam}
          players={exampleLineupPlayers}
          formation={exampleFormation}
          onPlayerPress={(player) => console.log('Player pressed:', player.name)}
          variant="tactical"
          showRatings={true}
        />

        {/* Compact Lineup Card */}
        <Text style={styles.exampleTitle}>Compact Lineup Card</Text>
        <ProfessionalLineupCard
          team={exampleTeam}
          players={exampleLineupPlayers}
          formation={exampleFormation}
          variant="compact"
        />
      </View>

      {/* Loading States Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loading States</Text>
        
        <Text style={styles.exampleTitle}>Team Card Loading</Text>
        <ProfessionalCardLoadingStates variant="team" showLabels={true} />

        <Text style={styles.exampleTitle}>Player Card Loading</Text>
        <ProfessionalCardLoadingStates variant="player" showLabels={true} />

        <Text style={styles.exampleTitle}>List Items Loading</Text>
        <ProfessionalCardLoadingStates variant="list" count={3} showLabels={true} />

        <Text style={styles.exampleTitle}>Grid Items Loading</Text>
        <View style={styles.gridRow}>
          <ProfessionalCardLoadingStates variant="grid" count={2} />
        </View>

        <Text style={styles.exampleTitle}>Lineup Loading</Text>
        <ProfessionalCardLoadingStates variant="lineup" showLabels={true} />

        <Text style={styles.exampleTitle}>Branding Loading</Text>
        <ProfessionalCardLoadingStates variant="branding" showLabels={true} />

        <Text style={styles.exampleTitle}>Comparison Loading</Text>
        <ProfessionalCardLoadingStates variant="comparison" showLabels={true} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.screenPadding,
  },
  title: {
    fontSize: typography.fontSize.title1,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.main,
    paddingBottom: spacing.sm,
  },
  exampleTitle: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
});