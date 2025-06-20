import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ProfessionalTeamBadgeProps {
  teamName?: string;
  teamShortName?: string;
  badgeUrl?: string;
  badgeSource?: ImageSourcePropType;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showName?: boolean;
  variant?: 'default' | 'minimal' | 'detailed';
  teamColor?: string;
}

export const ProfessionalTeamBadge: React.FC<ProfessionalTeamBadgeProps> = ({
  teamName,
  teamShortName,
  badgeUrl,
  badgeSource,
  size = 'medium',
  showName = false,
  variant = 'default',
  teamColor,
}) => {
  // Early validation - allow empty team names as they'll fallback to 'TBD'
  if (!teamName && !teamShortName && !badgeUrl && !badgeSource) {
    console.warn('ProfessionalTeamBadge: At least one of teamName, teamShortName, badgeUrl, or badgeSource should be provided');
  }
  // Remove verbose logging to reduce console noise
  // console.log('🏆 TEAM_BADGE: Rendering badge for team:', teamName);
  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'medium':
        return 48;
      case 'large':
        return 64;
      case 'xlarge':
        return 80;
      default:
        return 48;
    }
  };

  const badgeSize = getSizeValue();
  const fontSize = badgeSize * 0.35;
  
  // Ensure teamName is a string before using split
  const getInitials = () => {
    if (teamShortName && typeof teamShortName === 'string' && teamShortName.trim()) {
      return teamShortName.substring(0, 3).toUpperCase();
    }
    
    // Safe fallback for teamName
    const name = (typeof teamName === 'string' && teamName.trim()) ? teamName : 'TBD';
    
    try {
      // Extra safety for the split and map operations
      const words = name.split(' ').filter(word => word && typeof word === 'string' && word.length > 0);
      if (!Array.isArray(words) || words.length === 0) {
        return 'TBD';
      }
      return words.map(word => (word && typeof word === 'string' && word[0]) ? word[0] : '').filter(initial => initial).join('').substring(0, 3).toUpperCase() || 'TBD';
    } catch (error) {
      console.warn('Error generating team initials:', error);
      return 'TBD';
    }
  };
  
  const initials = getInitials();

  const renderBadgeContent = () => {
    if (badgeUrl || badgeSource) {
      return (
        <Image 
          source={badgeSource || { uri: badgeUrl }}
          style={[
            styles.badgeImage,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2, // Make the image itself circular and fill entire badge
            }
          ]}
          resizeMode="cover"
        />
      );
    }

    // Fallback to initials
    return (
      <LinearGradient
        colors={teamColor 
          ? [teamColor, adjustColor(teamColor, -20)] 
          : [colors.background.accent, colors.background.tertiary]
        }
        style={styles.gradientBackground}
      >
        <Text style={[styles.initials, { fontSize }]}>
          {initials}
        </Text>
      </LinearGradient>
    );
  };

  const adjustColor = (color: string, amount: number) => {
    // Simple color adjustment function
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  if (variant === 'minimal') {
    return (
      <View 
        style={[
          styles.badgeContainer,
          styles.minimalBadge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
          }
        ]}
      >
        {renderBadgeContent()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.badgeContainer,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
          },
          variant === 'detailed' && styles.detailedBadge,
        ]}
      >
        {renderBadgeContent()}
      </View>
      
      {showName && (
        <Text 
          style={[
            styles.teamName,
            { fontSize: badgeSize * 0.25 }
          ]}
          numberOfLines={1}
        >
          {teamName || 'Unknown Team'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  minimalBadge: {
    borderWidth: 1,
    backgroundColor: colors.background.tertiary,
  },
  detailedBadge: {
    ...shadows.md,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeImage: {
    resizeMode: 'contain',
  },
  initials: {
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  teamName: {
    marginTop: spacing.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});