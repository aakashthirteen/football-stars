import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import HomeStack from './HomeStack';
import TeamsStack from './TeamsStack';
import MatchesStack from './MatchesStack';
import TournamentsStack from './TournamentsStack';
import LeaderboardScreen from '../screens/main/LeaderboardScreen';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Teams') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'football' : 'football-outline';
          } else if (route.name === 'Tournaments') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Leaderboard') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#2E7D32',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Teams" component={TeamsStack} />
      <Tab.Screen name="Matches" component={MatchesStack} />
      <Tab.Screen name="Tournaments" component={TournamentsStack} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}