import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing } = DesignSystem;

interface ProfessionalMiniEventProps {
  eventType: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD';
  playerName: string;
  minute: number;
}

export const ProfessionalMiniEvent: React.FC<ProfessionalMiniEventProps> = ({
  eventType,
  playerName,
  minute,
}) => {
  console.log('🎪 Rendering MiniEvent:', { eventType, playerName, minute });
  
  const getEventStyle = () => {
    switch (eventType) {
      case 'GOAL':
        return {
          icon: '⚽',
          color: colors.primary.main,
        };
      case 'YELLOW_CARD':
        return {
          icon: '🟨',
          color: colors.semantic.warning,
        };
      case 'RED_CARD':
        return {
          icon: '🟥',
          color: colors.semantic.error,
        };
    }
  };

  const style = getEventStyle();

  return (
    <View style={styles.container}>
      <Text style={styles.minute}>
        {minute}'
      </Text>
      <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">
        {playerName}
      </Text>
      <Text style={styles.icon}>{style.icon}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 2,
    // Improved spacing and removed strict constraints
  },
  minute: {
    fontSize: 10,
    color: '#888',
    minWidth: 22,
    textAlign: 'left',
    marginRight: 6,
  },
  playerName: {
    fontSize: 11,
    color: colors.text.secondary,
    flex: 1, // This ensures the name takes all available space
    marginRight: 6,
    lineHeight: 14, // Better line height for readability
  },
  icon: {
    fontSize: 12,
    marginLeft: 2,
  },
});