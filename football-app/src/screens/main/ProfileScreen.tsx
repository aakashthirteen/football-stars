import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Professional Components
import {
  ProfessionalButton,
  DesignSystem
} from '../../components/professional';

import { ImagePickerComponent } from '../../components';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;
const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  navigation: any;
}

interface UserProfile {
  name: string;
  email: string;
  position: string;
  bio?: string;
  joinedDate: string;
  profileImage?: string;
  jerseyNumber?: number;
  level?: number;
  totalScore?: number;
  appearances?: number;
  goals?: number;
  assists?: number;
  dailyStreak?: number;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileImage, setProfileImage] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      if (user) {
        const userProfile = {
          name: user.name || 'Unknown Player',
          email: user.email || '',
          position: 'MID',
          bio: 'Passionate football player looking to improve my game and connect with fellow players.',
          joinedDate: '2024-01-15',
          profileImage: undefined,
          jerseyNumber: 10,
          level: 13,
          totalScore: 2300,
          appearances: 28,
          goals: 71,
          assists: 8,
          dailyStreak: 14,
        };
        setProfile(userProfile);
        // Load saved profile image if exists
        if (userProfile.profileImage) {
          setProfileImage(userProfile.profileImage);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelected = async (imageUri: string) => {
    try {
      setProfileImage(imageUri);
      
      // Update profile state
      if (profile) {
        setProfile({
          ...profile,
          profileImage: imageUri
        });
      }
      
      // Here you would typically upload to your backend
      // await apiService.uploadProfileImage(imageUri);
      
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile photo. Please try again.');
    }
  };

  const getPositionColor = (position?: string) => {
    switch (position) {
      case 'GK': return colors.status.error;
      case 'DEF': return colors.accent.blue;
      case 'MID': return colors.primary.main;
      case 'FWD': return colors.accent.orange;
      default: return colors.text.secondary;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
          },
          style: 'destructive',
        },
      ],
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { profile });
  };

  const renderJerseyCard = () => {
    const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
      <View style={styles.jerseyCard}>
        <LinearGradient
          colors={[colors.primary.main, colors.primary.dark]}
          style={styles.jerseyGradient}
        >
          {/* Header Actions */}
          <View style={styles.jerseyHeader}>
            <Text style={styles.jerseyTitle}>FOOTBALL STARS</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="share-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Jersey Display */}
          <View style={styles.jerseyDisplay}>
            <View style={styles.jersey}>
              {/* Jersey Shape */}
              <View style={styles.jerseyShape}>
                <Text style={styles.jerseyName}>{profile?.name?.split(' ').pop()?.toUpperCase()}</Text>
                <Text style={styles.jerseyNumber}>{profile?.jerseyNumber || 10}</Text>
              </View>
              
              {/* Profile Photo */}
              <View style={styles.profilePhotoContainer}>
                <ImagePickerComponent
                  onImageSelected={handleImageSelected}
                  currentImage={profileImage || profile?.profileImage}
                  placeholder="Add Photo"
                  size="large"
                  type="avatar"
                  style={styles.profileImagePicker}
                />
              </View>
            </View>

            {/* Level Badge */}
            <View style={styles.levelBadge}>
              <Ionicons name="star" size={16} color="#FFFFFF" />
              <Text style={styles.levelText}>LEVEL {profile?.level || 1}</Text>
            </View>

            {/* Position Badge */}
            <View style={styles.positionBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.positionText}>{profile?.position} PLAYER</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>DAILY STREAK</Text>
              <Text style={styles.statValue}>{profile?.dailyStreak || 0}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>TOTAL SCORE</Text>
              <Text style={styles.statValue}>{profile?.totalScore || 0}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>APPEARANCES</Text>
              <Text style={styles.statValue}>{profile?.appearances || 0}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity style={styles.primaryButton} onPress={handleEditProfile}>
        <LinearGradient
          colors={[colors.primary.main, colors.primary.dark]}
          style={styles.buttonGradient}
        >
          <Text style={styles.primaryButtonText}>EDIT PROFILE</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('MyStats')}>
        <Text style={styles.secondaryButtonText}>VIEW STATS</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuickStats = () => (
    <View style={styles.quickStats}>
      <View style={styles.quickStatCard}>
        <LinearGradient
          colors={['rgba(0, 215, 87, 0.15)', 'rgba(0, 215, 87, 0.05)']}
          style={styles.quickStatGradient}
        >
          <Ionicons name="football" size={32} color={colors.primary.main} />
          <Text style={styles.quickStatValue}>{profile?.goals || 0}</Text>
          <Text style={styles.quickStatLabel}>Goals</Text>
        </LinearGradient>
      </View>
      
      <View style={styles.quickStatCard}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)']}
          style={styles.quickStatGradient}
        >
          <Ionicons name="trending-up" size={32} color={colors.accent.blue} />
          <Text style={styles.quickStatValue}>{profile?.assists || 0}</Text>
          <Text style={styles.quickStatLabel}>Assists</Text>
        </LinearGradient>
      </View>
    </View>
  );

  const renderMenuItems = () => (
    <View style={styles.menuSection}>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Teams')}>
        <View style={styles.menuIcon}>
          <Ionicons name="people" size={24} color={colors.primary.main} />
        </View>
        <Text style={styles.menuText}>My Teams</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Matches')}>
        <View style={styles.menuIcon}>
          <Ionicons name="football" size={24} color={colors.accent.blue} />
        </View>
        <Text style={styles.menuText}>Match History</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Tournaments')}>
        <View style={styles.menuIcon}>
          <Ionicons name="trophy" size={24} color={colors.accent.gold} />
        </View>
        <Text style={styles.menuText}>Tournaments</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
        <View style={styles.menuIcon}>
          <Ionicons name="settings" size={24} color={colors.text.secondary} />
        </View>
        <Text style={styles.menuText}>Settings</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Jersey Card */}
        {renderJerseyCard()}
        
        {/* Action Buttons */}
        {renderActionButtons()}
        
        {/* Quick Stats */}
        {renderQuickStats()}
        
        {/* Menu Items */}
        {renderMenuItems()}
        
        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.status.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 44, // Account for status bar
  },
  
  // Jersey Card
  jerseyCard: {
    margin: spacing.screenPadding,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  jerseyGradient: {
    padding: spacing.lg,
  },
  jerseyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  jerseyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jerseyDisplay: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  jersey: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  jerseyShape: {
    width: 140,
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadows.md,
  },
  jerseyName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.dark,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  jerseyNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary.dark,
    lineHeight: 48,
  },
  profilePhotoContainer: {
    position: 'absolute',
    bottom: -30,
    alignSelf: 'center',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profilePhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  profileImagePicker: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
    borderStyle: 'solid',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badge,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  positionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginHorizontal: -spacing.lg,
    marginBottom: -spacing.lg,
    padding: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Action Buttons
  actionButtons: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  primaryButton: {
    borderRadius: borderRadius.button,
    overflow: 'hidden',
    ...shadows.md,
  },
  buttonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: colors.surface.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  
  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  quickStatGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginVertical: spacing.xs,
  },
  quickStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  
  // Menu Items
  menuSection: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.status.error,
  },
  
  bottomSpacing: {
    height: spacing.xxxl,
  },
});