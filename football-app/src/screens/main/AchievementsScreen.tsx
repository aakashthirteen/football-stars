import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { PlayerStats } from '../../types';

interface AchievementsScreenProps {
  navigation: any;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export default function AchievementsScreen({ navigation }: AchievementsScreenProps) {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadStatsAndAchievements();
  }, []);

  const loadStatsAndAchievements = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCurrentUserStats();
      setStats(response);
      generateAchievements(response);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAchievements = (playerStats: PlayerStats) => {
    const achievementList: Achievement[] = [
      // Goal Achievements
      {
        id: 'first-goal',
        title: 'First Goal',
        description: 'Score your first goal',
        icon: '⚽',
        unlocked: playerStats.goals >= 1,
        rarity: 'bronze'
      },
      {
        id: 'hat-trick-hero',
        title: 'Hat-trick Hero',
        description: 'Score 3 goals in a single match',
        icon: '🎩',
        unlocked: false, // Would need match-specific data
        rarity: 'gold'
      },
      {
        id: 'goal-machine',
        title: 'Goal Machine',
        description: 'Score 10 goals in a season',
        icon: '🔥',
        unlocked: playerStats.goals >= 10,
        progress: Math.min(playerStats.goals, 10),
        maxProgress: 10,
        rarity: 'silver'
      },
      {
        id: 'legendary-scorer',
        title: 'Legendary Scorer',
        description: 'Score 25 goals in a season',
        icon: '👑',
        unlocked: playerStats.goals >= 25,
        progress: Math.min(playerStats.goals, 25),
        maxProgress: 25,
        rarity: 'platinum'
      },

      // Assist Achievements
      {
        id: 'team-player',
        title: 'Team Player',
        description: 'Record your first assist',
        icon: '🤝',
        unlocked: playerStats.assists >= 1,
        rarity: 'bronze'
      },
      {
        id: 'playmaker',
        title: 'Playmaker',
        description: 'Record 5 assists in a season',
        icon: '🎯',
        unlocked: playerStats.assists >= 5,
        progress: Math.min(playerStats.assists, 5),
        maxProgress: 5,
        rarity: 'silver'
      },

      // Match Achievements
      {
        id: 'debut',
        title: 'Making Debut',
        description: 'Play your first match',
        icon: '🏟️',
        unlocked: playerStats.matchesPlayed >= 1,
        rarity: 'bronze'
      },
      {
        id: 'regular-starter',
        title: 'Regular Starter',
        description: 'Play 10 matches',
        icon: '⭐',
        unlocked: playerStats.matchesPlayed >= 10,
        progress: Math.min(playerStats.matchesPlayed, 10),
        maxProgress: 10,
        rarity: 'silver'
      },
      {
        id: 'veteran',
        title: 'Veteran',
        description: 'Play 25 matches',
        icon: '🏆',
        unlocked: playerStats.matchesPlayed >= 25,
        progress: Math.min(playerStats.matchesPlayed, 25),
        maxProgress: 25,
        rarity: 'gold'
      },

      // Special Achievements
      {
        id: 'clean-sheet',
        title: 'Mr. Clean',
        description: 'Play without receiving any cards',
        icon: '✨',
        unlocked: playerStats.yellowCards === 0 && playerStats.redCards === 0 && playerStats.matchesPlayed > 0,
        rarity: 'silver'
      },
      {
        id: 'iron-man',
        title: 'Iron Man',
        description: 'Play 500+ minutes',
        icon: '💪',
        unlocked: playerStats.minutesPlayed >= 500,
        progress: Math.min(playerStats.minutesPlayed, 500),
        maxProgress: 500,
        rarity: 'gold'
      },
      {
        id: 'complete-player',
        title: 'Complete Player',
        description: 'Score goals and assists in the same season',
        icon: '🌟',
        unlocked: playerStats.goals >= 1 && playerStats.assists >= 1,
        rarity: 'gold'
      }
    ];

    setAchievements(achievementList);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'platinum': return '#E5E4E2';
      default: return '#999';
    }
  };

  const renderAchievement = (achievement: Achievement) => (
    <View key={achievement.id} style={styles.achievementCard}>
      <View style={styles.achievementHeader}>
        <View style={styles.iconContainer}>
          <Text style={styles.achievementIcon}>{achievement.icon}</Text>
          <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(achievement.rarity) }]}>
            <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.achievementInfo}>
          <Text style={[
            styles.achievementTitle,
            !achievement.unlocked && styles.lockedText
          ]}>
            {achievement.title}
          </Text>
          <Text style={[
            styles.achievementDescription,
            !achievement.unlocked && styles.lockedText
          ]}>
            {achievement.description}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          {achievement.unlocked ? (
            <View style={styles.unlockedBadge}>
              <Text style={styles.unlockedText}>✓</Text>
            </View>
          ) : (
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedBadgeText}>🔒</Text>
            </View>
          )}
        </View>
      </View>
      
      {achievement.maxProgress && !achievement.unlocked && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%`,
                  backgroundColor: getRarityColor(achievement.rarity)
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {achievement.progress || 0} / {achievement.maxProgress}
          </Text>
        </View>
      )}
    </View>
  );

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Profile</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Progress Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{unlockedCount}</Text>
              <Text style={styles.summaryLabel}>Unlocked</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{totalCount - unlockedCount}</Text>
              <Text style={styles.summaryLabel}>Locked</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{Math.round((unlockedCount / totalCount) * 100)}%</Text>
              <Text style={styles.summaryLabel}>Complete</Text>
            </View>
          </View>
        </View>

        {/* Achievements List */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>All Achievements</Text>
          {achievements.map(renderAchievement)}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2E7D32',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  achievementsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  achievementCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  rarityBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#fff',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    marginLeft: 12,
  },
  unlockedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBadgeText: {
    fontSize: 16,
  },
  lockedText: {
    opacity: 0.5,
  },
  progressContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});