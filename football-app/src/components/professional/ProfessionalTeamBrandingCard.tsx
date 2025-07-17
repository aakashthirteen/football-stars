import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';
import { ProfessionalTeamBadge } from './ProfessionalTeamBadge';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface TeamBrandingInfo {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor?: string;
  pattern?: string;
  jersey?: {
    home: string;
    away: string;
    third?: string;
  };
  stadium?: {
    name: string;
    capacity: number;
    image?: string;
  };
  founded?: number;
  nickname?: string;
  motto?: string;
}

interface ProfessionalTeamBrandingCardProps {
  team: {
    id: string;
    name: string;
    shortName?: string;
    badge?: string;
    league?: string;
    branding: TeamBrandingInfo;
  };
  onPress?: () => void;
  variant?: 'hero' | 'compact' | 'stadium';
  showStadium?: boolean;
  showHistory?: boolean;
}

export const ProfessionalTeamBrandingCard: React.FC<ProfessionalTeamBrandingCardProps> = ({
  team,
  onPress,
  variant = 'hero',
  showStadium = true,
  showHistory = true,
}) => {
  const teamColors = [
    team.branding.primaryColor,
    team.branding.secondaryColor || team.branding.primaryColor,
  ];

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          { borderColor: team.branding.primaryColor + '40' }
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={teamColors}
          style={styles.compactGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.compactContent}>
            <ProfessionalTeamBadge
              teamName={team.name}
              badgeUrl={team.badge}
              size="medium"
              variant="minimal"
            />
            <View style={styles.compactInfo}>
              <Text style={styles.compactTeamName}>{team.shortName || team.name}</Text>
              {team.league && (
                <Text style={styles.compactLeague}>{team.league}</Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'stadium' && team.branding.stadium) {
    return (
      <TouchableOpacity
        style={styles.stadiumContainer}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {team.branding.stadium.image ? (
          <ImageBackground
            source={{ uri: team.branding.stadium.image }}
            style={styles.stadiumBackground}
            imageStyle={styles.stadiumImage}
          >
            <LinearGradient
              colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.8)']}
              style={styles.stadiumOverlay}
            >
              <View style={styles.stadiumContent}>
                <View style={styles.stadiumHeader}>
                  <ProfessionalTeamBadge
                    teamName={team.name}
                    badgeUrl={team.badge}
                    size="large"
                  />
                  <View style={styles.stadiumInfo}>
                    <Text style={styles.stadiumTeamName}>{team.name}</Text>
                    <Text style={styles.stadiumName}>{team.branding.stadium.name}</Text>
                    <Text style={styles.stadiumCapacity}>
                      Capacity: {team.branding.stadium.capacity.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        ) : (
          <View style={[styles.stadiumBackground, { backgroundColor: team.branding.backgroundColor || colors.background.tertiary }]}>
            <View style={styles.stadiumContent}>
              <View style={styles.stadiumHeader}>
                <ProfessionalTeamBadge
                  teamName={team.name}
                  badgeUrl={team.badge}
                  size="large"
                />
                <View style={styles.stadiumInfo}>
                  <Text style={[styles.stadiumTeamName, { color: colors.text.primary }]}>{team.name}</Text>
                  <Text style={[styles.stadiumName, { color: colors.text.secondary }]}>{team.branding.stadium.name}</Text>
                  <Text style={[styles.stadiumCapacity, { color: colors.text.tertiary }]}>
                    Capacity: {team.branding.stadium.capacity.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Hero variant (default)
  return (
    <TouchableOpacity
      style={styles.heroContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={teamColors}
        style={styles.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Pattern overlay */}
        <View style={styles.patternOverlay} />
        
        {/* Header */}
        <View style={styles.heroHeader}>
          <ProfessionalTeamBadge
            teamName={team.name}
            badgeUrl={team.badge}
            size="xlarge"
            variant="detailed"
          />
          <View style={styles.heroInfo}>
            <Text style={styles.heroTeamName}>{team.name}</Text>
            {team.branding.nickname && (
              <Text style={styles.heroNickname}>"{team.branding.nickname}"</Text>
            )}
            {team.league && (
              <Text style={styles.heroLeague}>{team.league}</Text>
            )}
          </View>
        </View>

        {/* Team Identity Section */}
        <View style={styles.identitySection}>
          <View style={styles.identityRow}>
            {team.branding.founded && (
              <View style={styles.identityItem}>
                <Ionicons name="calendar" size={20} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.identityLabel}>Founded</Text>
                <Text style={styles.identityValue}>{team.branding.founded}</Text>
              </View>
            )}
            
            {team.branding.stadium && (
              <View style={styles.identityItem}>
                <Ionicons name="business" size={20} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.identityLabel}>Stadium</Text>
                <Text style={styles.identityValue}>{team.branding.stadium.name}</Text>
              </View>
            )}
          </View>
          
          {team.branding.motto && (
            <View style={styles.mottoContainer}>
              <Text style={styles.motto}>"{team.branding.motto}"</Text>
            </View>
          )}
        </View>

        {/* Jersey Colors */}
        {team.branding.jersey && (
          <View style={styles.jerseySection}>
            <Text style={styles.jerseySectionTitle}>Kit Colors</Text>
            <View style={styles.jerseyRow}>
              <View style={styles.jerseyItem}>
                <View style={[
                  styles.jerseyColor,
                  { backgroundColor: team.branding.jersey.home }
                ]} />
                <Text style={styles.jerseyLabel}>Home</Text>
              </View>
              
              <View style={styles.jerseyItem}>
                <View style={[
                  styles.jerseyColor,
                  { backgroundColor: team.branding.jersey.away }
                ]} />
                <Text style={styles.jerseyLabel}>Away</Text>
              </View>
              
              {team.branding.jersey.third && (
                <View style={styles.jerseyItem}>
                  <View style={[
                    styles.jerseyColor,
                    { backgroundColor: team.branding.jersey.third }
                  ]} />
                  <Text style={styles.jerseyLabel}>Third</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.heroFooter}>
          <View style={styles.actionButton}>
            <Text style={styles.actionText}>Explore Team</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Compact variant
  compactContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 2,
    ...shadows.sm,
  },
  compactGradient: {
    padding: spacing.md,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  compactTeamName: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xxs,
  },
  compactLeague: {
    fontSize: typography.fontSize.small,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Stadium variant
  stadiumContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    height: 200,
    ...shadows.lg,
  },
  stadiumBackground: {
    flex: 1,
  },
  stadiumImage: {
    borderRadius: borderRadius.xl,
  },
  stadiumOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  stadiumContent: {
    padding: spacing.lg,
  },
  stadiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stadiumInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  stadiumTeamName: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xxs,
  },
  stadiumName: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.xxs,
  },
  stadiumCapacity: {
    fontSize: typography.fontSize.small,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Hero variant
  heroContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  heroGradient: {
    padding: spacing.lg,
    minHeight: 300,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: '#FFFFFF',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  heroTeamName: {
    fontSize: typography.fontSize.title1,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  heroNickname: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  heroLeague: {
    fontSize: typography.fontSize.small,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.semibold,
  },

  // Identity section
  identitySection: {
    marginBottom: spacing.xl,
  },
  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  identityItem: {
    alignItems: 'center',
    flex: 1,
  },
  identityLabel: {
    fontSize: typography.fontSize.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: spacing.xs,
    marginBottom: spacing.xxs,
    textTransform: 'uppercase',
  },
  identityValue: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  mottoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#FFFFFF',
  },
  motto: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.medium,
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Jersey section
  jerseySection: {
    marginBottom: spacing.xl,
  },
  jerseySectionTitle: {
    fontSize: typography.fontSize.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.semibold,
  },
  jerseyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  jerseyItem: {
    alignItems: 'center',
  },
  jerseyColor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  jerseyLabel: {
    fontSize: typography.fontSize.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeight.medium,
  },

  // Footer
  heroFooter: {
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionText: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginRight: spacing.sm,
  },
});