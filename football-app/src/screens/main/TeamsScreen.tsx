import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingActionButton } from '../../components/FloatingActionButton';

// Professional Components
import {
  ProfessionalHeader,
  ProfessionalButton,
  ProfessionalTeamBadge,
  DesignSystem,
} from '../../components/professional';

const { colors, typography, spacing, borderRadius, shadows, gradients } = DesignSystem;
const { width } = Dimensions.get('window');

interface TeamsScreenProps {
  navigation: any;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  players: any[];
  createdBy: string;
}

export default function TeamsScreen({ navigation }: TeamsScreenProps) {
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'my' | 'all'>('my');
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    animateEntrance();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTeams();
      return () => {};
    }, [selectedTab])
  );

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTabChange = (tab: 'my' | 'all') => {
    setSelectedTab(tab);
  };

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      
      const [myTeamsResponse, allTeamsResponse] = await Promise.all([
        apiService.getTeams().catch(() => ({ teams: [] })),
        apiService.getAllTeams().catch(() => ({ teams: [] }))
      ]);
      
      setMyTeams(myTeamsResponse?.teams || []);
      setAllTeams(allTeamsResponse?.teams || []);
      
    } catch (error: any) {
      console.error('Error loading teams:', error);
      Alert.alert('Error', 'Failed to load teams. Please try again.');
      setMyTeams([]);
      setAllTeams([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeams();
  };

  const renderTeamCard = (team: Team, index: number) => {
    const playerCount = team.players?.length || 0;
    const isActive = playerCount > 0;
    
    return (
      <TouchableOpacity
        key={team.id}
        style={styles.teamCard}
        onPress={() => navigation.navigate('TeamDetails', { teamId: team.id })}
        activeOpacity={0.8}
      >
        <View style={styles.teamBadgeSection}>
          <ProfessionalTeamBadge 
            teamName={team.name} 
            badgeUrl={team.logoUrl}
            size="large" 
          />
        </View>
        
        <View style={styles.teamContent}>
          <Text style={styles.teamName} numberOfLines={1}>
            {team.name}
          </Text>
          
          {team.description && (
            <Text style={styles.teamDescription} numberOfLines={1}>
              {team.description}
            </Text>
          )}
          
          <View style={styles.teamStats}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={14} color={colors.text.secondary} />
              <Text style={styles.statText}>{playerCount} players</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statusDot, { backgroundColor: isActive ? colors.status.success : colors.text.tertiary }]} />
              <Text style={[styles.statText, { color: isActive ? colors.status.success : colors.text.tertiary }]}>
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  const renderTabSelector = () => {
    const myCount = myTeams.length;
    const allCount = allTeams.length;
    
    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'my' && styles.activeTab]}
          onPress={() => handleTabChange('my')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'my' && styles.activeTabText]}>
            My Teams
          </Text>
          <View style={[styles.tabBadge, selectedTab === 'my' && styles.activeTabBadge]}>
            <Text style={[styles.tabCount, selectedTab === 'my' && styles.activeTabCount]}>{myCount}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
          onPress={() => handleTabChange('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
            All Teams
          </Text>
          <View style={[styles.tabBadge, selectedTab === 'all' && styles.activeTabBadge]}>
            <Text style={[styles.tabCount, selectedTab === 'all' && styles.activeTabCount]}>{allCount}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.primary.main }]}>
          <Ionicons name="people-outline" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.emptyTitle}>
          {selectedTab === 'my' ? 'No Teams Yet' : 'No Teams Available'}
        </Text>
        <Text style={styles.emptySubtext}>
          {selectedTab === 'my' 
            ? 'Create your first team to organize matches and track stats' 
            : 'Check back later for teams to join'}
        </Text>
        {selectedTab === 'my' && (
          <ProfessionalButton
            title="Create Your First Team"
            icon="add-circle"
            onPress={() => navigation.navigate('CreateTeam')}
            style={styles.createButton}
          />
        )}
      </View>
    );
  };
  
  const renderTeamsList = () => {
    const currentTeams = selectedTab === 'my' ? myTeams : allTeams;
    
    if (currentTeams.length === 0) {
      return renderEmptyState();
    }
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View style={styles.teamsGrid}>
          {currentTeams.map((team, index) => renderTeamCard(team, index))}
        </View>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading teams...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
            colors={[colors.primary.main]}
          />
        }
      >
        {/* Professional Header */}
        <ProfessionalHeader
          title="Teams"
          subtitle="View and manage your teams"
          showNotifications
          onNotifications={() => navigation.getParent()?.navigate('Profile')}
        />
        
        {/* Tab Selector */}
        <View style={styles.tabSection}>
          {renderTabSelector()}
        </View>
        
        {/* Teams List */}
        <View style={styles.teamsSection}>
          {renderTeamsList()}
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Floating Action Button */}
      {selectedTab === 'my' && (
        <FloatingActionButton
          onPress={() => navigation.navigate('CreateTeam')}
          icon="add"
          style={styles.fab}
        />
      )}
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
  
  // Tab Section - La Liga style
  tabSection: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.primary.main,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  activeTabCount: {
    color: '#FFFFFF',
  },
  
  // Teams Section
  teamsSection: {
    paddingHorizontal: spacing.screenPadding,
  },
  teamsGrid: {
    gap: spacing.md,
  },
  
  // Team Card - Modern design
  teamCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    ...shadows.sm,
  },
  teamBadgeSection: {
    marginRight: spacing.md,
  },
  teamContent: {
    flex: 1,
  },
  teamName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  teamDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  teamStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.surface.border,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 1.5,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  createButton: {
    marginTop: spacing.sm,
  },
  
  bottomSpacing: {
    height: 120,
  },
  fab: {
    bottom: 100,
  },
});