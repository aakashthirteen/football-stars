import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { MatchCard } from '../../components/MatchCard';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { Colors, Gradients } from '../../theme/colors';

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
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [myTeams, setMyTeams] = useState<string[]>([]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      animateEntrance();
      loadData();
    }, [])
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

  const loadData = async () => {
    await loadMatches();
    await loadMyTeams();
  };

  const loadMyTeams = async () => {
    try {
      const response = await apiService.getTeams();
      const teams = response.teams || [];
      const teamIds = teams.map((team: any) => team.id);
      setMyTeams(teamIds);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMatches();
      const matchesArray = response.matches || [];
      
      // Sort matches by date (newest first)
      const sortedMatches = matchesArray.sort((a: any, b: any) => {
        const dateA = new Date(a.matchDate || 0).getTime();
        const dateB = new Date(b.matchDate || 0).getTime();
        return dateB - dateA;
      });
      
      setMatches(sortedMatches);
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

  const getFilteredMatches = () => {
    switch (activeTab) {
      case 'live':
        return matches.filter((match) => match.status === 'LIVE');
      case 'my':
        return matches.filter((match) => {
          const isCreator = match.createdBy === user?.id;
          const isInHomeTeam = match.homeTeam?.id && myTeams.includes(match.homeTeam.id);
          const isInAwayTeam = match.awayTeam?.id && myTeams.includes(match.awayTeam.id);
          return isCreator || isInHomeTeam || isInAwayTeam;
        });
      default:
        return matches;
    }
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    
    // Animate tab indicator
    const toValue = tab === 'all' ? 0 : tab === 'my' ? 1 : 2;
    Animated.spring(tabIndicatorAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={Gradients.field}
        style={styles.headerGradient}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Matches</Text>
          <Text style={styles.headerSubtitle}>
            {matches.length} {matches.length === 1 ? 'match' : 'matches'} available
          </Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => switchTab('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Matches
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => switchTab('my')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            My Matches
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab]}
          onPress={() => switchTab('live')}
          activeOpacity={0.7}
        >
          <View style={styles.liveTabContent}>
            <Text style={[styles.tabText, activeTab === 'live' && styles.activeTabText]}>
              Live
            </Text>
            {matches.filter(m => m.status === 'LIVE').length > 0 && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>
                  {matches.filter(m => m.status === 'LIVE').length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Animated Indicator */}
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              transform: [{
                translateX: tabIndicatorAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [0, 360 / 3, (360 / 3) * 2],
                }),
              }],
            },
          ]}
        />
      </View>
    </Animated.View>
  );

  const renderMatch = ({ item, index }: { item: Match; index: number }) => (
    <MatchCard
      match={item}
      onPress={() => navigation.navigate('MatchScoring', { matchId: item.id })}
      style={{ marginTop: index === 0 ? 16 : 0 }}
    />
  );

  const renderEmptyState = () => {
    const getEmptyMessage = () => {
      switch (activeTab) {
        case 'live':
          return {
            icon: 'radio',
            title: 'No Live Matches',
            subtitle: 'Check back when matches are in progress',
          };
        case 'my':
          return {
            icon: 'calendar-outline',
            title: 'No Matches Yet',
            subtitle: 'Create or join a match to see it here',
          };
        default:
          return {
            icon: 'football-outline',
            title: 'No Matches Available',
            subtitle: 'Be the first to create a match!',
          };
      }
    };

    const { icon, title, subtitle } = getEmptyMessage();

    return (
      <View style={styles.emptyState}>
        <LinearGradient
          colors={Gradients.card}
          style={styles.emptyCard}
        >
          <Ionicons name={icon as any} size={64} color={Colors.text.secondary} />
          <Text style={styles.emptyTitle}>{title}</Text>
          <Text style={styles.emptySubtitle}>{subtitle}</Text>
          {activeTab !== 'live' && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('CreateMatch')}
            >
              <LinearGradient
                colors={Gradients.field}
                style={styles.emptyButtonGradient}
              >
                <Text style={styles.emptyButtonText}>Create Match</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    );
  };

  const filteredMatches = getFilteredMatches();

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={filteredMatches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          filteredMatches.length === 0 && styles.emptyContainer,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.main}
            colors={[Colors.primary.main]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
      
      <FloatingActionButton
        onPress={() => navigation.navigate('CreateMatch')}
        icon="add"
        colors={Gradients.field}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.card,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 4,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  activeTabText: {
    color: Colors.text.primary,
  },
  liveTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveBadge: {
    backgroundColor: Colors.live.main,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  liveBadgeText: {
    color: Colors.text.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: '31%',
    height: 40,
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
  },
  list: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: '100%',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});