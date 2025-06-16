import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '../theme/colors';

const { width } = Dimensions.get('window');

interface MatchCardProps {
  match: any;
  onPress: () => void;
  style?: any;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPress, style }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const isScheduled = match.status === 'SCHEDULED';
  
  // Calculate current minute for live matches (same workaround as MatchScoringScreen)
  const calculateLiveMinute = () => {
    if (!isLive) return 0;
    
    // Use created_at timestamp as proxy for start time
    const matchStartTime = new Date(match.createdAt || match.created_at || match.match_date);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - matchStartTime.getTime()) / (1000 * 60));
    return Math.max(1, Math.min(elapsed + 1, 120)); // Always at least 1' when live
  };
  
  const [liveMinute, setLiveMinute] = useState(calculateLiveMinute());

  useEffect(() => {
    if (isLive) {
      // Update minute every 10 seconds
      const interval = setInterval(() => {
        setLiveMinute(calculateLiveMinute());
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isLive, match.created_at]);

  useEffect(() => {
    if (isLive) {
      // Pulse animation for live matches
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isLive]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const getGradientColors = () => {
    if (isLive) return Gradients.live;
    if (isCompleted) return ['#1B5E20', '#2E7D32'];
    return Gradients.card;
  };

  const formatTime = (date: string) => {
    const matchDate = new Date(date);
    return matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: string) => {
    const matchDate = new Date(date);
    return matchDate.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ scale: isLive ? pulseAnim : scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Stadium Background Pattern */}
          <View style={styles.stadiumPattern}>
            <View style={styles.centerCircle} />
            <View style={styles.centerLine} />
          </View>

          {/* Status Badge */}
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
              <Ionicons name="radio" size={16} color="#fff" />
            </View>
          )}

          {/* Main Content */}
          <View style={styles.content}>
            {/* Date/Time Section */}
            <View style={styles.dateTimeSection}>
              <View style={styles.dateBox}>
                <Text style={styles.dateText}>{formatDate(match.matchDate)}</Text>
                {!isCompleted && (
                  <Text style={styles.timeText}>{formatTime(match.matchDate)}</Text>
                )}
              </View>
            </View>

            {/* Teams Section */}
            <View style={styles.teamsContainer}>
              {/* Home Team */}
              <View style={styles.team}>
                <View style={[styles.teamLogo, styles.homeLogo]}>
                  <Text style={styles.teamInitial}>
                    {match.homeTeam?.name?.charAt(0) || 'H'}
                  </Text>
                </View>
                <Text style={styles.teamName} numberOfLines={1}>
                  {match.homeTeam?.name || 'Home Team'}
                </Text>
                <View style={styles.scoreContainer}>
                  <Text style={styles.score}>{match.homeScore || 0}</Text>
                </View>
              </View>

              {/* VS/Score Separator */}
              <View style={styles.separator}>
                {isLive ? (
                  <View style={styles.ballIcon}>
                    <Ionicons name="football" size={32} color="#fff" />
                  </View>
                ) : (
                  <Text style={styles.vsText}>VS</Text>
                )}
              </View>

              {/* Away Team */}
              <View style={styles.team}>
                <View style={[styles.teamLogo, styles.awayLogo]}>
                  <Text style={styles.teamInitial}>
                    {match.awayTeam?.name?.charAt(0) || 'A'}
                  </Text>
                </View>
                <Text style={styles.teamName} numberOfLines={1}>
                  {match.awayTeam?.name || 'Away Team'}
                </Text>
                <View style={styles.scoreContainer}>
                  <Text style={styles.score}>{match.awayScore || 0}</Text>
                </View>
              </View>
            </View>

            {/* Venue */}
            {match.venue && (
              <View style={styles.venueContainer}>
                <Ionicons name="location" size={16} color={Colors.secondary.main} />
                <Text style={styles.venueText}>{match.venue}</Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>
                  {isCompleted ? 'Full Time' : isLive ? `${liveMinute}'` : 'Upcoming'}
                </Text>
              </View>
              
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>
                  {isLive ? 'Watch Live' : isCompleted ? 'View Stats' : 'View Details'}
                </Text>
                <Ionicons name="arrow-forward-circle" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  gradient: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  stadiumPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  centerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 2,
    backgroundColor: '#fff',
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.live.main,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    zIndex: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  dateTimeSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dateBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  dateText: {
    color: Colors.secondary.main,
    fontSize: 14,
    fontWeight: '600',
  },
  timeText: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  homeLogo: {
    backgroundColor: Colors.teams.home,
  },
  awayLogo: {
    backgroundColor: Colors.teams.away,
  },
  teamInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  scoreContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  score: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  separator: {
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 20,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.secondary,
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 6,
  },
  venueText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});