import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/main/HomeScreen';
import PlayerDiscoveryScreen from '../screens/main/PlayerDiscoveryScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  PlayerDiscovery: undefined;
  SkillsUpload: undefined;
  Training: undefined;
  Notifications: undefined;
};

const Stack = createStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
      />
      <Stack.Screen 
        name="PlayerDiscovery" 
        component={PlayerDiscoveryScreen}
      />
    </Stack.Navigator>
  );
}