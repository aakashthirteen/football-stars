import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { FloatingActionButton } from '../../components/FloatingActionButton';

// Professional Components
import {
  ProfessionalButton,
  ProfessionalHeader,
  DesignSystem,
} from '../../components/professional';

const { width } = Dimensions.get('window');
const { colors, typography, spacing, borderRadius, shadows, gradients } = DesignSystem;

interface CreateTournamentScreenProps {
  navigation: any;
}

export default function CreateTournamentScreen({ navigation }: CreateTournamentScreenProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
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
        {tournamentTypes.map((type, index) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeCard,
              tournamentType === type.value && styles.typeCardSelected
            ]}
            onPress={() => setTournamentType(type.value as any)}
            activeOpacity={0.8}
          >
            {tournamentType === type.value && (
              <LinearGradient
                colors={getTournamentTypeGradient(type.value as any)}
                style={styles.typeCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <View style={styles.typeHeader}>
              <Text style={[
                styles.typeIcon,
                tournamentType === type.value && styles.typeIconSelected
              ]}>
                {type.icon}
              </Text>
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
      
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Professional Header with Gradient */}
          <LinearGradient
            colors={gradients.header}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ProfessionalHeader
              title="Create Tournament"
              subtitle="Set up your football competition"
              showBack
              onBack={() => navigation.goBack()}
              style={styles.transparentHeader}
            />
          </LinearGradient>

          <View style={styles.content}>
            {/* Modern Preview Card */}
            <View style={styles.previewSection}>
              <View style={styles.quickPreviewCard}>
                <LinearGradient
                  colors={getTournamentTypeGradient(tournamentType)}
                  style={styles.previewGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Glass overlay */}
                  <View style={styles.previewGlass}>
                    <View style={styles.previewContent}>
                      <View style={styles.previewIcon}>
                        <Text style={styles.previewEmoji}>
                          {tournamentTypes.find(t => t.value === tournamentType)?.icon}
                        </Text>
                      </View>
                      <Text style={styles.previewTitle}>
                        {name || 'Tournament Name'}
                      </Text>
                      <Text style={styles.previewSubtitle}>
                        {tournamentTypes.find(t => t.value === tournamentType)?.label} • {maxTeams} teams
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Basic Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={gradients.primary}
                  style={styles.sectionIconGradient}
                >
                  <Ionicons name="information-circle" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Basic Information</Text>
              </View>
              
              <View style={styles.modernFormCard}>
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
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.sectionIconGradient}
                >
                  <Ionicons name="trophy" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Tournament Format</Text>
              </View>
              
              <View style={styles.modernFormCard}>
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
                <LinearGradient
                  colors={gradients.accent}
                  style={styles.sectionIconGradient}
                >
                  <Ionicons name="calendar" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Schedule</Text>
              </View>
              
              <View style={styles.modernFormCard}>
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
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.sectionIconGradient}
                >
                  <Ionicons name="diamond" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Prize Details (Optional)</Text>
              </View>
              
              <View style={styles.modernFormCard}>
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

            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
      </Animated.View>

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={handleCreate}
        icon={loading ? undefined : "checkmark"}
        style={styles.fab}
        disabled={loading}
      >
        {loading && <ActivityIndicator size="small" color="#FFFFFF" />}
      </FloatingActionButton>

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
  animatedContainer: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: spacing.xl,
  },
  transparentHeader: {
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    marginTop: -spacing.lg,
  },
  // Modern Preview Section
  previewSection: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  quickPreviewCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.lg,
  },
  previewGradient: {
    minHeight: 140,
  },
  previewGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.xl,
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    alignItems: 'center',
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  previewEmoji: {
    fontSize: 28,
  },
  previewTitle: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold as any,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  previewSubtitle: {
    fontSize: typography.fontSize.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
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
  sectionIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  // Modern Form Card
  modernFormCard: {
    backgroundColor: colors.surface.glass,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surface.border,
    padding: spacing.xl,
    ...shadows.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.regular,
    color: colors.text.primary,
    backgroundColor: colors.surface.secondary,
    ...shadows.sm,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  // Modern Tournament Type Cards
  typeGrid: {
    gap: spacing.md,
  },
  typeCard: {
    position: 'relative',
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface.glass,
    overflow: 'hidden',
    ...shadows.lg,
  },
  typeCardSelected: {
    borderColor: colors.primary.main,
    borderWidth: 2,
    ...shadows.xl,
  },
  typeCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeIcon: {
    fontSize: 32,
  },
  typeIconSelected: {
    fontSize: 36,
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
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  typeLabelSelected: {
    color: colors.primary.main,
    fontSize: typography.fontSize.title3,
  },
  typeDescription: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  typeDescriptionSelected: {
    color: colors.primary.main,
    fontWeight: typography.fontWeight.medium as any,
  },
  // Modern Date Button
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    ...shadows.sm,
  },
  dateText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  // Floating Action Button
  fab: {
    bottom: 100,
  },
  bottomSpacing: {
    height: 120,
  },
});