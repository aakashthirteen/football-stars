import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MatchesStackParamList } from '../../navigation/MatchesStack';
import { 
  ProfessionalHeader, 
  ProfessionalMatchHeader,
  DesignSystem 
} from '../../components/professional';
import { apiService } from '../../services/api';
import { Match } from '../../types';

// Extended match type that includes team details
interface MatchWithTeams extends Match {
  homeTeam?: {
    id: string;
    name: string;
    logoUrl?: string;
    logo_url?: string;
  };
  awayTeam?: {
    id: string;
    name: string;
    logoUrl?: string;
    logo_url?: string;
  };
}

const { colors, gradients, spacing, typography } = DesignSystem;

type ScheduledMatchScreenRouteProp = RouteProp<MatchesStackParamList, 'ScheduledMatch'>;
type ScheduledMatchScreenNavigationProp = StackNavigationProp<MatchesStackParamList>;

export default function ScheduledMatchScreenSimple() {
  const navigation = useNavigation<ScheduledMatchScreenNavigationProp>();
  const route = useRoute<ScheduledMatchScreenRouteProp>();
  const [match, setMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { matchId } = route.params || {};
  
  useEffect(() => {
    if (matchId) {
      loadMatchData();
    }
  }, [matchId]);
  
  const loadMatchData = async () => {
    try {
      console.log('Loading match data for ID:', matchId);
      const matchData = await apiService.getMatchById(matchId);
      console.log('Loaded match data:', matchData);
      setMatch(matchData);
    } catch (error) {
      console.error('Failed to load match:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Match not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProfessionalHeader 
        title="Match Details"
        onBack={() => navigation.goBack()}
      />
      
      <ProfessionalMatchHeader 
        homeTeam={{
          name: match.homeTeam?.name || 'Home Team',
          logoUrl: match.homeTeam?.logoUrl,
        }}
        awayTeam={{
          name: match.awayTeam?.name || 'Away Team',
          logoUrl: match.awayTeam?.logoUrl,
        }}
        homeScore={match.homeScore}
        awayScore={match.awayScore}
        status={match.status}
        venue={match.venue}
        duration={match.duration}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>
          <Text>Simple Screen with Real Match Data and ScrollView</Text>
          <Text>Match ID: {matchId}</Text>
          <Text>Status: {match.status}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E13',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});