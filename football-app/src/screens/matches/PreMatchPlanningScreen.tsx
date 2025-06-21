import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface PreMatchPlanningScreenProps {
  navigation: any;
  route: any;
}

interface Team {
  id: string;
  name: string;
  players: any[];
}

interface FormationPlan {
  teamId: string;
  formation: string;
  gameFormat: '5v5' | '7v7' | '11v11';
  players: Array<{
    id: string;
    name: string;
    position: string;
    x: number;
    y: number;
    jerseyNumber?: number;
  }>;
  isSet: boolean;
}

export default function PreMatchPlanningScreen({ navigation, route }: PreMatchPlanningScreenProps) {
  const { matchId, homeTeam, awayTeam, isNewMatch } = route.params;
  const [match, setMatch] = useState<any>(null);
  const [homeFormation, setHomeFormation] = useState<FormationPlan | null>(null);
  const [awayFormation, setAwayFormation] = useState<FormationPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGameFormat, setSelectedGameFormat] = useState<'5v5' | '7v7' | '11v11'>('11v11');

  useEffect(() => {
    loadMatchDetails();
    initializeFormations();
  }, []);

  const loadMatchDetails = async () => {
    try {
      const response = await apiService.getMatchById(matchId);
      if (response && response.match) {
        setMatch(response.match);
      }
    } catch (error) {
      console.error('Error loading match details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeFormations = () => {
    setHomeFormation({
      teamId: homeTeam.id,
      formation: 'Not Set',
      gameFormat: selectedGameFormat,
      players: [],
      isSet: false,
    });

    setAwayFormation({
      teamId: awayTeam.id,
      formation: 'Not Set', 
      gameFormat: selectedGameFormat,
      players: [],
      isSet: false,
    });
  };

  const handleSetFormation = (team: Team, isHomeTeam: boolean) => {
    navigation.navigate('TeamFormation', {
      teamId: team.id,
      teamName: team.name,
      matchId: matchId,
      isPreMatch: true,
      isHomeTeam: isHomeTeam,
      gameFormat: selectedGameFormat,
      onFormationSaved: (formationData: any) => {
        if (isHomeTeam) {
          setHomeFormation({
            ...homeFormation!,
            formation: formationData.formationName,
            players: formationData.players,
            isSet: true,
          });
        } else {
          setAwayFormation({
            ...awayFormation!,
            formation: formationData.formationName,
            players: formationData.players,
            isSet: true,
          });
        }
      },
    });
  };

  const saveMatchFormations = async () => {
    if (!homeFormation?.isSet || !awayFormation?.isSet) {
      Alert.alert('Formation Required', 'Please set formations for both teams before proceeding.');
      return;
    }

    try {
      const formationData = {
        matchId: matchId,
        homeFormation: {
          teamId: homeFormation.teamId,
          formation: homeFormation.formation,
          gameFormat: homeFormation.gameFormat,
          players: homeFormation.players,
        },
        awayFormation: {
          teamId: awayFormation.teamId,
          formation: awayFormation.formation,
          gameFormat: awayFormation.gameFormat,
          players: awayFormation.players,
        },
      };

      console.log('💾 Saving match formations:', formationData);
      
      // Save formations to backend
      const [homeResponse, awayResponse] = await Promise.all([
        apiService.saveFormationForMatch(matchId, homeFormation.teamId, {
          formation: homeFormation.formation,
          gameFormat: homeFormation.gameFormat,
          players: homeFormation.players
        }),
        apiService.saveFormationForMatch(matchId, awayFormation.teamId, {
          formation: awayFormation.formation,
          gameFormat: awayFormation.gameFormat,
          players: awayFormation.players
        })
      ]);

      console.log('✅ Formation data saved successfully:', { homeResponse, awayResponse });
      
      Alert.alert('Success', 'Team formations saved successfully!', [
        {
          text: 'Start Match',
          onPress: () => {
            // Navigate to match scoring screen
            navigation.replace('MatchScoring', { 
              matchId: matchId
            });
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving formations:', error);
      Alert.alert('Error', 'Failed to save formations');
    }
  };

  const getGameFormatPlayerCount = (format: string) => {
    switch (format) {
      case '5v5': return 5;
      case '7v7': return 7;
      case '11v11': return 11;
      default: return 11;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading match planning...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0A0E27', '#1A1F3A']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pre-Match Planning</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Match Info */}
        <View style={styles.matchInfo}>
          <Text style={styles.matchTitle}>
            {homeTeam.name} vs {awayTeam.name}
          </Text>
          <Text style={styles.matchSubtitle}>Set formations before kickoff</Text>
        </View>

        {/* Game Format Selector */}
        <View style={styles.formatSelector}>
          <Text style={styles.sectionTitle}>Game Format</Text>
          <View style={styles.formatButtons}>
            {(['5v5', '7v7', '11v11'] as const).map((format) => (
              <TouchableOpacity
                key={format}
                style={[
                  styles.formatButton,
                  selectedGameFormat === format && styles.formatButtonActive
                ]}
                onPress={() => {
                  setSelectedGameFormat(format);
                  initializeFormations();
                }}
              >
                <Text style={[
                  styles.formatButtonText,
                  selectedGameFormat === format && styles.formatButtonTextActive
                ]}>
                  {format}
                </Text>
                <Text style={[
                  styles.formatButtonSubtext,
                  selectedGameFormat === format && styles.formatButtonSubtextActive
                ]}>
                  {getGameFormatPlayerCount(format)} players
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Team Formations */}
        <View style={styles.teamsSection}>
          <Text style={styles.sectionTitle}>Team Formations</Text>
          
          {/* Home Team */}
          <View style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{homeTeam.name}</Text>
                <Text style={styles.teamLabel}>Home Team</Text>
              </View>
              <View style={styles.formationStatus}>
                <Text style={[
                  styles.formationText,
                  homeFormation?.isSet && styles.formationTextSet
                ]}>
                  {homeFormation?.formation || 'Not Set'}
                </Text>
                {homeFormation?.isSet && (
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                )}
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.setFormationButton,
                homeFormation?.isSet && styles.setFormationButtonSet
              ]}
              onPress={() => handleSetFormation(homeTeam, true)}
            >
              <Ionicons 
                name={homeFormation?.isSet ? "create" : "add-circle"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.setFormationButtonText}>
                {homeFormation?.isSet ? 'Edit Formation' : 'Set Formation'}
              </Text>
            </TouchableOpacity>

            {homeFormation?.isSet && (
              <View style={styles.formationSummary}>
                <Text style={styles.formationSummaryText}>
                  ✅ {homeFormation.players.length} players positioned
                </Text>
              </View>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{awayTeam.name}</Text>
                <Text style={styles.teamLabel}>Away Team</Text>
              </View>
              <View style={styles.formationStatus}>
                <Text style={[
                  styles.formationText,
                  awayFormation?.isSet && styles.formationTextSet
                ]}>
                  {awayFormation?.formation || 'Not Set'}
                </Text>
                {awayFormation?.isSet && (
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                )}
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.setFormationButton,
                awayFormation?.isSet && styles.setFormationButtonSet
              ]}
              onPress={() => handleSetFormation(awayTeam, false)}
            >
              <Ionicons 
                name={awayFormation?.isSet ? "create" : "add-circle"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.setFormationButtonText}>
                {awayFormation?.isSet ? 'Edit Formation' : 'Set Formation'}
              </Text>
            </TouchableOpacity>

            {awayFormation?.isSet && (
              <View style={styles.formationSummary}>
                <Text style={styles.formationSummaryText}>
                  ✅ {awayFormation.players.length} players positioned
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.proceedButton,
              (!homeFormation?.isSet || !awayFormation?.isSet) && styles.proceedButtonDisabled
            ]}
            onPress={saveMatchFormations}
            disabled={!homeFormation?.isSet || !awayFormation?.isSet}
          >
            <Ionicons name="play-circle" size={24} color="#FFFFFF" />
            <Text style={styles.proceedButtonText}>Save & Start Match</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              // Navigate to scheduled match screen since match hasn't started yet
              navigation.replace('ScheduledMatch', { 
                matchId: matchId
              });
            }}
          >
            <Text style={styles.skipButtonText}>Skip Formation Planning</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  matchInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  matchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  matchSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  formatSelector: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  formatButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formatButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  formatButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  formatButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  formatButtonTextActive: {
    color: '#FFFFFF',
  },
  formatButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  formatButtonSubtextActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  teamsSection: {
    marginBottom: 30,
  },
  teamCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  teamLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  formationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  formationTextSet: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  setFormationButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  setFormationButtonSet: {
    backgroundColor: '#4CAF50',
  },
  setFormationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  formationSummary: {
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 8,
  },
  formationSummaryText: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
  },
  actionButtons: {
    paddingBottom: 30,
  },
  proceedButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  proceedButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
});