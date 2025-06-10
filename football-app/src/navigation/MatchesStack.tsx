import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MatchesScreen from '../screens/main/MatchesScreen';
import CreateMatchScreen from '../screens/matches/CreateMatchScreen';
import MatchScoringScreen from '../screens/matches/MatchScoringScreen';

export type MatchesStackParamList = {
  MatchesList: undefined;
  CreateMatch: undefined;
  MatchScoring: { matchId: string; isNewMatch?: boolean };
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
    </Stack.Navigator>
  );
}