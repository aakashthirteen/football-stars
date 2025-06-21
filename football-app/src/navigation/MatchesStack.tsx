import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MatchesScreen from '../screens/main/MatchesScreen';
import CreateMatchScreen from '../screens/matches/CreateMatchScreen';
import MatchScoringScreen from '../screens/matches/MatchScoringScreen';
import MatchOverviewScreen from '../screens/matches/MatchOverviewScreen';
import PlayerRatingScreen from '../screens/matches/PlayerRatingScreen';
import MatchSummaryScreen from '../screens/matches/MatchSummaryScreen';
import TeamFormationScreen from '../screens/matches/TeamFormationScreen';
import PreMatchPlanningScreen from '../screens/matches/PreMatchPlanningScreen';

export type MatchesStackParamList = {
  MatchesList: undefined;
  CreateMatch: undefined;
  MatchScoring: { matchId: string; isNewMatch?: boolean; hasFormations?: boolean };
  MatchOverview: { matchId: string };
  PlayerRating: { 
    matchId: string; 
    teamId?: string; 
    teamName?: string;
    homeTeamId?: string;
    homeTeamName?: string;
    awayTeamId?: string;
    awayTeamName?: string;
  };
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
    isPreMatch?: boolean;
    isHomeTeam?: boolean;
    gameFormat?: '5v5' | '7v7' | '11v11';
    onFormationSaved?: (formationData: any) => void;
  };
  PreMatchPlanning: {
    matchId: string;
    homeTeam: any;
    awayTeam: any;
    isNewMatch?: boolean;
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
      <Stack.Screen name="PreMatchPlanning" component={PreMatchPlanningScreen} />
      <Stack.Screen name="MatchScoring" component={MatchScoringScreen} />
      <Stack.Screen name="MatchOverview" component={MatchOverviewScreen} />
      <Stack.Screen name="PlayerRating" component={PlayerRatingScreen} />
      <Stack.Screen name="MatchSummary" component={MatchSummaryScreen} />
      <Stack.Screen name="TeamFormation" component={TeamFormationScreen} />
    </Stack.Navigator>
  );
}