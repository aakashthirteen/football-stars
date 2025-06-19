import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { TeamPlayerStats } from '../../types';

// Professional Components
import {
  ProfessionalHeader,
  ProfessionalPlayerCard,
  ProfessionalTeamBadge,
  ProfessionalButton,
  DesignSystem,
} from '../../components/professional';

const { colors, typography, spacing, borderRadius, shadows, gradients } = DesignSystem;
const { width, height } = Dimensions.get('window');

interface TeamDetailsScreenProps {
  navigation: any;
  route: any;
}

interface Player {
  id: string;
  name: string;
  position: string;
  jerseyNumber?: number;
  role: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  players: Player[];
  createdBy: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const POSITION_COLORS = {
  GK: '#FF8C42',
  DEF: '#4A9FFF',
  MID: '#00D757',
  FWD: '#FF6B6B',
};

export default function TeamDetailsScreen({ navigation, route }: TeamDetailsScreenProps) {
  const { teamId } = route.params;
  const { user } = useAuthStore();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamStats, setTeamStats] = useState<TeamPlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'squad' | 'stats'>('overview');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadTeamDetails();
    animateEntrance();
  }, []);

  // Reload data when screen comes into focus (e.g., returning from AddPlayerScreen)
  useFocusEffect(
    React.useCallback(() => {
      loadTeamDetails();
    }, [teamId])
  );

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadTeamDetails = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiService.getTeamById(teamId);
      
      if (response.team && response.team.players) {
        const transformedPlayers = response.team.players.map((tp: any) => ({
          id: tp.player_id || tp.playerId || tp.player?.id,
          name: tp.player?.name || tp.player_name || tp.name || 'Unknown Player',
          position: tp.player?.position || tp.position || 'Unknown',
          jerseyNumber: tp.jersey_number || tp.jerseyNumber,
          role: tp.role || 'PLAYER'
        }));
        
        const teamData = {
          ...response.team,
          players: transformedPlayers,
          // Handle different possible field names for creator
          createdBy: response.team.createdBy || response.team.created_by || response.team.ownerId || response.team.owner_id || response.team.creator_id
        };
        
        setTeam(teamData);
        
        await loadTeamStats();
      } else {
        setTeam(response.team);
      }
    } catch (error: any) {
      console.error('Error loading team details:', error);
      Alert.alert('Error', 'Failed to load team details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamStats = async () => {
    try {
      const response = await apiService.getTeamPlayersStats(teamId);
      
      if (response && response.players && Array.isArray(response.players)) {
        setTeamStats(response.players);
      } else {
        setTeamStats([]);
      }
    } catch (error: any) {
      console.error('Error loading team stats:', error);
      setTeamStats([]);
    }
  };

  // Check if current user is team admin
  const isTeamAdmin = () => {
    return user?.id === team?.createdBy;
  };

  // Remove player from team (admin only)
  const handleRemovePlayer = (playerId: string, playerName: string) => {
    if (!isTeamAdmin()) {
      Alert.alert('Permission Denied', 'Only team admins can remove players.');
      return;
    }

    Alert.alert(
      'Remove Player',
      `Are you sure you want to remove ${playerName} from the team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removePlayerFromTeam(playerId)
        }
      ]
    );
  };

  const removePlayerFromTeam = async (playerId: string) => {
    try {
      await apiService.removePlayerFromTeam(teamId, playerId);
      Alert.alert('Success', 'Player removed from team');
      loadTeamDetails(); // Reload team data
    } catch (error: any) {
      console.error('Error removing player:', error);
      Alert.alert('Error', 'Failed to remove player from team');
    }
  };

  // Add player to team (admin only)
  const handleAddPlayer = () => {
    if (!isTeamAdmin()) {
      Alert.alert('Permission Denied', 'Only team admins can add players.');
      return;
    }
    
    navigation.navigate('AddPlayer', {
      teamId: team.id,
      teamName: team.name
    });
  };

  // Handle team settings (admin only)
  const handleTeamSettings = () => {
    if (!isTeamAdmin()) {
      Alert.alert('Permission Denied', 'Only team admins can access team settings.');
      return;
    }

    Alert.alert(
      'Team Settings',
      `Manage "${team?.name}" settings`,
      [
        {
          text: 'Edit Team Info',
          onPress: handleEditTeam,
        },
        {
          text: 'Delete Team',
          style: 'destructive',
          onPress: handleDeleteTeam,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Handle edit team
  const handleEditTeam = () => {
    Alert.alert(
      'Edit Team',
      'What would you like to edit?',
      [
        {
          text: 'Change Badge',
          onPress: handleChangeBadge,
        },
        {
          text: 'Edit Info',
          onPress: () => Alert.alert('Coming Soon', 'Team info editing will be available soon.'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Handle badge change
  const handleChangeBadge = () => {
    // Import ImagePickerComponent dynamically or add it to imports
    Alert.alert('Coming Soon', 'Badge upload for existing teams will be available soon.');
  };

  // Handle delete team
  const handleDeleteTeam = () => {
    if (!team) return;

    Alert.alert(
      'Delete Team',
      `Are you sure you want to delete "${team.name}"?\n\nThis action cannot be undone and will:\n• Remove all players from the team\n• Delete all team matches and statistics\n• Remove team from any tournaments`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteTeam,
        },
      ]
    );
  };

  // Confirm team deletion
  const confirmDeleteTeam = async () => {
    if (!team) return;

    setIsLoading(true);
    try {
      console.log('🗑️ Deleting team:', team.id);
      await apiService.deleteTeam(team.id);
      
      Alert.alert(
        'Team Deleted',
        `"${team.name}" has been successfully deleted.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Delete team error:', error);
      Alert.alert(
        'Delete Failed',
        error.message || 'Failed to delete team. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };


  const getPlayerStats = (playerId: string) => {
    const stats = teamStats.find(s => s.playerId === playerId || s.player_id === playerId);
    if (!stats) return undefined;
    
    return {
      goals: parseInt(stats.goals) || 0,
      assists: parseInt(stats.assists) || 0,
      matches: parseInt(stats.matchesPlayed || stats.matches_played) || 0,
      rating: parseFloat(stats.averageRating || stats.average_rating) || 0,
      cards: (parseInt(stats.yellowCards || stats.yellow_cards) || 0) + 
             (parseInt(stats.redCards || stats.red_cards) || 0),
    };
  };

  const calculateTeamTotals = () => {
    const totals = {
      totalPlayers: team?.players.length || 0,
      totalGoals: 0,
      totalAssists: 0,
      totalMatches: 0,
      avgRating: 0,
    };

    if (teamStats.length > 0) {
      totals.totalGoals = teamStats.reduce((sum, player) => sum + (parseInt(player.goals) || 0), 0);
      totals.totalAssists = teamStats.reduce((sum, player) => sum + (parseInt(player.assists) || 0), 0);
      totals.totalMatches = Math.max(...teamStats.map(player => 
        parseInt(player.matchesPlayed || player.matches_played) || 0), 0);
      
      const totalRating = teamStats.reduce((sum, player) => 
        sum + (parseFloat(player.averageRating || player.average_rating) || 0), 0);
      totals.avgRating = teamStats.length > 0 ? totalRating / teamStats.length : 0;
    }

    return totals;
  };

  const renderOverviewTab = () => {
    const totals = calculateTeamTotals();
    const topScorer = teamStats.reduce((top, player) => 
      (parseInt(player.goals) || 0) > (parseInt(top?.goals) || 0) ? player : top, null);
    const topAssister = teamStats.reduce((top, player) => 
      (parseInt(player.assists) || 0) > (parseInt(top?.assists) || 0) ? player : top, null);
    const hasPlayers = team?.players && team.players.length > 0;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Formation Card - Highlighted at Top */}
        <TouchableOpacity 
          style={styles.formationHighlight}
          onPress={() => navigation.navigate('TeamFormation', {
            teamId: team?.id,
            teamName: team?.name
          })}
        >
          <LinearGradient
            colors={gradients.primary}
            style={styles.formationGradient}
          >
            <View style={styles.formationContent}>
              <View style={styles.formationIcon}>
                <Ionicons name="football-outline" size={40} color="#FFFFFF" />
              </View>
              <View style={styles.formationInfo}>
                <Text style={styles.formationTitle}>Team Formation</Text>
                <Text style={styles.formationSubtitle}>Set up your tactics and player positions</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Team Stats Grid */}
        <View style={styles.statsGrid}>
          <Animated.View style={[styles.statGridItem, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={[colors.primary.main + '20', colors.primary.dark + '10']}
              style={styles.statGridGradient}
            >
              <Ionicons name="football" size={24} color={colors.primary.main} />
              <Text style={styles.statGridValue}>{totals.totalGoals}</Text>
              <Text style={styles.statGridLabel}>Total Goals</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.statGridItem, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={[colors.accent.blue + '20', colors.accent.blue + '10']}
              style={styles.statGridGradient}
            >
              <Ionicons name="trending-up" size={24} color={colors.accent.blue} />
              <Text style={styles.statGridValue}>{totals.totalAssists}</Text>
              <Text style={styles.statGridLabel}>Total Assists</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.statGridItem, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={[colors.accent.purple + '20', colors.accent.purple + '10']}
              style={styles.statGridGradient}
            >
              <Ionicons name="calendar" size={24} color={colors.accent.purple} />
              <Text style={styles.statGridValue}>{totals.totalMatches}</Text>
              <Text style={styles.statGridLabel}>Matches Played</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.statGridItem, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={[colors.accent.gold + '20', colors.accent.gold + '10']}
              style={styles.statGridGradient}
            >
              <Ionicons name="star" size={24} color={colors.accent.gold} />
              <Text style={styles.statGridValue}>{totals.avgRating.toFixed(1)}</Text>
              <Text style={styles.statGridLabel}>Avg Rating</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Top Performers */}
        <View style={styles.topPerformers}>
          <Text style={styles.sectionTitle}>Top Performers</Text>
          
          {!hasPlayers ? (
            <View style={styles.emptyPerformers}>
              <Ionicons name="people-outline" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyPerformersText}>No players in squad yet</Text>
              <Text style={styles.emptyPerformersSubtext}>
                Add players to your team to see top performers here
              </Text>
            </View>
          ) : (
            <>
              {topScorer && (
                <TouchableOpacity style={styles.performerCard}>
                  <LinearGradient
                    colors={[colors.accent.gold + '20', colors.accent.gold + '10']}
                    style={styles.performerGradient}
                  >
                    <View style={styles.performerIcon}>
                      <Ionicons name="football" size={20} color={colors.accent.gold} />
                    </View>
                    <View style={styles.performerInfo}>
                      <Text style={styles.performerName}>{topScorer.playerName || topScorer.player_name}</Text>
                      <Text style={styles.performerRole}>Top Scorer</Text>
                    </View>
                    <Text style={styles.performerStat}>{topScorer.goals} goals</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {topAssister && (
                <TouchableOpacity style={styles.performerCard}>
                  <LinearGradient
                    colors={[colors.accent.purple + '20', colors.accent.purple + '10']}
                    style={styles.performerGradient}
                  >
                    <View style={styles.performerIcon}>
                      <Ionicons name="trending-up" size={20} color={colors.accent.purple} />
                    </View>
                    <View style={styles.performerInfo}>
                      <Text style={styles.performerName}>{topAssister.playerName || topAssister.player_name}</Text>
                      <Text style={styles.performerRole}>Top Assists</Text>
                    </View>
                    <Text style={styles.performerStat}>{topAssister.assists} assists</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderSquadTab = () => {
    const positions = ['GK', 'DEF', 'MID', 'FWD'];
    const playersByPosition = positions.reduce((acc, pos) => {
      acc[pos] = team?.players.filter(p => p.position === pos) || [];
      return acc;
    }, {} as Record<string, Player[]>);

    // Filter players based on selected position
    const displayedPlayers = selectedPosition === 'ALL' 
      ? team?.players || []
      : team?.players.filter(p => p.position === selectedPosition) || [];

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Add Player Button (Admin Only) */}
        {isTeamAdmin() && (
          <View style={styles.adminSection}>
            <ProfessionalButton
              title="Add Player"
              icon="person-add"
              onPress={handleAddPlayer}
              style={styles.addPlayerButton}
            />
          </View>
        )}

        {/* Position Filter */}
        <View style={styles.positionFilterRow}>
          <TouchableOpacity
            style={[
              styles.positionChip,
              selectedPosition === 'ALL' && styles.positionChipActive
            ]}
            onPress={() => setSelectedPosition('ALL')}
          >
            <Text style={[
              styles.positionChipText,
              selectedPosition === 'ALL' && styles.positionChipTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {positions.map(position => (
            <TouchableOpacity
              key={position}
              style={[
                styles.positionChip,
                selectedPosition === position && styles.positionChipActive,
                { backgroundColor: POSITION_COLORS[position as keyof typeof POSITION_COLORS] + '20' }
              ]}
              onPress={() => setSelectedPosition(position)}
            >
              <Text style={[
                styles.positionChipText,
                selectedPosition === position && styles.positionChipTextActive,
                { color: POSITION_COLORS[position as keyof typeof POSITION_COLORS] }
              ]}>
                {position}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State for No Players */}
        {(!team?.players || team.players.length === 0) ? (
          <View style={styles.emptyPlayersState}>
            <Ionicons name="people-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyPlayersTitle}>No Players Yet</Text>
            <Text style={styles.emptyPlayersSubtitle}>
              {isTeamAdmin() 
                ? 'Add players to build your squad' 
                : 'This team has no players yet'}
            </Text>
            {isTeamAdmin() && (
              <ProfessionalButton
                title="Add First Player"
                icon="person-add"
                onPress={handleAddPlayer}
                style={styles.emptyStateButton}
              />
            )}
          </View>
        ) : (
          /* Players Grid */
          <View style={styles.playersGrid}>

          {displayedPlayers.map((player, index) => {
            const stats = getPlayerStats(player.id);
            const positionColor = POSITION_COLORS[player.position as keyof typeof POSITION_COLORS] || colors.primary.main;
            
            return (
              <Animated.View
                key={player.id}
                style={[
                  styles.playerGridItem,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 30],
                        outputRange: [0, 30 + (index * 5)],
                      }),
                    }],
                  },
                ]}
              >
                <TouchableOpacity style={styles.playerCard}>
                  <LinearGradient
                    colors={[colors.background.secondary, colors.background.tertiary]}
                    style={styles.playerCardGradient}
                  >
                    {/* Admin Remove Button */}
                    {isTeamAdmin() && (
                      <TouchableOpacity 
                        style={styles.removePlayerButton}
                        onPress={() => handleRemovePlayer(player.id, player.name)}
                      >
                        <Ionicons name="close-circle" size={20} color={colors.status.error} />
                      </TouchableOpacity>
                    )}

                    {/* Position Badge */}
                    <View style={[styles.positionBadge, { backgroundColor: positionColor }]}>
                      <Text style={styles.positionBadgeText}>{player.position}</Text>
                    </View>
                    
                    {/* Player Avatar */}
                    <View style={styles.playerAvatarContainer}>
                      <View style={styles.playerAvatar}>
                        <Ionicons name="person" size={40} color={colors.text.tertiary} />
                      </View>
                      {/* Jersey Number Badge */}
                      {player.jerseyNumber && (
                        <View style={styles.jerseyNumberBadge}>
                          <Text style={styles.jerseyNumberText}>{player.jerseyNumber}</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Player Info */}
                    <Text style={styles.playerName} numberOfLines={1}>{player.name.split(' ')[0]}</Text>
                    
                    {/* Stats Row */}
                    {stats && (
                      <View style={styles.playerStatsRow}>
                        <View style={styles.playerStatItem}>
                          <Text style={styles.playerStatValue}>{stats.goals}</Text>
                          <Text style={styles.playerStatLabel}>G</Text>
                        </View>
                        <View style={styles.playerStatDivider} />
                        <View style={styles.playerStatItem}>
                          <Text style={styles.playerStatValue}>{stats.assists}</Text>
                          <Text style={styles.playerStatLabel}>A</Text>
                        </View>
                        <View style={styles.playerStatDivider} />
                        <View style={styles.playerStatItem}>
                          <Text style={styles.playerStatValue}>{stats.matches}</Text>
                          <Text style={styles.playerStatLabel}>M</Text>
                        </View>
                      </View>
                    )}
                    
                    {/* Rating */}
                    {stats && stats.rating > 0 && (
                      <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(stats.rating) }]}>
                        <Text style={styles.ratingText}>{stats.rating.toFixed(1)}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
          </View>
        )}
      </ScrollView>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return colors.primary.main;
    if (rating >= 7) return colors.semantic.success;
    if (rating >= 6) return colors.semantic.warning;
    return colors.semantic.error;
  };

  const getPositionName = (pos: string) => {
    switch (pos) {
      case 'GK': return 'Goalkeepers';
      case 'DEF': return 'Defenders';
      case 'MID': return 'Midfielders';
      case 'FWD': return 'Forwards';
      default: return pos;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading team details...</Text>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Team not found</Text>
        <ProfessionalButton
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </View>
    );
  }

  const totals = calculateTeamTotals();
  const teamColors = team.primaryColor 
    ? [team.primaryColor, team.secondaryColor || team.primaryColor]
    : gradients.primary;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Professional Header - Simple like TeamsScreen */}
        <ProfessionalHeader
          title={team?.name || 'Team Details'}
          subtitle={team?.description || 'Manage your team'}
          showBack
          onBack={() => navigation.goBack()}
        />
        
        {/* Team Info Section - Outside Header */}
        <View style={styles.teamInfoSection}>
          <Animated.View
            style={[
              styles.teamInfoContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.teamHeaderInfo}>
              <ProfessionalTeamBadge
                teamName={team?.name || ''}
                badgeUrl={team?.logoUrl || (team as any)?.logo_url}
                size="large"
                variant="detailed"
                teamColor={team?.primaryColor}
              />
              
              {/* Admin Badge */}
              {isTeamAdmin() && (
                <View style={styles.adminControls}>
                  <View style={styles.adminBadge}>
                    <Ionicons name="shield-checkmark" size={16} color={colors.primary.main} />
                    <Text style={styles.adminBadgeText}>TEAM ADMIN</Text>
                  </View>
                  
                  {/* Team Settings Button */}
                  <TouchableOpacity 
                    style={styles.settingsButton}
                    onPress={handleTeamSettings}
                  >
                    <Ionicons name="settings" size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {/* Stats Row */}
            <View style={styles.headerStats}>
              <View style={styles.headerStatItem}>
                <Text style={styles.headerStatValue}>{totals.totalPlayers}</Text>
                <Text style={styles.headerStatLabel}>Players</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStatItem}>
                <Text style={styles.headerStatValue}>{totals.totalGoals}</Text>
                <Text style={styles.headerStatLabel}>Goals</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStatItem}>
                <Text style={styles.headerStatValue}>{totals.totalMatches}</Text>
                <Text style={styles.headerStatLabel}>Matches</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Tab Section */}
        <View style={styles.tabSection}>
          {/* Modern Tabs */}
          <View style={styles.modernTabs}>
            {['overview', 'squad', 'stats'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.modernTab,
                  selectedTab === tab && styles.activeModernTab
                ]}
                onPress={() => setSelectedTab(tab as any)}
              >
                <Text style={[
                  styles.modernTabText,
                  selectedTab === tab && styles.activeModernTabText
                ]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                {selectedTab === tab && (
                  <View style={styles.tabIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Tab Content */}
          {selectedTab === 'overview' && renderOverviewTab()}
          {selectedTab === 'squad' && renderSquadTab()}
          
          {selectedTab === 'stats' && (
            <View style={styles.comingSoon}>
              <LinearGradient
                colors={[colors.primary.main + '20', colors.primary.dark + '10']}
                style={styles.comingSoonGradient}
              >
                <Ionicons name="stats-chart" size={64} color={colors.primary.main} />
                <Text style={styles.comingSoonText}>Team Analytics</Text>
                <Text style={styles.comingSoonSubtext}>
                  Detailed performance metrics coming soon
                </Text>
              </LinearGradient>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
  },
  tabSection: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  contentSection: {
    paddingHorizontal: spacing.screenPadding,
  },
  teamInfoSection: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.xl,
    marginBottom: 0,
  },
  teamInfoContent: {
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.large,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  headerContent: {
    marginTop: -20,
  },
  teamHeaderInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  teamTitleSection: {
    flex: 1,
    marginLeft: spacing.md,
  },
  teamName: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  teamDescription: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  headerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatValue: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerStatLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  headerStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.surface.border,
  },
  modernTabs: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...shadows.sm,
  },
  modernTab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  activeModernTab: {
    // Active state handled by indicator
  },
  modernTabText: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  activeModernTabText: {
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: 3,
    backgroundColor: colors.primary.main,
    borderRadius: 2,
  },
  tabContent: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.screenPadding,
    marginHorizontal: -spacing.xs,
  },
  statGridItem: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  statGridGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  statGridValue: {
    fontSize: typography.fontSize.title1,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginVertical: spacing.xs,
  },
  statGridLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  topPerformers: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  performerCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  performerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  performerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  performerRole: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  performerStat: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
    marginHorizontal: -spacing.xs,
  },
  
  // Formation Highlight
  formationHighlight: {
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  formationGradient: {
    padding: spacing.lg,
  },
  formationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  formationInfo: {
    flex: 1,
  },
  formationTitle: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xxs,
  },
  formationSubtitle: {
    fontSize: typography.fontSize.small,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // Empty Performers
  emptyPerformers: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyPerformersText: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyPerformersSubtext: {
    fontSize: typography.fontSize.small,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  actionCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  actionGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  actionTitle: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginTop: spacing.sm,
  },
  actionSubtitle: {
    fontSize: typography.fontSize.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xxs,
  },
  positionFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  positionChip: {
    flex: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badge,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
  },
  positionChipActive: {
    backgroundColor: colors.primary.main,
  },
  positionChipText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  positionChipTextActive: {
    color: '#FFFFFF',
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenPadding,
    marginHorizontal: -spacing.xs,
  },
  playerGridItem: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  playerCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  playerCardGradient: {
    padding: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  positionBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  positionBadgeText: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  playerAvatarContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    position: 'relative',
  },
  jerseyNumberBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.full,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  jerseyNumberText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  playerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  playerName: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  playerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.accent,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  playerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  playerStatValue: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  playerStatLabel: {
    fontSize: typography.fontSize.micro,
    color: colors.text.secondary,
  },
  playerStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.surface.border,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  ratingText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  comingSoonGradient: {
    width: '100%',
    padding: spacing.xxxl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  comingSoonSubtext: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  
  // Admin Controls
  adminSection: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
  },
  addPlayerButton: {
    marginBottom: spacing.sm,
  },
  removePlayerButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Empty Players State
  emptyPlayersState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyPlayersTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyPlayersSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  emptyStateButton: {
    marginTop: spacing.md,
  },
  
  // Admin Controls
  adminControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.badge,
    gap: spacing.xxs,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    letterSpacing: 0.5,
  },
  settingsButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    ...shadows.sm,
  },
  bottomSpacing: {
    height: spacing.xxl,
  },
});