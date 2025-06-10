import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { PlayerStats } from '../../types';

interface LeaderboardScreenProps {
  navigation?: any;
}

type LeaderboardType = 'goals' | 'assists' | 'matches' | 'minutes';

export default function LeaderboardScreen({ navigation }: LeaderboardScreenProps) {
  const { user } = useAuthStore();
  const [activeType, setActiveType] = useState<LeaderboardType>('goals');
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [activeType]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLeaderboard(activeType, 20);
      setLeaderboard(response?.leaderboard || []);
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
      setLeaderboard([]); // Set empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const leaderboardTypes = [
    { value: 'goals', label: 'Goals', icon: '⚽', color: '#FF6B35' },
    { value: 'assists', label: 'Assists', icon: '🎯', color: '#4ECDC4' },
    { value: 'matches', label: 'Matches', icon: '🏟️', color: '#45B7D1' },
    { value: 'minutes', label: 'Minutes', icon: '⏱️', color: '#96CEB4' },
  ];

  const getPositionMedal = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${position}`;
    }
  };

  const getStatValue = (player: PlayerStats) => {
    if (!player) return 0;
    switch (activeType) {
      case 'goals': return player.goals || 0;
      case 'assists': return player.assists || 0;
      case 'matches': return player.matchesPlayed || 0;
      case 'minutes': return Math.round(player.minutesPlayed || 0);
      default: return 0;
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return '#FF5722';
      case 'DEF': return '#2196F3';
      case 'MID': return '#4CAF50';
      case 'FWD': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const renderPlayer = ({ item, index }: { item: PlayerStats; index: number }) => {
    const position = index + 1;
    const isCurrentUser = item?.playerName === user?.name && user?.name; // Simple check, could be improved
    
    return (
      <View style={[
        styles.playerCard,
        position <= 3 && styles.topPlayerCard,
        isCurrentUser && styles.currentUserCard
      ]}>
        <View style={styles.playerRank}>
          <Text style={[
            styles.rankText,
            position <= 3 && styles.topRankText
          ]}>
            {getPositionMedal(position)}
          </Text>
        </View>

        <View style={styles.playerInfo}>
          <View style={styles.playerHeader}>
            <Text style={[
              styles.playerName,
              isCurrentUser && styles.currentUserName
            ]}>
              {item.playerName}
              {isCurrentUser && ' (You)'}
            </Text>
            <View style={[
              styles.positionBadge,
              { backgroundColor: getPositionColor(item.position) }
            ]}>
              <Text style={styles.positionText}>{item.position}</Text>
            </View>
          </View>
          
          <View style={styles.playerStats}>
            <Text style={styles.statLabel}>
              {leaderboardTypes.find(t => t.value === activeType)?.label}:
            </Text>
            <Text style={[
              styles.statValue,
              { color: leaderboardTypes.find(t => t.value === activeType)?.color }
            ]}>
              {getStatValue(item).toLocaleString()}
            </Text>
          </View>

          <View style={styles.additionalStats}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>{item?.goals || 0}</Text>
              <Text style={styles.miniStatLabel}>Goals</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>{item?.assists || 0}</Text>
              <Text style={styles.miniStatLabel}>Assists</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>{item?.matchesPlayed || 0}</Text>
              <Text style={styles.miniStatLabel}>Matches</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTypeSelector = () => (
    <View style={styles.typeSelector}>
      {leaderboardTypes.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={[
            styles.typeButton,
            activeType === type.value && { backgroundColor: type.color }
          ]}
          onPress={() => setActiveType(type.value as LeaderboardType)}
        >
          <Text style={styles.typeIcon}>{type.icon}</Text>
          <Text style={[
            styles.typeLabel,
            activeType === type.value && styles.activeLabelText
          ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Type Selector */}
        {renderTypeSelector()}

        {/* Current Selection Info */}
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionTitle}>
            Top Players by {leaderboardTypes.find(t => t.value === activeType)?.label}
          </Text>
          <Text style={styles.selectionSubtitle}>
            See who's leading the competition
          </Text>
        </View>

        {/* Leaderboard */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : leaderboard.length > 0 ? (
          <View style={styles.leaderboardContainer}>
            <FlatList
              data={leaderboard}
              renderItem={renderPlayer}
              keyExtractor={(item, index) => `${item.playerId}-${index}`}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptySubtitle}>
              Play some matches to see leaderboard stats
            </Text>
          </View>
        )}

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            Rankings are updated in real-time based on match results
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#2E7D32',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    padding: 20,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  activeLabelText: {
    color: '#fff',
  },
  selectionInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  leaderboardContainer: {
    paddingHorizontal: 20,
  },
  playerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topPlayerCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#2E7D32',
    backgroundColor: '#f8fff8',
  },
  playerRank: {
    width: 50,
    alignItems: 'center',
    marginRight: 16,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  topRankText: {
    fontSize: 20,
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  currentUserName: {
    color: '#2E7D32',
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  positionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  additionalStats: {
    flexDirection: 'row',
    gap: 16,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  miniStatLabel: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footerInfo: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});