import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const GlobalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  
  // Cards with Stadium Effect
  stadiumCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: Colors.glow.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  
  // Glow Effects
  glowGreen: {
    shadowColor: Colors.glow.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  
  glowGold: {
    shadowColor: Colors.glow.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  
  // Typography
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.glow.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  
  primaryButtonText: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Field Pattern Background
  fieldPattern: {
    backgroundColor: Colors.primary.main,
    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 30,
  round: 999,
};