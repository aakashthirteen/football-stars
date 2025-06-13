import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../services/api';

interface MatchesScreenProps {
  navigation: any;
}

interface Match {
  id: string;
  homeTeam?: { name: string } | null;
  awayTeam?: { name: string } | null;
  homeScore?: number;
  awayScore?: number;
  status: string;
  matchDate: string;
  venue?: string;
}

export default function MatchesScreen({ navigation }: MatchesScreenProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadMatches();
    }, [])
  );

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMatches();
      console.log('📊 Matches loaded:', response);
      
      // Ensure we have valid matches with proper structure
      const validMatches = (response.matches || []).filter((match: any) => 
        match && match.id && match.status && match.matchDate
      );
      
      setMatches(validMatches);
    } catch (error: any) {
      console.error('❌ Error loading matches:', error);
      Alert.alert('Error', 'Failed to load matches. Please try again.');
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return '#d32f2f';
      case 'COMPLETED': return '#4CAF50';
      case 'SCHEDULED': return '#FF9800';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'LIVE': return '⚡';
      case 'COMPLETED': return '✅';
      case 'SCHEDULED': return '📅';
      default: return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Date TBD';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date Error';
    }
  };

  const renderMatch = ({ item }: { item: Match }) => {
    // Add null safety for team names
    const homeTeamName = item.homeTeam?.name || 'Home Team';
    const awayTeamName = item.awayTeam?.name || 'Away Team';
    const homeScore = item.homeScore ?? 0;
    const awayScore = item.awayScore ?? 0;

    return (
      <TouchableOpacity 
        style={styles.matchCard}
        onPress={() => navigation.navigate('MatchScoring', { matchId: item.id })}
      >
        <View style={styles.matchHeader}>
          <Text style={styles.matchDate}>{formatDate(item.matchDate)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.matchDetails}>
          <View style={styles.team}>
            <Text style={styles.teamName}>{homeTeamName}</Text>
            <Text style={styles.score}>{homeScore}</Text>
          </View>
          
          <Text style={styles.vs}>vs</Text>
          
          <View style={styles.team}>
            <Text style={styles.score}>{awayScore}</Text>
            <Text style={styles.teamName}>{awayTeamName}</Text>
          </View>
        </View>

        {item.venue && (
          <Text style={styles.venue}>📍 {item.venue}</Text>
        )}

        <View style={styles.matchFooter}>
          <Text style={styles.tapToView}>
            {item.status === 'LIVE' ? 'Tap to Score Live' : 'Tap to View'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateMatch')}
        >
          <Text style={styles.createButtonText}>+ New Match</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, matches.length === 0 && styles.emptyContainer]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚽</Text>
            <Text style={styles.emptyText}>No matches yet</Text>
            <Text style={styles.emptySubtext}>Create your first match to start tracking scores</Text>
            <TouchableOpacity 
              style={styles.createMatchButton}
              onPress={() => navigation.navigate('CreateMatch')}
            >
              <Text style={styles.createMatchButtonText}>🏆 Create Your First Match</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 24,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  matchCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchDate: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  matchDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  vs: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
  },
  venue: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  matchFooter: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tapToView: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  createMatchButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createMatchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});