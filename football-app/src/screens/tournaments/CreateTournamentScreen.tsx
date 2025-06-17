import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';

// Professional Components
import {
  ProfessionalButton,
  ProfessionalHeader,
} from '../../components/professional';

// Import DesignSystem
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface CreateTournamentScreenProps {
  navigation: any;
}

export default function CreateTournamentScreen({ navigation }: CreateTournamentScreenProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tournamentType, setTournamentType] = useState<'LEAGUE' | 'KNOCKOUT' | 'GROUP_STAGE'>('LEAGUE');
  const [maxTeams, setMaxTeams] = useState('8');
  const [entryFee, setEntryFee] = useState('');
  const [prizePool, setPrizePool] = useState('');
  
  // Date fields
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Tournament name is required');
      return;
    }

    if (parseInt(maxTeams) < 2) {
      Alert.alert('Error', 'Tournament must have at least 2 teams');
      return;
    }

    if (endDate <= startDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    try {
      setLoading(true);
      
      const tournamentData = {
        name: name.trim(),
        description: description.trim(),
        tournamentType,
        maxTeams: parseInt(maxTeams),
        entryFee: entryFee ? parseFloat(entryFee) : undefined,
        prizePool: prizePool ? parseFloat(prizePool) : undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      await apiService.createTournament(tournamentData);
      
      Alert.alert(
        'Success', 
        'Tournament created successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const tournamentTypes = [
    { 
      value: 'LEAGUE', 
      label: 'League', 
      description: 'Round-robin format where every team plays every other team',
      icon: '🏆'
    },
    { 
      value: 'KNOCKOUT', 
      label: 'Knockout', 
      description: 'Single elimination tournament bracket',
      icon: '⚔️'
    },
    { 
      value: 'GROUP_STAGE', 
      label: 'Groups + Knockout', 
      description: 'Group stage followed by knockout rounds',
      icon: '🏟️'
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderTypeSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>Tournament Type *</Text>
      <View style={styles.typeGrid}>
        {tournamentTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeCard,
              tournamentType === type.value && styles.typeCardSelected
            ]}
            onPress={() => setTournamentType(type.value as any)}
            activeOpacity={0.8}
          >
            <View style={styles.typeHeader}>
              <Text style={styles.typeIcon}>{type.icon}</Text>
              {tournamentType === type.value && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={[
              styles.typeLabel,
              tournamentType === type.value && styles.typeLabelSelected
            ]}>
              {type.label}
            </Text>
            <Text style={[
              styles.typeDescription,
              tournamentType === type.value && styles.typeDescriptionSelected
            ]}>
              {type.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Professional Header */}
        <ProfessionalHeader
          title="Create Tournament"
          subtitle="Set up your football competition"
          showBack
          onBack={() => navigation.goBack()}
        >
          <ProfessionalButton
            title={loading ? "Creating..." : "Create"}
            icon={loading ? undefined : "add-circle"}
            variant="primary"
            onPress={handleCreate}
            disabled={loading}
          >
            {loading && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: spacing.xs }} />}
          </ProfessionalButton>
        </ProfessionalHeader>

        <View style={styles.content}>
          {/* Basic Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="information-circle" size={20} color={colors.primary.main} />
              </View>
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            
            <View style={styles.formCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tournament Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter tournament name"
                  placeholderTextColor={colors.text.tertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your tournament..."
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Tournament Format */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="trophy" size={20} color={colors.accent.gold} />
              </View>
              <Text style={styles.sectionTitle}>Tournament Format</Text>
            </View>
            
            <View style={styles.formCard}>
              {renderTypeSelector()}
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Maximum Teams *</Text>
                <TextInput
                  style={styles.input}
                  value={maxTeams}
                  onChangeText={setMaxTeams}
                  placeholder="8"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Schedule */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="calendar" size={20} color={colors.accent.blue} />
              </View>
              <Text style={styles.sectionTitle}>Schedule</Text>
            </View>
            
            <View style={styles.formCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Start Date *</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>End Date *</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Prize Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="diamond" size={20} color={colors.accent.coral} />
              </View>
              <Text style={styles.sectionTitle}>Prize Details (Optional)</Text>
            </View>
            
            <View style={styles.formCard}>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Entry Fee (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={entryFee}
                    onChangeText={setEntryFee}
                    placeholder="0"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Prize Pool (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={prizePool}
                    onChangeText={setPrizePool}
                    placeholder="0"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Tournament Preview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="eye" size={20} color={colors.accent.purple} />
              </View>
              <Text style={styles.sectionTitle}>Preview</Text>
            </View>
            
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewIcon}>
                    {tournamentTypes.find(t => t.value === tournamentType)?.icon}
                  </Text>
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>
                    {name || 'Tournament Name'}
                  </Text>
                  <Text style={styles.previewType}>
                    {tournamentTypes.find(t => t.value === tournamentType)?.label}
                  </Text>
                </View>
              </View>
              
              <View style={styles.previewDetails}>
                <View style={styles.previewDetailRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.accent.blue} />
                  <Text style={styles.previewDetail}>
                    {formatDate(startDate)} - {formatDate(endDate)}
                  </Text>
                </View>
                <View style={styles.previewDetailRow}>
                  <Ionicons name="people-outline" size={16} color={colors.primary.main} />
                  <Text style={styles.previewDetail}>
                    Max {maxTeams} teams
                  </Text>
                </View>
                {prizePool && (
                  <View style={styles.previewDetailRow}>
                    <Ionicons name="diamond-outline" size={16} color={colors.accent.gold} />
                    <Text style={styles.previewDetail}>
                      ₹{parseFloat(prizePool).toLocaleString()} prize pool
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
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
  // Professional Section Styling
  section: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  // Professional Form Card
  formCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.regular,
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
    ...shadows.xs,
  },
  textArea: {
    height: 80,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  // Professional Tournament Type Cards
  typeGrid: {
    gap: spacing.sm,
  },
  typeCard: {
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.surface.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface.primary,
    ...shadows.sm,
  },
  typeCardSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeIcon: {
    fontSize: 24,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  typeLabelSelected: {
    color: colors.primary.main,
  },
  typeDescription: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  typeDescriptionSelected: {
    color: colors.primary.dark,
  },
  // Professional Date Button
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.primary,
    ...shadows.xs,
  },
  dateText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  // Professional Preview Card
  previewCard: {
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  previewBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  previewIcon: {
    fontSize: 24,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  previewType: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  previewDetails: {
    gap: spacing.sm,
  },
  previewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewDetail: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  bottomSpacing: {
    height: 40,
  },
});