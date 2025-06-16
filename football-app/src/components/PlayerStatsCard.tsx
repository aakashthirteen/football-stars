import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients } from '../theme/colors';

const { width } = Dimensions.get('window');

interface PlayerStatsCardProps {
  playerName: string;
  position: string;
  stats: {
    goals: number;
    assists: number;
    matches: number;
    rating?: number;
  };
  onPress?: () => void;
}

export const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({
  playerName,
  position,
  stats,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation for the background element
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const getPositionColor = () => {
    switch (position) {
      case 'GK': return '#9C27B0';
      case 'DEF': return '#2196F3';
      case 'MID': return '#4CAF50';
      case 'FWD': return '#FF9800';
      default: return Colors.primary.main;
    }
  };

  const calculateRating = () => {
    if (stats.rating) return stats.rating.toFixed(1);
    if (stats.matches === 0) return '0.0';
    return ((stats.goals * 2 + stats.assists) / stats.matches).toFixed(1);
  };

  const getInitials = () => {
    return playerName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <LinearGradient
          colors={Gradients.card}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Background Pattern */}
          <Animated.View
            style={[
              styles.backgroundPattern,
              {
                transform: [{
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                }],
              },
            ]}
          >
            <Ionicons name="football-outline" size={200} color="rgba(255,255,255,0.03)" />
          </Animated.View>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[getPositionColor(), Colors.primary.main]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </LinearGradient>
              <View style={styles.onlineIndicator} />
            </View>
            
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{playerName}</Text>
              <View style={styles.positionBadge}>
                <Text style={[styles.positionText, { color: getPositionColor() }]}>
                  {position}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatItem
              icon="football"
              value={stats.goals}
              label="Goals"
              color={Colors.status.success}
            />
            <StatItem
              icon="hand-left"
              value={stats.assists}
              label="Assists"
              color={Colors.status.info}
            />
            <StatItem
              icon="calendar"
              value={stats.matches}
              label="Matches"
              color={Colors.status.warning}
            />
            <StatItem
              icon="star"
              value={calculateRating()}
              label="Rating"
              color={Colors.secondary.main}
            />
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>View Full Stats</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.text.primary} />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const StatItem: React.FC<{
  icon: string;
  value: number | string;
  label: string;
  color: string;
}> = ({ icon, value, label, color }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (typeof value === 'number' && value > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(pulseAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [value]);

  return (
    <Animated.View
      style={[
        styles.statItem,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 24,
    shadowColor: Colors.shadow.heavy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  gradient: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    top: -50,
    right: -50,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    borderWidth: 3,
    borderColor: Colors.background.card,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  positionBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  positionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  moreButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});