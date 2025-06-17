import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MainTabParamList } from '../types';
import HomeStack from './HomeStack';
import TeamsStack from './TeamsStack';
import MatchesStack from './MatchesStack';
import TournamentsStack from './TournamentsStack';
import ProfileStack from './ProfileStack';
import DesignSystem from '../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

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
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          // Add a glow effect for focused icons
          if (focused) {
            return (
              <View style={styles.iconContainer}>
                <View style={[styles.iconGlow, { backgroundColor: color + '20' }]} />
                <Ionicons name={iconName} size={24} color={color} />
              </View>
            );
          }

          return (
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={24} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          paddingHorizontal: spacing.md,
          ...shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: typography.fontWeight.medium,
          marginTop: -2,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView 
              intensity={80} 
              style={StyleSheet.absoluteFillObject}
              tint="dark"
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background.secondary }]} />
          )
        ),
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Teams" 
        component={TeamsStack}
        options={{
          tabBarLabel: 'Teams',
        }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesStack}
        options={{
          tabBarLabel: 'Matches',
          tabBarBadge: undefined, // Can be used for live match count
          tabBarBadgeStyle: {
            backgroundColor: colors.status.live,
            fontSize: typography.fontSize.micro,
            minWidth: 16,
            height: 16,
            lineHeight: 16,
          },
        }}
      />
      <Tab.Screen 
        name="Tournaments" 
        component={TournamentsStack}
        options={{
          tabBarLabel: 'Leagues',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
  },
  iconGlow: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    opacity: 0.5,
  },
});