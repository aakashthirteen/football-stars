import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import AchievementsScreen from '../screens/main/AchievementsScreen';
import ConnectionsScreen from '../screens/main/ConnectionsScreen';
import DebugScreen from '../screens/main/DebugScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Achievements: undefined;
  Connections: undefined;
  Debug: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
      />
      <Stack.Screen 
        name="Achievements" 
        component={AchievementsScreen}
      />
      <Stack.Screen 
        name="Connections" 
        component={ConnectionsScreen}
      />
      <Stack.Screen 
        name="Debug" 
        component={DebugScreen}
      />
    </Stack.Navigator>
  );
}