import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MatchesScreen from '../screens/main/MatchesScreen';
import CreateMatchScreen from '../screens/matches/CreateMatchScreen';
import MatchScoringScreen from '../screens/matches/MatchScoringScreen';
import MatchOverviewScreen from '../screens/matches/MatchOverviewScreen';
import PlayerRatingScreen from '../screens/matches/PlayerRatingScreen';

export type MatchesStackParamList = {
  MatchesList: undefined;
  CreateMatch: undefined;
  MatchScoring: { matchId: string; isNewMatch?: boolean };
  MatchOverview: { matchId: string };
  PlayerRating: { matchId: string };
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
    </Stack.Navigator>
  );
}