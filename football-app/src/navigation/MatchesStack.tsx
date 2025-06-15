import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MatchesScreen from '../screens/main/MatchesScreen';
import CreateMatchScreen from '../screens/matches/CreateMatchScreen';
import MatchScoringScreen from '../screens/matches/MatchScoringScreen';
import MatchOverviewScreen from '../screens/matches/MatchOverviewScreen';
import PlayerRatingScreen from '../screens/matches/PlayerRatingScreen';
import MatchSummaryScreen from '../screens/matches/MatchSummaryScreen';
import TeamFormationScreen from '../screens/matches/TeamFormationScreen';

export type MatchesStackParamList = {
  MatchesList: undefined;
  CreateMatch: undefined;
  MatchScoring: { matchId: string; isNewMatch?: boolean };
  MatchOverview: { matchId: string };
  PlayerRating: { matchId: string; teamId: string; teamName: string };
  MatchSummary: { 
    matchId: string; 
    teamId?: string; 
    teamName?: string; 
    ratings?: any; 
    ratingsSummary?: any; 
  };
  TeamFormation: { 
    teamId: string; 
    teamName: string; 
    matchId?: string; 
  };
};

const Stack = createStackNavigator<MatchesStackParamList>();

export default function MatchesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MatchesList" component={MatchesScreen} />
      <Stack.Screen name="CreateMatch" component={CreateMatchScreen} />
      <Stack.Screen name="MatchScoring" component={MatchScoringScreen} />
      <Stack.Screen name="MatchOverview" component={MatchOverviewScreen} />
      <Stack.Screen name="PlayerRating" component={PlayerRatingScreen} />
      <Stack.Screen name="MatchSummary" component={MatchSummaryScreen} />
      <Stack.Screen name="TeamFormation" component={TeamFormationScreen} />
    </Stack.Navigator>
  );
}