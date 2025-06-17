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
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, G, Circle, Text as SvgText } from 'react-native-svg';

// Professional Components
import {
  ProfessionalButton,
  DesignSystem
} from '../../components/professional';

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
  jerseyNumber?: string;
  level?: number;
  totalScore?: number;
  appearances?: number;
  goals?: number;
  assists?: number;
  winRate?: number;
  dailyStreaks?: number;
}

// Jersey SVG Component
const JerseySVG = ({ number, name }: { number: string; name: string }) => {
  return (
    <Svg width={width * 0.6} height={width * 0.7} viewBox="0 0 240 280">
      <Defs>
        <SvgLinearGradient id="jerseyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#00E568" stopOpacity="1" />
          <Stop offset="100%" stopColor="#00B348" stopOpacity="1" />
        </SvgLinearGradient>
        <SvgLinearGradient id="sleeveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#00C458" stopOpacity="1" />
          <Stop offset="100%" stopColor="#00A040" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      
      {/* Jersey Body */}
      <Path
        d="M 60 40 
           L 60 20 
           Q 60 10 70 10 
           L 90 10 
           Q 95 10 95 15 
           L 95 25 
           Q 120 20 145 25 
           L 145 15 
           Q 145 10 150 10 
           L 170 10 
           Q 180 10 180 20 
           L 180 40 
           L 200 60 
           L 200 80 
           L 180 70 
           L 180 240 
           Q 180 250 170 250 
           L 70 250 
           Q 60 250 60 240 
           L 60 70 
           L 40 80 
           L 40 60 
           L 60 40"
        fill="url(#jerseyGradient)"
        stroke="#009038"
        strokeWidth="2"
      />
      
      {/* Left Sleeve */}
      <Path
        d="M 60 40 L 40 60 L 40 80 L 60 70"
        fill="url(#sleeveGradient)"
        stroke="#009038"
        strokeWidth="2"
      />
      
      {/* Right Sleeve */}
      <Path
        d="M 180 40 L 200 60 L 200 80 L 180 70"
        fill="url(#sleeveGradient)"
        stroke="#009038"
        strokeWidth="2"
      />
      
      {/* Collar */}
      <Path
        d="M 95 25 Q 120 20 145 25"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        opacity="0.3"
      />
      
      {/* Jersey Number */}
      <SvgText
        x="120"
        y="140"
        fontSize="60"
        fontWeight="bold"
        fill="#FFFFFF"
        textAnchor="middle"
        fontFamily="System"
      >
        {number}
      </SvgText>
      
      {/* Player Name */}
      <SvgText
        x="120"
        y="90"
        fontSize="18"
        fontWeight="600"
        fill="#FFFFFF"
        textAnchor="middle"
        fontFamily="System"
        letterSpacing="2"
      >
        {name.toUpperCase()}
      </SvgText>
      
      {/* Decorative Lines */}
      <Path
        d="M 60 180 L 180 180"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        opacity="0.1"
      />
      <Path
        d="M 60 200 L 180 200"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        opacity="0.1"
      />
    </Svg>
  );
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      if (user) {
        setProfile({
          name: user.name || 'Unknown Player',
          email: user.email || '',
          position: 'MID',
          jerseyNumber: '10',
          level: 7,
          totalScore: 2856,
          appearances: 28,
          goals: 71,
          assists: 8,
          winRate: 78,
          dailyStreaks: 14,
          bio: 'Passionate football player looking to improve my game and connect with fellow players.',
          joinedDate: '2024-01-15',
          profileImage: undefined,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
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

  const renderProfileCard = () => {
    if (!profile) return null;

    return (
      <View style={styles.profileCard}>
        <LinearGradient
          colors={[colors.primary.dark, colors.primary.main]}
          style={styles.cardGradient}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>MY UNITED</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                <Ionicons name="share-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ marginLeft: spacing.lg }}>
                <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Jersey Container */}
          <View style={styles.jerseyContainer}>
            <JerseySVG 
              number={profile.jerseyNumber || '10'} 
              name={profile.name.split(' ').pop() || 'PLAYER'} 
            />
            
            {/* Profile Picture Overlay */}
            <View style={styles.profilePictureContainer}>
              <View style={styles.profilePicture}>
                {profile.profileImage ? (
                  <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
                ) : (
                  <Text style={styles.profileInitials}>{getInitials(profile.name)}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Level Badge */}
          <View style={styles.levelBadge}>
            <Ionicons name="star" size={16} color="#FFFFFF" />
            <Text style={styles.levelText}>LEVEL {profile.level}</Text>
          </View>

          {/* Fan Status */}
          <View style={styles.fanStatus}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
            <Text style={styles.fanStatusText}>FOOTBALL STARS FAN</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>DAILY STREAKS</Text>
              <Text style={styles.statValue}>{profile.dailyStreaks}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>TOTAL SCORE</Text>
              <Text style={styles.statValue}>{profile.totalScore}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>APPEARANCES</Text>
              <Text style={styles.statValue}>{profile.appearances}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.primaryActionButton} onPress={() => navigation.navigate('CreateTeam')}>
            <Text style={styles.primaryActionText}>GET OFFICIAL MEMBERSHIP</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryActionButton} onPress={() => navigation.navigate('Teams')}>
            <Text style={styles.secondaryActionText}>BUY SHIRT</Text>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard}>
              <LinearGradient
                colors={[colors.surface.secondary, colors.surface.primary]}
                style={styles.quickActionGradient}
              >
                <Ionicons name="ticket-outline" size={24} color={colors.text.primary} />
                <Text style={styles.quickActionTitle}>MY TICKETS</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard}>
              <LinearGradient
                colors={[colors.surface.secondary, colors.surface.primary]}
                style={styles.quickActionGradient}
              >
                <Ionicons name="location-outline" size={24} color={colors.text.primary} />
                <Text style={styles.quickActionTitle}>STADIUM</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderDetailedStats = () => {
    if (!profile) return null;

    return (
      <View style={styles.detailedStatsSection}>
        <Text style={styles.sectionTitle}>Performance Stats</Text>
        
        <View style={styles.performanceGrid}>
          <View style={styles.performanceCard}>
            <View style={[styles.performanceIcon, { backgroundColor: colors.primary.main + '20' }]}>
              <Ionicons name="football" size={20} color={colors.primary.main} />
            </View>
            <Text style={styles.performanceValue}>{profile.goals}</Text>
            <Text style={styles.performanceLabel}>Goals</Text>
          </View>
          
          <View style={styles.performanceCard}>
            <View style={[styles.performanceIcon, { backgroundColor: colors.accent.blue + '20' }]}>
              <Ionicons name="trending-up" size={20} color={colors.accent.blue} />
            </View>
            <Text style={styles.performanceValue}>{profile.assists}</Text>
            <Text style={styles.performanceLabel}>Assists</Text>
          </View>
          
          <View style={styles.performanceCard}>
            <View style={[styles.performanceIcon, { backgroundColor: colors.accent.gold + '20' }]}>
              <Ionicons name="trophy" size={20} color={colors.accent.gold} />
            </View>
            <Text style={styles.performanceValue}>{profile.winRate}%</Text>
            <Text style={styles.performanceLabel}>Win Rate</Text>
          </View>
        </View>
      </View>
    );
  };

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
        {/* Main Profile Card */}
        {renderProfileCard()}
        
        {/* Detailed Stats */}
        {renderDetailedStats()}
        
        {/* Account Actions */}
        <View style={styles.accountSection}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.status.error} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
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
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },

  // Profile Card
  profileCard: {
    marginHorizontal: spacing.screenPadding,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface.primary,
    ...shadows.lg,
  },
  cardGradient: {
    paddingTop: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Jersey
  jerseyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    position: 'relative',
  },
  profilePictureContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  profileImage: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  profileInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary.main,
  },

  // Level & Status
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
  fanStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  fanStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Action Buttons
  actionButtonsContainer: {
    padding: spacing.lg,
  },
  primaryActionButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  secondaryActionButton: {
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickActionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },

  // Detailed Stats
  detailedStatsSection: {
    padding: spacing.screenPadding,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  performanceGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  performanceCard: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  performanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  performanceLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },

  // Account Section
  accountSection: {
    padding: spacing.screenPadding,
    marginTop: spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.primary,
    borderWidth: 1.5,
    borderColor: colors.status.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    gap: spacing.xs,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.status.error,
  },
  bottomSpacing: {
    height: spacing.xxxl,
  },
});