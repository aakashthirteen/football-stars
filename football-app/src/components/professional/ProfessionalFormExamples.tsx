import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import {
  ProfessionalButton,
  IconButton,
  TextButton,
  FloatingActionButton,
  ProfessionalFormInput,
  ProfessionalDropdown,
  ProfessionalCheckbox,
  ProfessionalRadioButton,
  FormValidatorProvider,
  useFormValidator,
  useFieldValidator,
  type DropdownOption,
  type RadioOption,
  type ValidationRule,
} from './index';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius } = DesignSystem;

// Example form data
const positionOptions: DropdownOption[] = [
  { label: 'Goalkeeper', value: 'GK', icon: 'shield' },
  { label: 'Defender', value: 'DEF', icon: 'shield-checkmark' },
  { label: 'Midfielder', value: 'MID', icon: 'ellipse' },
  { label: 'Forward', value: 'FWD', icon: 'triangle' },
];

const skillLevelOptions: RadioOption[] = [
  { 
    label: 'Beginner', 
    value: 'beginner',
    description: 'Just starting to play football',
    icon: 'star-outline'
  },
  { 
    label: 'Intermediate', 
    value: 'intermediate',
    description: 'Some experience playing football',
    icon: 'star-half'
  },
  { 
    label: 'Advanced', 
    value: 'advanced',
    description: 'Experienced player with good skills',
    icon: 'star'
  },
  { 
    label: 'Professional', 
    value: 'professional',
    description: 'Competitive or semi-professional level',
    icon: 'trophy'
  },
];

const availabilityOptions: RadioOption[] = [
  { label: 'Weekdays', value: 'weekdays' },
  { label: 'Weekends', value: 'weekends' },
  { label: 'Both', value: 'both' },
];

// Form validation rules
const validationRules = {
  playerName: {
    required: true,
    minLength: 2,
    maxLength: 50,
  } as ValidationRule,
  email: {
    required: true,
    email: true,
  } as ValidationRule,
  age: {
    required: true,
    number: true,
    min: 16,
    max: 50,
  } as ValidationRule,
  position: {
    required: 'Please select a position',
  } as ValidationRule,
  skillLevel: {
    required: 'Please select your skill level',
  } as ValidationRule,
  bio: {
    maxLength: 200,
  } as ValidationRule,
};

// Form component
const PlayerRegistrationForm: React.FC = () => {
  const { validateForm, isFormValid, resetForm } = useFormValidator();
  
  // Field validators
  const playerName = useFieldValidator('playerName', validationRules.playerName, '');
  const email = useFieldValidator('email', validationRules.email, '');
  const age = useFieldValidator('age', validationRules.age, '');
  const position = useFieldValidator('position', validationRules.position, '');
  const skillLevel = useFieldValidator('skillLevel', validationRules.skillLevel, '');
  const availability = useFieldValidator('availability', undefined, '');
  const bio = useFieldValidator('bio', validationRules.bio, '');
  
  // Additional state
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [receiveNotifications, setReceiveNotifications] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors in the form');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Terms Required', 'Please agree to the terms and conditions');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Success!', 
        'Player registration completed successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              setAgreeToTerms(false);
              setReceiveNotifications(true);
            }
          }
        ]
      );
    }, 2000);
  };

  const handleReset = () => {
    resetForm();
    setAgreeToTerms(false);
    setReceiveNotifications(true);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Player Registration</Text>
        <Text style={styles.subtitle}>
          Join our football community and find your perfect match
        </Text>
      </View>

      <View style={styles.form}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <ProfessionalFormInput
            label="Player Name"
            placeholder="Enter your full name"
            icon="person"
            required
            variant="default"
            size="medium"
            {...playerName}
            error={playerName.error || undefined}
            accessibilityLabel="Player name input"
            testID="player-name-input"
          />

          <ProfessionalFormInput
            label="Email Address"
            placeholder="your.email@example.com"
            icon="mail"
            required
            variant="email"
            size="medium"
            {...email}
            error={email.error || undefined}
            accessibilityLabel="Email address input"
            testID="email-input"
          />

          <ProfessionalFormInput
            label="Age"
            placeholder="Enter your age"
            icon="calendar"
            required
            variant="phone"
            size="medium"
            {...age}
            error={age.error || undefined}
            accessibilityLabel="Age input"
            testID="age-input"
          />
        </View>

        {/* Playing Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playing Details</Text>
          
          <ProfessionalDropdown
            label="Preferred Position"
            placeholder="Select your position"
            options={positionOptions}
            value={position.value}
            onSelect={(option) => position.onChangeText(option.value)}
            error={position.error || undefined}
            required
            searchable
            size="medium"
            accessibilityLabel="Position selection"
            testID="position-dropdown"
          />

          <ProfessionalRadioButton
            label="Skill Level"
            options={skillLevelOptions}
            value={skillLevel.value}
            onChange={skillLevel.onChangeText}
            error={skillLevel.error || undefined}
            variant="card"
            size="medium"
            accessibilityLabel="Skill level selection"
            testID="skill-level-radio"
          />

          <ProfessionalRadioButton
            label="Availability"
            options={availabilityOptions}
            value={availability.value}
            onChange={availability.onChangeText}
            variant="button"
            direction="horizontal"
            size="medium"
            accessibilityLabel="Availability selection"
            testID="availability-radio"
          />
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <ProfessionalFormInput
            label="Bio"
            placeholder="Tell us about yourself and your playing style..."
            variant="multiline"
            size="medium"
            maxLength={200}
            showCounter
            {...bio}
            error={bio.error || undefined}
            hint="Optional: Share your football experience and goals"
            accessibilityLabel="Bio input"
            testID="bio-input"
          />
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <ProfessionalCheckbox
            label="I agree to the Terms and Conditions"
            value={agreeToTerms}
            onChange={setAgreeToTerms}
            size="medium"
            variant="default"
            accessibilityLabel="Terms agreement checkbox"
            testID="terms-checkbox"
          />

          <ProfessionalCheckbox
            label="Send me notifications about matches and events"
            value={receiveNotifications}
            onChange={setReceiveNotifications}
            size="medium"
            variant="card"
            hint="You can change this in settings later"
            accessibilityLabel="Notifications preference"
            testID="notifications-checkbox"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <ProfessionalButton
            title="Reset Form"
            onPress={handleReset}
            variant="outline"
            size="medium"
            icon="refresh"
            disabled={isSubmitting}
            style={styles.resetButton}
          />

          <ProfessionalButton
            title={isSubmitting ? "Registering..." : "Register Player"}
            onPress={handleSubmit}
            variant="primary"
            size="medium"
            icon="checkmark-circle"
            loading={isSubmitting}
            disabled={!isFormValid || !agreeToTerms}
            style={styles.submitButton}
          />
        </View>

        {/* Button Examples */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Button Examples</Text>
          
          <View style={styles.buttonRow}>
            <ProfessionalButton
              title="Primary"
              onPress={() => Alert.alert('Primary Button')}
              variant="primary"
              size="small"
            />
            <ProfessionalButton
              title="Secondary"
              onPress={() => Alert.alert('Secondary Button')}
              variant="secondary"
              size="small"
            />
            <ProfessionalButton
              title="Outline"
              onPress={() => Alert.alert('Outline Button')}
              variant="outline"
              size="small"
            />
          </View>

          <View style={styles.buttonRow}>
            <ProfessionalButton
              title="Success"
              onPress={() => Alert.alert('Success Button')}
              variant="primary"
              size="small"
              icon="checkmark"
            />
            <ProfessionalButton
              title="Danger"
              onPress={() => Alert.alert('Danger Button')}
              variant="outline"
              size="small"
              icon="warning"
            />
            <TextButton
              title="Text Button"
              onPress={() => Alert.alert('Text Button')}
              size="small"
            />
          </View>

          <View style={styles.buttonRow}>
            <IconButton
              icon="heart"
              onPress={() => Alert.alert('Heart')}
              size="small"
              variant="outline"
            />
            <IconButton
              icon="star"
              onPress={() => Alert.alert('Star')}
              size="medium"
              variant="primary"
            />
            <IconButton
              icon="share"
              onPress={() => Alert.alert('Share')}
              size="large"
              variant="secondary"
            />
          </View>
        </View>
      </View>

      {/* Floating Action Button */}
      <FloatingActionButton
        title="Add"
        icon="add"
        onPress={() => Alert.alert('Quick Add')}
      />
    </ScrollView>
  );
};

// Main example component
export const ProfessionalFormExamples: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <FormValidatorProvider
        validationRules={validationRules}
        validateOnChange={true}
        validateOnBlur={true}
      >
        <PlayerRegistrationForm />
      </FormValidatorProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface.secondary,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  title: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed,
  },
  form: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  resetButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
});

export default ProfessionalFormExamples;