import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface Player {
  id: string;
  name: string;
  position: string;
  avatar_url?: string;
  location?: string;
  bio?: string;
}

interface Connection {
  id: string;
  player_id: string;
  connected_player_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  requested_at: string;
  responded_at?: string;
  playerDetails?: Player;
  connectedPlayerDetails?: Player;
}

interface ConnectionSummary {
  total: number;
  accepted: number;
  pendingSent: number;
  pendingReceived: number;
}

export default function ConnectionsScreen() {
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'search'>('friends');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingConnections, setPendingConnections] = useState<Connection[]>([]);
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<ConnectionSummary | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all connections
      const [connectionsRes, pendingRes, summaryRes] = await Promise.all([
        api.get('/players/connections'),
        api.get('/players/connections/pending'),
        api.get('/players/connections/summary'),
      ]);

      const allConnections = connectionsRes.data.connections || [];
      const accepted = allConnections.filter((c: Connection) => c.status === 'accepted');
      const pending = pendingRes.data.pendingConnections || [];

      setConnections(accepted);
      setPendingConnections(pending);
      setSummary(summaryRes.data.summary);
    } catch (error: any) {
      console.error('Error fetching connections:', error);
      Alert.alert('Error', 'Failed to load connections');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await api.get('/players/search', {
        params: { query: searchQuery }
      });
      setSearchResults(response.data.players || []);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search players');
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async (targetPlayerId: string) => {
    try {
      await api.post('/players/connections/request', {
        connectedPlayerId: targetPlayerId
      });
      Alert.alert('Success', 'Connection request sent!');
      fetchConnections();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to send request';
      Alert.alert('Error', errorMessage);
    }
  };

  const acceptConnection = async (connectionId: string) => {
    try {
      await api.post(`/players/connections/accept/${connectionId}`);
      Alert.alert('Success', 'Connection accepted!');
      fetchConnections();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to accept connection');
    }
  };

  const rejectConnection = async (connectionId: string) => {
    try {
      await api.post(`/players/connections/reject/${connectionId}`);
      Alert.alert('Success', 'Connection rejected');
      fetchConnections();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to reject connection');
    }
  };

  const removeConnection = async (connectionId: string) => {
    Alert.alert(
      'Remove Connection',
      'Are you sure you want to remove this connection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/players/connections/${connectionId}`);
              Alert.alert('Success', 'Connection removed');
              fetchConnections();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove connection');
            }
          }
        }
      ]
    );
  };

  const renderConnectionCard = ({ item }: { item: Connection }) => {
    const otherPlayer = item.playerDetails || item.connectedPlayerDetails;
    if (!otherPlayer) return null;

    const isPending = item.status === 'pending';
    const isReceived = isPending && item.connected_player_id === otherPlayer.id;

    return (
      <View style={styles.connectionCard}>
        <View style={styles.playerInfo}>
          {otherPlayer.avatar_url ? (
            <Image source={{ uri: otherPlayer.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color={colors.text.tertiary} />
            </View>
          )}
          <View style={styles.playerDetails}>
            <Text style={styles.playerName}>{otherPlayer.name}</Text>
            <Text style={styles.playerPosition}>
              {otherPlayer.position} • {otherPlayer.location || 'Unknown location'}
            </Text>
            {isPending && (
              <Text style={styles.pendingText}>
                {isReceived ? 'Wants to connect' : 'Request sent'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionButtons}>
          {isPending && isReceived ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => acceptConnection(item.id)}
              >
                <Ionicons name="checkmark" size={20} color={colors.background.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => rejectConnection(item.id)}
              >
                <Ionicons name="close" size={20} color={colors.background.primary} />
              </TouchableOpacity>
            </>
          ) : isPending ? (
            <Text style={styles.pendingLabel}>Pending</Text>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => removeConnection(item.id)}
            >
              <Ionicons name="person-remove" size={18} color={colors.status.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderSearchResult = ({ item }: { item: Player }) => {
    const isConnected = connections.some(
      c => c.connected_player_id === item.id || c.player_id === item.id
    );
    const isPending = pendingConnections.some(
      c => c.connected_player_id === item.id || c.player_id === item.id
    );

    return (
      <View style={styles.connectionCard}>
        <View style={styles.playerInfo}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color={colors.text.tertiary} />
            </View>
          )}
          <View style={styles.playerDetails}>
            <Text style={styles.playerName}>{item.name}</Text>
            <Text style={styles.playerPosition}>
              {item.position} • {item.location || 'Unknown location'}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {isConnected ? (
            <Text style={styles.connectedLabel}>Connected</Text>
          ) : isPending ? (
            <Text style={styles.pendingLabel}>Pending</Text>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.connectButton]}
              onPress={() => sendConnectionRequest(item.id)}
            >
              <Ionicons name="person-add" size={20} color={colors.background.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connections</Text>
        {summary && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.accepted}</Text>
              <Text style={styles.summaryLabel}>Friends</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.pendingReceived}</Text>
              <Text style={styles.summaryLabel}>Requests</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.pendingSent}</Text>
              <Text style={styles.summaryLabel}>Sent</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending
          </Text>
          {pendingConnections.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingConnections.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Find Players
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'search' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search players by name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              placeholderTextColor={colors.text.tertiary}
            />
            <TouchableOpacity onPress={handleSearch}>
              <Ionicons name="arrow-forward-circle" size={24} color={colors.primary.main} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
          </View>
        ) : activeTab === 'friends' ? (
          <FlatList
            data={connections}
            renderItem={renderConnectionCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={fetchConnections} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>No connections yet</Text>
                <Text style={styles.emptySubtext}>
                  Search for players to connect with them
                </Text>
              </View>
            }
          />
        ) : activeTab === 'pending' ? (
          <FlatList
            data={pendingConnections}
            renderItem={renderConnectionCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={fetchConnections} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>No pending requests</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              searchQuery ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
                  <Text style={styles.emptyText}>No players found</Text>
                  <Text style={styles.emptySubtext}>Try a different search term</Text>
                </View>
              ) : null
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    ...typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  summaryLabel: {
    ...typography.fontSize.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.main,
  },
  tabText: {
    ...typography.fontSize.body,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.medium,
  },
  activeTabText: {
    color: colors.primary.main,
  },
  badge: {
    backgroundColor: colors.status.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: spacing.xs,
  },
  badgeText: {
    color: colors.background.primary,
    ...typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.fontSize.body,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  connectionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    ...typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  playerPosition: {
    ...typography.fontSize.caption,
    color: colors.text.secondary,
  },
  pendingText: {
    ...typography.fontSize.caption,
    color: colors.status.warning,
    marginTop: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  connectButton: {
    backgroundColor: colors.primary.main,
  },
  acceptButton: {
    backgroundColor: colors.status.success,
  },
  rejectButton: {
    backgroundColor: colors.status.error,
  },
  removeButton: {
    backgroundColor: colors.background.tertiary,
  },
  connectedLabel: {
    ...typography.fontSize.caption,
    color: colors.status.success,
    fontWeight: typography.fontWeight.medium,
  },
  pendingLabel: {
    ...typography.fontSize.caption,
    color: colors.status.warning,
    fontWeight: typography.fontWeight.medium,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.fontSize.h3,
    color: colors.text.secondary,
    marginTop: spacing.md,
    fontWeight: typography.fontWeight.medium,
  },
  emptySubtext: {
    ...typography.fontSize.body,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
});