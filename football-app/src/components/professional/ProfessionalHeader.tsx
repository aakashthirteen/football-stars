import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ProfessionalHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  onBack?: () => void;
  onNotifications?: () => void;
  onProfile?: () => void;
  teamBadge?: string;
  competition?: string;
  variant?: 'default' | 'match' | 'team' | 'profile';
  children?: React.ReactNode;
  rightElement?: React.ReactNode;
  profileData?: {
    name: string;
    email: string;
    position?: string;
    avatar?: string;
  };
}

export const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  showNotifications = false,
  showProfile = false,
  onBack,
  onNotifications,
  onProfile,
  teamBadge,
  competition,
  variant = 'default',
  children,
  rightElement,
  profileData,
}) => {
  // Validate profile data if provided
  if (variant === 'profile' && profileData && (!profileData.name || typeof profileData.name !== 'string')) {
    console.warn('ProfessionalHeader: profileData.name is required for profile variant');
  }
  // Fixed heights for consistency - UNIFORM HEADER HEIGHT
  const getHeaderHeight = () => {
    switch (variant) {
      case 'match':
        return 200; // Increased for match content
      case 'profile':
        return 240; // Profile keeps custom height
      default:
        // Home screen gets smaller header, others get standard height
        return subtitle ? 200 : 160; // Home: 160px, Teams/Matches/Tournaments: 200px
    }
  };

  const renderLeftAction = () => {
    if (showBack) {
      return (
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.actionButtonBackground}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </View>
        </TouchableOpacity>
      );
    }
    
    if (teamBadge && variant === 'match') {
      return (
        <View style={styles.teamBadgeContainer}>
          <Image source={{ uri: teamBadge }} style={styles.teamBadge} />
        </View>
      );
    }
    
    return <View style={styles.actionButton} />;
  };

  const renderRightActions = () => {
    if (rightElement) {
      return rightElement;
    }

    if (!showNotifications && !showProfile) {
      return <View style={styles.actionButton} />;
    }

    return (
      <View style={styles.rightActions}>
        {showNotifications && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onNotifications}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.actionButtonBackground}>
              <Ionicons name="notifications-outline" size={22} color={colors.text.primary} />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>2</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        {showProfile && (
          <TouchableOpacity 
            style={[styles.actionButton, { marginLeft: spacing.sm }]} 
            onPress={onProfile}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.actionButtonBackground}>
              <Ionicons name="person-outline" size={22} color={colors.text.primary} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderProfileContent = () => {
    if (variant !== 'profile' || !profileData) return null;

    const getInitials = (name: string) => {
      if (!name || typeof name !== 'string' || !name.trim()) return 'UN';
      try {
        const parts = name.split(' ').filter(part => part && typeof part === 'string' && part.trim().length > 0);
        if (!Array.isArray(parts) || parts.length === 0) return 'UN';
        return parts.map(n => (n && typeof n === 'string' && n[0]) ? n[0] : '').filter(initial => initial && typeof initial === 'string').join('').toUpperCase().substring(0, 2) || 'UN';
      } catch (error) {
        console.error('Error getting initials:', error);
        return 'UN';
      }
    };

    const getPositionColor = (position?: string) => {
      switch (position) {
        case 'GK': return colors.status.error;
        case 'DEF': return colors.accent.blue;
        case 'MID': return colors.primary.main;
        case 'FWD': return colors.accent.orange;
        default: return colors.primary.main;
      }
    };

    return (
      <View style={styles.profileContent}>
        <View style={styles.avatarContainer}>
          {profileData.avatar ? (
            <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: getPositionColor(profileData.position) }]}>
              <Text style={styles.avatarText}>{getInitials(profileData.name)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.profileName}>{profileData.name}</Text>
        <Text style={styles.profileEmail}>{profileData.email}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { height: getHeaderHeight() }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Dark gradient background */}
      <LinearGradient
        colors={[colors.background.secondary, colors.background.primary]}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Subtle pattern overlay */}
      <View style={styles.patternOverlay} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Navigation Bar */}
        <View style={styles.navigationBar}>
          {renderLeftAction()}
          {competition && variant === 'match' && (
            <View style={styles.competitionBadge}>
              <Ionicons name="trophy" size={14} color={colors.text.secondary} />
              <Text style={styles.competitionText}>{competition}</Text>
            </View>
          )}
          {renderRightActions()}
        </View>
        
        {/* Title Section - for non-profile screens */}
        {(title || subtitle) && variant !== 'profile' && (
          <View style={styles.titleSection}>
            {title && (
              <Text 
                style={[
                  styles.title,
                  variant === 'match' && styles.matchTitle,
                  variant === 'team' && styles.teamTitle,
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        )}
        
        {/* Profile Content */}
        {renderProfileContent()}
        
        {/* Children Content */}
        {children && variant !== 'profile' && (
          <View style={styles.childrenContainer}>
            {children}
          </View>
        )}
      </SafeAreaView>
      
      {/* CONSISTENT VISUAL SEPARATOR - appears at exact same position on all screens */}
      {variant !== 'profile' && (
        <View style={styles.headerSeparator} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  safeArea: {
    flex: 1,
  },
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: Platform.OS === 'ios' ? 0 : spacing.md,
    height: 44,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.status.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.secondary,
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamBadgeContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  teamBadge: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  competitionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badge,
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -50 }],
  },
  competitionText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  matchTitle: {
    fontSize: 28,
    textAlign: 'center',
  },
  teamTitle: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  profileContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.md,
  },
  avatarContainer: {
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.primary.main,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  childrenContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  headerSeparator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});