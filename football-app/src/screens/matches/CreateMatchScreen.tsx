import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

// Professional Components
import {
  ProfessionalHeader,
  ProfessionalButton,
  ProfessionalTeamBadge,
  DesignSystem,
} from '../../components/professional';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface CreateMatchScreenProps {
  navigation: any;
}

interface Team {
  id: string;
  name: string;
  players: any[];
  logoUrl?: string;
  logo_url?: string;
}

export default function CreateMatchScreen({ navigation }: CreateMatchScreenProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [venue, setVenue] = useState('');
  const [matchDate, setMatchDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [duration, setDuration] = useState('90');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [selectorType, setSelectorType] = useState<'home' | 'away'>('home');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoadingTeams(true);
      const response = await apiService.getTeams();
      const teamsArray = response.teams || [];
      setTeams(teamsArray);
    } catch (error) {
      console.error('Error loading teams:', error);
      Alert.alert('Error', 'Failed to load teams');
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTeams();
    setRefreshing(false);
  };

  const handleCreateMatch = async () => {
    if (!homeTeam || !awayTeam) {
      Alert.alert('Error', 'Please select both home and away teams');
      return;
    }

    if (homeTeam.id === awayTeam.id) {
      Alert.alert('Error', 'Home and away teams must be different');
      return;
    }

    setIsLoading(true);
    try {
      const matchData = {
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        venue: venue.trim(),
        matchDate: matchDate.toISOString(),
        duration: parseInt(duration) || 90,
      };

      const response = await apiService.createMatch(matchData);
      
      if (!response || !response.match || !response.match.id) {
        throw new Error('Invalid response from server - no match ID received');
      }
      
      Alert.alert('Success', 'Match created successfully!', [
        {
          text: 'Set Formation',
          onPress: () => {
            navigation.navigate('PreMatchPlanning', { 
              matchId: response.match.id,
              homeTeam: homeTeam,
              awayTeam: awayTeam,
              isNewMatch: true 
            });
          },
        },
        {
          text: 'Start Match',
          onPress: () => {
            navigation.replace('MatchScoring', { 
              matchId: response.match.id,
              isNewMatch: true 
            });
          },
        },
        {
          text: 'Back to Matches',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error', 
        error.message || 'Failed to create match. Please try again.',
        [
          { text: 'Retry', onPress: () => handleCreateMatch() },
          { text: 'Cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openTeamSelector = (type: 'home' | 'away') => {
    setSelectorType(type);
    setShowTeamSelector(true);
  };

  const selectTeam = (team: Team) => {
    if (selectorType === 'home') {
      setHomeTeam(team);
    } else {
      setAwayTeam(team);
    }
    setShowTeamSelector(false);
  };

  const renderTeamSelector = (
    label: string,
    selectedTeam: Team | null,
    type: 'home' | 'away',
    icon: string,
    color: string
  ) => (
    <View style={styles.teamSelectorCard}>
      <View style={styles.teamSelectorHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={styles.teamSelectorLabel}>{label}</Text>
      </View>
      
      <TouchableOpacity
        style={[
          styles.teamSelectorButton,
          selectedTeam && styles.teamSelectorButtonSelected,
        ]}
        onPress={() => openTeamSelector(type)}
      >
        {selectedTeam ? (
          <View style={styles.selectedTeamContent}>
            <ProfessionalTeamBadge 
              teamName={selectedTeam.name} 
              badgeUrl={selectedTeam.logoUrl || selectedTeam.logo_url}
              size="medium" 
            />
            <View style={styles.selectedTeamInfo}>
              <Text style={styles.selectedTeamName}>{selectedTeam.name}</Text>
              <Text style={styles.selectedTeamPlayers}>
                {selectedTeam.players.length} players
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </View>
        ) : (
          <View style={styles.unselectedTeamContent}>
            <View style={styles.unselectedTeamIcon}>
              <Ionicons name="add" size={24} color={colors.text.secondary} />
            </View>
            <Text style={styles.unselectedTeamText}>Select {label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderTeamSelectorModal = () => (
    <Modal
      visible={showTeamSelector}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowTeamSelector(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            onPress={() => setShowTeamSelector(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            Select {selectorType === 'home' ? 'Home' : 'Away'} Team
          </Text>
          <View style={styles.modalSpacer} />
        </View>
        
        <ScrollView style={styles.modalContent}>
          {teams
            .filter(team => {
              // Filter out already selected team
              const otherTeam = selectorType === 'home' ? awayTeam : homeTeam;
              return !otherTeam || team.id !== otherTeam.id;
            })
            .map((team) => (
              <TouchableOpacity
                key={team.id}
                style={styles.modalTeamOption}
                onPress={() => selectTeam(team)}
              >
                <ProfessionalTeamBadge 
                  teamName={team.name} 
                  badgeUrl={team.logoUrl || team.logo_url}
                  size="medium" 
                />
                <View style={styles.modalTeamInfo}>
                  <Text style={styles.modalTeamName}>{team.name}</Text>
                  <Text style={styles.modalTeamPlayers}>
                    {team.players.length} players
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>
    </Modal>
  );

  if (loadingTeams) {
    return (
      <View style={styles.container}>
        <ProfessionalHeader
          title="Create Match"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading teams...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProfessionalHeader
        title="Create Match"
        subtitle="Set up your match details"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Team Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Teams</Text>
          
          {teams.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyStateTitle}>No Teams Available</Text>
              <Text style={styles.emptyStateText}>Create teams before setting up matches</Text>
              <ProfessionalButton
                title="Create Team"
                icon="add"
                onPress={() => navigation.navigate('Teams', { screen: 'CreateTeam' })}
                style={styles.createTeamButton}
              />
            </View>
          ) : (
            <>
              {renderTeamSelector('Home Team', homeTeam, 'home', 'home', colors.accent.blue)}
              {renderTeamSelector('Away Team', awayTeam, 'away', 'airplane', colors.accent.orange)}
            </>
          )}
        </View>

        {/* Match Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Details</Text>
          
          {/* Venue Input */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Venue</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter venue name (optional)"
                placeholderTextColor={colors.text.tertiary}
                value={venue}
                onChangeText={setVenue}
                maxLength={100}
              />
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date & Time</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <View style={styles.datePickerContent}>
                <Text style={styles.datePickerText}>
                  {matchDate.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })} at {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={matchDate}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setMatchDate(selectedDate);
                }
              }}
            />
          )}

          {/* Duration */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Match Duration</Text>
            <View style={styles.durationOptions}>
              {['5', '30', '45', '60', '90', '120'].map((dur) => (
                <TouchableOpacity
                  key={dur}
                  style={[
                    styles.durationOption,
                    duration === dur && styles.selectedDurationOption,
                  ]}
                  onPress={() => setDuration(dur)}
                >
                  <Text style={[
                    styles.durationOptionText,
                    duration === dur && styles.selectedDurationOptionText,
                  ]}>
                    {dur}'
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Match Preview */}
        {homeTeam && awayTeam && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Match Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewTeams}>
                <View style={styles.previewTeam}>
                  <ProfessionalTeamBadge 
                    teamName={homeTeam.name} 
                    badgeUrl={homeTeam.logoUrl || homeTeam.logo_url}
                    size="large" 
                  />
                  <Text style={styles.previewTeamName}>{homeTeam.name}</Text>
                  <View style={styles.homeBadge}>
                    <Text style={styles.badgeText}>HOME</Text>
                  </View>
                </View>
                
                <View style={styles.previewVs}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
                
                <View style={styles.previewTeam}>
                  <ProfessionalTeamBadge 
                    teamName={awayTeam.name} 
                    badgeUrl={awayTeam.logoUrl || awayTeam.logo_url}
                    size="large" 
                  />
                  <Text style={styles.previewTeamName}>{awayTeam.name}</Text>
                  <View style={styles.awayBadge}>
                    <Text style={styles.badgeText}>AWAY</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.previewDetails}>
                {venue && (
                  <View style={styles.previewDetail}>
                    <Ionicons name="location" size={16} color={colors.text.secondary} />
                    <Text style={styles.previewDetailText}>{venue}</Text>
                  </View>
                )}
                <View style={styles.previewDetail}>
                  <Ionicons name="calendar" size={16} color={colors.text.secondary} />
                  <Text style={styles.previewDetailText}>
                    {matchDate.toLocaleDateString('en-US', { 
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })} at {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.previewDetail}>
                  <Ionicons name="time" size={16} color={colors.text.secondary} />
                  <Text style={styles.previewDetailText}>{duration} minutes</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Create Button */}
        <View style={styles.section}>
          <ProfessionalButton
            title={isLoading ? 'Creating Match...' : 'Create Match'}
            icon={isLoading ? undefined : 'football'}
            onPress={handleCreateMatch}
            disabled={isLoading || !homeTeam || !awayTeam}
            loading={isLoading}
            fullWidth
          />
        </View>
      </ScrollView>

      {renderTeamSelectorModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.screenPadding,
    paddingTop: spacing.screenPadding * 2, // Much more space for header with subtitle
    paddingBottom: spacing.screenPadding * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  // Empty State
  emptyState: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  emptyStateTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  createTeamButton: {
    marginTop: spacing.md,
  },

  // Team Selector Cards
  teamSelectorCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  teamSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  teamSelectorLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  teamSelectorButton: {
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  teamSelectorButtonSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  selectedTeamContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTeamInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  selectedTeamName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  selectedTeamPlayers: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  unselectedTeamContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unselectedTeamIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedTeamText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
    marginLeft: spacing.md,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  modalSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalTeamOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  modalTeamInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  modalTeamName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  modalTeamPlayers: {
    ...typography.caption,
    color: colors.text.secondary,
  },

  // Form Groups
  formGroup: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.small,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.small,
  },
  datePickerContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  datePickerText: {
    ...typography.body,
    color: colors.text.primary,
  },

  // Duration Options
  durationOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationOption: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.small,
  },
  selectedDurationOption: {
    backgroundColor: colors.primary.main + '20',
    borderColor: colors.primary.main,
  },
  durationOptionText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  selectedDurationOptionText: {
    color: colors.primary.main,
    fontWeight: '600',
  },

  // Preview
  previewCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  previewTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  previewTeam: {
    flex: 1,
    alignItems: 'center',
  },
  previewTeamName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  previewVs: {
    paddingHorizontal: spacing.lg,
  },
  vsText: {
    ...typography.h4,
    color: colors.text.secondary,
    fontWeight: 'bold',
  },
  homeBadge: {
    backgroundColor: colors.accent.blue + '20',
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  awayBadge: {
    backgroundColor: colors.accent.orange + '20',
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  previewDetails: {
    gap: spacing.sm,
  },
  previewDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewDetailText: {
    ...typography.body,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
});