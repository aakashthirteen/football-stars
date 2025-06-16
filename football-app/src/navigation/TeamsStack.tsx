import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TeamsScreen from '../screens/main/TeamsScreen';
import CreateTeamScreen from '../screens/teams/CreateTeamScreen';
import TeamDetailsScreen from '../screens/teams/TeamDetailsScreen';
import AddPlayerScreen from '../screens/teams/AddPlayerScreen';
import TeamFormationScreen from '../screens/matches/TeamFormationScreen';

export type TeamsStackParamList = {
  TeamsList: undefined;
  CreateTeam: undefined;
  TeamDetails: { teamId: string };
  AddPlayer: { teamId: string; teamName: string };
  TeamFormation: { 
    teamId: string; 
    teamName: string; 
    matchId?: string; 
    isPreMatch?: boolean;
    isHomeTeam?: boolean;
    gameFormat?: '5v5' | '7v7' | '11v11';
    fromMatch?: boolean;
  };
};

const Stack = createStackNavigator<TeamsStackParamList>();

export default function TeamsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="TeamsList" component={TeamsScreen} />
      <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
      <Stack.Screen name="TeamDetails" component={TeamDetailsScreen} />
      <Stack.Screen name="AddPlayer" component={AddPlayerScreen} />
      <Stack.Screen name="TeamFormation" component={TeamFormationScreen} />
    </Stack.Navigator>
  );
}