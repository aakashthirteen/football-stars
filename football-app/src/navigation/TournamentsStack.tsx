import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TournamentsScreen from '../screens/tournaments/TournamentsScreen';
import CreateTournamentScreen from '../screens/tournaments/CreateTournamentScreen';
import TournamentDetailsScreen from '../screens/tournaments/TournamentDetailsScreen';

export type TournamentsStackParamList = {
  TournamentsMain: undefined;
  CreateTournament: undefined;
  TournamentDetails: { tournamentId: string };
};

const Stack = createStackNavigator<TournamentsStackParamList>();

export default function TournamentsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="TournamentsMain" 
        component={TournamentsScreen}
      />
      <Stack.Screen 
        name="CreateTournament" 
        component={CreateTournamentScreen}
      />
      <Stack.Screen 
        name="TournamentDetails" 
        component={TournamentDetailsScreen}
      />
    </Stack.Navigator>
  );
}