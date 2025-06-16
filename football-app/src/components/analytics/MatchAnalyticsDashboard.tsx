// Match Analytics Dashboard Component for Football Stars App
// Comprehensive visualization of match statistics and performance metrics

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MatchAnalytics, PlayerPerformanceMetrics, TeamPerformanceAnalytics } from '../../types/analytics';
import { Match } from '../../types';
import { analyticsService } from '../../services/analyticsService';
import PlayerHeatMap from './PlayerHeatMap';

interface MatchAnalyticsDashboardProps {
  match: Match;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function MatchAnalyticsDashboard({ match, onClose }: MatchAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<MatchAnalytics | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'players' | 'heatmaps'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [playerMetrics, setPlayerMetrics] = useState<PlayerPerformanceMetrics[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [match.id]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Calculate match analytics
      const matchAnalytics = await analyticsService.calculateMatchAnalytics(match);
      setAnalytics(matchAnalytics);
      
      // Calculate player metrics for key players
      const homeMainPlayers = match.homeTeam.players.slice(0, 3);
      const awayMainPlayers = match.awayTeam.players.slice(0, 3);
      
      const allPlayerMetrics = await Promise.all([
        ...homeMainPlayers.map(player => 
          analyticsService.calculatePlayerPerformanceMetrics(player.playerId, match)
        ),
        ...awayMainPlayers.map(player => 
          analyticsService.calculatePlayerPerformanceMetrics(player.playerId, match)
        ),
      ]);
      
      setPlayerMetrics(allPlayerMetrics);
      
    } catch (error) {
      console.error('Failed to load match analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const TeamStatsComparison = ({ homeTeam, awayTeam }: { 
    homeTeam: TeamPerformanceAnalytics; 
    awayTeam: TeamPerformanceAnalytics; 
  }) => (
    <View style={styles.teamComparison}>
      <Text style={styles.sectionTitle}>Team Comparison</Text>
      
      {/* Possession */}
      <View style={styles.statRow}>
        <Text style={styles.statValue}>{homeTeam.possession.overall}%</Text>
        <Text style={styles.statLabel}>Possession</Text>
        <Text style={styles.statValue}>{awayTeam.possession.overall}%</Text>
      </View>
      <View style={styles.possessionBar}>
        <View 
          style={[
            styles.possessionHome, 
            { width: `${homeTeam.possession.overall}%` }
          ]} 
        />
        <View 
          style={[
            styles.possessionAway, 
            { width: `${awayTeam.possession.overall}%` }
          ]} 
        />
      </View>
      
      {/* Shots */}
      <View style={styles.statRow}>
        <Text style={styles.statValue}>{homeTeam.attacking.shotsTotal}</Text>
        <Text style={styles.statLabel}>Total Shots</Text>
        <Text style={styles.statValue}>{awayTeam.attacking.shotsTotal}</Text>
      </View>
      
      {/* Shots on Target */}
      <View style={styles.statRow}>
        <Text style={styles.statValue}>{homeTeam.attacking.shotsOnTarget}</Text>
        <Text style={styles.statLabel}>Shots on Target</Text>
        <Text style={styles.statValue}>{awayTeam.attacking.shotsOnTarget}</Text>
      </View>
      
      {/* Shot Accuracy */}
      <View style={styles.statRow}>
        <Text style={styles.statValue}>{homeTeam.attacking.shotAccuracy.toFixed(1)}%</Text>
        <Text style={styles.statLabel}>Shot Accuracy</Text>
        <Text style={styles.statValue}>{awayTeam.attacking.shotAccuracy.toFixed(1)}%</Text>
      </View>
      
      {/* Pass Accuracy */}
      <View style={styles.statRow}>
        <Text style={styles.statValue}>{homeTeam.passing.accuracy}%</Text>
        <Text style={styles.statLabel}>Pass Accuracy</Text>
        <Text style={styles.statValue}>{awayTeam.passing.accuracy}%</Text>
      </View>
      
      {/* Cards */}
      <View style={styles.statRow}>
        <Text style={styles.statValue}>
          {homeTeam.discipline.yellowCards + homeTeam.discipline.redCards}
        </Text>
        <Text style={styles.statLabel}>Cards</Text>
        <Text style={styles.statValue}>
          {awayTeam.discipline.yellowCards + awayTeam.discipline.redCards}
        </Text>
      </View>
    </View>
  );

  const PlayerPerformanceCard = ({ player }: { player: PlayerPerformanceMetrics }) => (
    <View style={styles.playerCard}>
      <View style={styles.playerHeader}>
        <View style={[styles.positionBadge, { backgroundColor: getPositionColor(player.positional.averagePosition) }]}>
          <Text style={styles.positionText}>{getPositionFromMetrics(player)}</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.playerName}</Text>
          <Text style={styles.playerRating}>Rating: {player.impact.rating}/10</Text>
        </View>
        <View style={styles.playerStats}>
          <Text style={styles.playerGoals}>⚽ {player.impact.goals}</Text>
          <Text style={styles.playerAssists}>🎯 {player.impact.assists}</Text>
        </View>
      </View>
      
      <View style={styles.playerMetrics}>
        <View style={styles.metricGroup}>
          <Text style={styles.metricTitle}>Physical</Text>
          <Text style={styles.metricValue}>{(player.physical.distanceCovered / 1000).toFixed(1)}km</Text>
          <Text style={styles.metricLabel}>Distance</Text>
        </View>
        
        <View style={styles.metricGroup}>
          <Text style={styles.metricTitle}>Technical</Text>
          <Text style={styles.metricValue}>{player.technical.passAccuracy}%</Text>
          <Text style={styles.metricLabel}>Pass Acc.</Text>
        </View>
        
        <View style={styles.metricGroup}>
          <Text style={styles.metricTitle}>Impact</Text>
          <Text style={styles.metricValue}>{player.impact.xG.toFixed(1)}</Text>
          <Text style={styles.metricLabel}>xG</Text>
        </View>
      </View>
    </View>
  );

  const KeyMomentsTimeline = () => {
    if (!analytics) return null;
    
    return (
      <View style={styles.timeline}>
        <Text style={styles.sectionTitle}>Key Moments</Text>
        {analytics.keyMoments.map((moment, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineMarker}>
              <Text style={styles.timelineMinute}>{moment.minute}'</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDescription}>{moment.description}</Text>
              <View style={styles.timelineImpact}>
                <View 
                  style={[
                    styles.impactBar, 
                    { width: `${moment.impact * 100}%`, backgroundColor: getImpactColor(moment.impact) }
                  ]} 
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const getPositionColor = (avgPos: { x: number; y: number }): string => {
    if (avgPos.y < 25) return '#FF5722'; // GK
    if (avgPos.y < 45) return '#2196F3'; // DEF
    if (avgPos.y < 70) return '#4CAF50'; // MID
    return '#FF9800'; // FWD
  };

  const getPositionFromMetrics = (player: PlayerPerformanceMetrics): string => {
    const avgPos = player.positional.averagePosition;
    if (avgPos.y < 25) return 'GK';
    if (avgPos.y < 45) return 'DEF';
    if (avgPos.y < 70) return 'MID';
    return 'FWD';
  };

  const getImpactColor = (impact: number): string => {
    if (impact > 0.8) return '#FF5722'; // High impact - red
    if (impact > 0.6) return '#FF9800'; // Medium-high - orange
    if (impact > 0.4) return '#FFC107'; // Medium - yellow
    return '#4CAF50'; // Low impact - green
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00E676" />
        <Text style={styles.loadingText}>Analyzing match data...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load analytics</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAnalytics}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Match Analytics</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>
            {match.homeScore} - {match.awayScore}
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'players' && styles.activeTab]}
          onPress={() => setSelectedTab('players')}
        >
          <Text style={[styles.tabText, selectedTab === 'players' && styles.activeTabText]}>
            Players
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'heatmaps' && styles.activeTab]}
          onPress={() => setSelectedTab('heatmaps')}
        >
          <Text style={[styles.tabText, selectedTab === 'heatmaps' && styles.activeTabText]}>
            Heat Maps
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && (
          <>
            <TeamStatsComparison 
              homeTeam={analytics.homeTeam} 
              awayTeam={analytics.awayTeam} 
            />
            <KeyMomentsTimeline />
          </>
        )}

        {selectedTab === 'players' && (
          <View style={styles.playersTab}>
            <Text style={styles.sectionTitle}>Player Performance</Text>
            {playerMetrics.map((player, index) => (
              <PlayerPerformanceCard key={index} player={player} />
            ))}
          </View>
        )}

        {selectedTab === 'heatmaps' && (
          <View style={styles.heatmapsTab}>
            <Text style={styles.sectionTitle}>Player Heat Maps</Text>
            <Text style={styles.heatmapNote}>
              Heat maps show player movement and positioning throughout the match
            </Text>
            {playerMetrics.slice(0, 3).map((player, index) => (
              <View key={index} style={styles.heatmapContainer}>
                <PlayerHeatMap
                  heatMapData={analyticsService.generateMockHeatMapData(
                    player.playerId,
                    player.playerName,
                    getPositionFromMetrics(player),
                    match.id
                  )}
                  showPlayerName={true}
                  showZoneStats={true}
                  width={screenWidth - 80}
                  height={(screenWidth - 80) * 1.2}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  scoreContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    borderRadius: 8,
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00E676',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00E676',
  },
  tabText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#00E676',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  teamComparison: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    width: 60,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
    textAlign: 'center',
  },
  possessionBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  possessionHome: {
    backgroundColor: '#4CAF50',
  },
  possessionAway: {
    backgroundColor: '#FF5722',
  },
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionBadge: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerRating: {
    fontSize: 14,
    color: '#00E676',
    fontWeight: '600',
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerGoals: {
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 8,
  },
  playerAssists: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  playerMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricGroup: {
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00E676',
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeline: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineMarker: {
    width: 50,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineMinute: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00E676',
  },
  timelineContent: {
    flex: 1,
  },
  timelineDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  timelineImpact: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  impactBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  playersTab: {},
  heatmapsTab: {},
  heatmapNote: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  heatmapContainer: {
    marginBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  errorText: {
    fontSize: 16,
    color: '#FF5722',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#00E676',
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    color: '#121212',
    fontWeight: 'bold',
  },
});