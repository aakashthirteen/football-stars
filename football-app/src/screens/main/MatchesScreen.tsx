import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { FeatureFlags } from '../../config/featureFlags';

// Professional Components
import {
  ProfessionalHeader,
  ProfessionalButton,
  ProfessionalMatchCard,
  DesignSystem,
} from '../../components/professional';

const { colors, typography, spacing, borderRadius, shadows, gradients } = DesignSystem;

interface MatchesScreenProps {
  navigation: any;
}

interface Match {
  id: string;
  homeTeam?: { name: string; id?: string } | null;
  awayTeam?: { name: string; id?: string } | null;
  homeScore?: number;
  awayScore?: number;
  status: string;
  matchDate: string;
  venue?: string;
  createdBy?: string;
}

type TabType = 'all' | 'my' | 'live';

export default function MatchesScreen({ navigation }: MatchesScreenProps) {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, forceUpdate] = useState({});
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [myTeams, setMyTeams] = useState<string[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  // REMOVED: Force re-render causing performance issues
  // Individual match cards now handle their own timer updates efficiently

  const loadData = async () => {
    await loadMatches();
    await loadMyTeams();
  };

  const loadMyTeams = async () => {
    try {
      const response = await apiService.getTeams();
      const teams = response.teams || [];
      const teamIds = (teams || []).map((team: any) => team.id);
      setMyTeams(teamIds);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMatches();
      console.log('🏈 MATCHES_SCREEN: Raw API response:', JSON.stringify(response, null, 2));
      const matchesArray = response.matches || [];
      console.log('🏈 MATCHES_SCREEN: Matches array:', JSON.stringify(matchesArray, null, 2));
      
      const normalizedMatches = (matchesArray || []).map((match: any) => {
        console.log('🏈 MATCHES_SCREEN: Processing match:', JSON.stringify(match, null, 2));
        const normalized = {
          ...match,
          matchDate: match.match_date || match.matchDate,
          homeTeam: match.homeTeam || { 
            name: match.home_team_name, 
            id: match.home_team_id,
            logo_url: match.home_team_logo_url,
            logoUrl: match.home_team_logo_url
          },
          awayTeam: match.awayTeam || { 
            name: match.away_team_name, 
            id: match.away_team_id,
            logo_url: match.away_team_logo_url,
            logoUrl: match.away_team_logo_url
          },
        };
        console.log('🏈 MATCHES_SCREEN: Normalized match:', JSON.stringify(normalized, null, 2));
        return normalized;
      });
      
      const sortedMatches = normalizedMatches.sort((a: any, b: any) => {
        const dateA = new Date(a.matchDate || 0).getTime();
        const dateB = new Date(b.matchDate || 0).getTime();
        return dateB - dateA;
      });
      
      console.log('🏈 MATCHES_SCREEN: Final sorted matches:', JSON.stringify(sortedMatches, null, 2));
      setMatches(sortedMatches);
      
      // Initialize timer service for live matches
      sortedMatches.forEach(match => {
        if (match.status === 'LIVE' || match.status === 'HALFTIME') {
          // Timer will be initialized by ProfessionalMatchCard when it renders
          console.log('🌍 Live match found in MatchesScreen:', match.id, match.status);
        }
      });
    } catch (error: any) {
      console.error('Error loading matches:', error);
      Alert.alert('Error', 'Failed to load matches. Please try again.');
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // OPTIMIZED: Memoized filter function to prevent unnecessary recalculations
  const filteredMatches = useMemo(() => {
    if (!matches || !Array.isArray(matches)) return [];
    
    switch (activeTab) {
      case 'live':
        return matches.filter((match) => match.status === 'LIVE' || match.status === 'HALFTIME');
      case 'my':
        return matches.filter((match) => {
          const isCreator = match.createdBy === user?.id;
          const isInHomeTeam = match.homeTeam?.id && (myTeams || []).includes(match.homeTeam.id);
          const isInAwayTeam = match.awayTeam?.id && (myTeams || []).includes(match.awayTeam.id);
          return isCreator || isInHomeTeam || isInAwayTeam;
        });
      default:
        return matches;
    }
  }, [matches, activeTab, user?.id, myTeams]);

  // OPTIMIZED: Memoized event handler
  const handleMatchPress = useCallback((match: Match) => {
    if (match.status === 'COMPLETED') {
      navigation.navigate('MatchOverview', { matchId: match.id });
    } else {
      navigation.navigate('MatchScoring', { matchId: match.id });
    }
  }, [navigation]);

  const calculateElapsedMinutes = (matchDate: string) => {
    try {
      const startTime = new Date(matchDate);
      const currentTime = new Date();
      const elapsedMs = currentTime.getTime() - startTime.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
      
      // Ensure minimum of 1 minute for live matches
      return Math.max(elapsedMinutes, 1);
    } catch (error) {
      console.error('Error calculating elapsed time:', error);
      return 1;
    }
  };

  const getTabCounts = () => {
    const allCount = matches.length;
    const myCount = matches.filter((match) => {
      const isCreator = match.createdBy === user?.id;
      const isInHomeTeam = match.homeTeam?.id && myTeams.includes(match.homeTeam.id);
      const isInAwayTeam = match.awayTeam?.id && myTeams.includes(match.awayTeam.id);
      return isCreator || isInHomeTeam || isInAwayTeam;
    }).length;
    const liveCount = matches.filter(m => m.status === 'LIVE').length;

    return { allCount, myCount, liveCount };
  };

  const renderTabSelector = () => {
    const { allCount, myCount, liveCount } = getTabCounts();
    
    const tabs = [
      { 
        key: 'all', 
        label: 'All', 
        count: allCount,
        icon: 'football',
        color: colors.accent.blue
      },
      { 
        key: 'my', 
        label: 'Mine', 
        count: myCount,
        icon: 'person',
        color: colors.primary.main
      },
      { 
        key: 'live', 
        label: 'Live', 
        count: liveCount,
        icon: 'radio',
        color: colors.status.live,
        isLive: true
      },
    ];
    
    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as TabType)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={14} 
              color={activeTab === tab.key ? '#FFFFFF' : colors.text.secondary} 
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[
                styles.tabBadge,
                activeTab === tab.key && styles.activeTabBadge,
                tab.isLive && styles.liveTabBadge
              ]}>
                <Text style={[
                  styles.tabCount,
                  activeTab === tab.key && styles.activeTabCount,
                  tab.isLive && styles.liveTabCount
                ]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => {
    const getEmptyConfig = () => {
      switch (activeTab) {
        case 'live':
          return {
            icon: 'radio',
            title: 'No Live Matches',
            subtitle: 'Check back when matches are in progress',
            showButton: false,
          };
        case 'my':
          return {
            icon: 'calendar-outline',
            title: 'No Matches Yet',
            subtitle: 'Create or join a match to see it here',
            showButton: true,
          };
        default:
          return {
            icon: 'football-outline',
            title: 'No Matches Available',
            subtitle: 'Be the first to create a match!',
            showButton: true,
          };
      }
    };

    const { icon, title, subtitle, showButton } = getEmptyConfig();

    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.primary.main }]}>
          <Ionicons name={icon as any} size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
        {showButton && (
          <ProfessionalButton
            title="Create Match"
            icon="add"
            onPress={() => navigation.navigate('CreateMatch')}
            style={styles.emptyButton}
          />
        )}
      </View>
    );
  };

  const renderMatches = () => {
    if (filteredMatches.length === 0) {
      return renderEmptyState();
    }

    return (
      <View style={styles.matchesList}>
        {filteredMatches.map((match) => {
          console.log('🎯 MATCH_CARD_DATA: Processing match for render:', JSON.stringify(match, null, 2));
          const matchCardData = {
            ...match, // This ensures ALL fields are passed
            id: match.id,
            status: (match.status === 'UPCOMING' ? 'SCHEDULED' : match.status) as 'LIVE' | 'SCHEDULED' | 'COMPLETED',
            homeTeam: {
              id: match.homeTeam?.id || 'home',
              name: match.homeTeam?.name || 'Home Team',
              badge: match.homeTeam?.badge || match.homeTeam?.logoUrl || match.homeTeam?.logo_url,
              logoUrl: match.homeTeam?.logoUrl || match.homeTeam?.logo_url || match.homeTeam?.badge,
            },
            awayTeam: {
              id: match.awayTeam?.id || 'away',
              name: match.awayTeam?.name || 'Away Team',
              badge: match.awayTeam?.badge || match.awayTeam?.logoUrl || match.awayTeam?.logo_url,
              logoUrl: match.awayTeam?.logoUrl || match.awayTeam?.logo_url || match.awayTeam?.badge,
            },
            homeScore: match.homeScore || 0,
            awayScore: match.awayScore || 0,
            matchDate: match.matchDate || new Date().toISOString(),
            competition: 'League Match',
            // ADD THESE CRITICAL TIMER FIELDS:
            timer_started_at: match.timer_started_at,
            second_half_started_at: match.second_half_started_at,
            halftime_started_at: match.halftime_started_at,
            current_half: match.current_half,
            duration: match.duration,
            added_time_first_half: match.added_time_first_half,
            added_time_second_half: match.added_time_second_half,
          };
          console.log('🎯 MATCH_CARD_DATA: Final data being passed to ProfessionalMatchCard:', JSON.stringify(matchCardData, null, 2));
          
          return (
            <View key={match.id} style={styles.matchCardWrapper}>
              <ProfessionalMatchCard
                match={matchCardData}
                onPress={() => handleMatchPress(match)}
              />
            </View>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ProfessionalHeader
          title="Matches"
          subtitle="View all matches"
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          title="Matches"
          subtitle="View and manage matches"
          showNotifications
          onNotifications={() => navigation.getParent()?.navigate('Profile')}
        />
        
        {/* Tab Selector */}
        <View style={styles.tabSection}>
          {renderTabSelector()}
        </View>

        {/* Matches List */}
        <View style={styles.matchesSection}>
          {renderMatches()}
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      <FloatingActionButton
        onPress={() => navigation.navigate('CreateMatch')}
        icon="add"
        colors={gradients.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },

  // Professional Tab Section (matching tournament tabs)
  tabSection: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface.glass,
    borderRadius: borderRadius.xl,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: borderRadius.lg,
    gap: 3,
  },
  activeTab: {
    backgroundColor: colors.primary.main,
    ...shadows.sm,
  },
  tabText: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tabBadge: {
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  liveTabBadge: {
    backgroundColor: colors.status.live + '20',
  },
  tabCount: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  activeTabCount: {
    color: '#FFFFFF',
  },
  liveTabCount: {
    color: colors.status.live,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.status.live,
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // Matches Section
  matchesSection: {
    paddingHorizontal: spacing.screenPadding,
  },
  matchesList: {
    gap: spacing.md,
  },
  matchCardWrapper: {
    // Professional match card handles its own styling
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
  emptySubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    marginTop: spacing.sm,
  },

  bottomSpacing: {
    height: 120,
  },
});