import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import {
  ProfessionalButton,
  TextButton,
  ProfessionalFormInput,
  ProfessionalCheckbox,
  FormValidatorProvider,
  useFormValidator,
  useFieldValidator,
  type ValidationRule,
} from '../../components/professional';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface LoginScreenProps {
  navigation: any;
}

// Validation rules for login form
const validationRules = {
  email: {
    required: 'Email is required',
    email: 'Please enter a valid email address',
  } as ValidationRule,
  password: {
    required: 'Password is required',
    minLength: 6,
  } as ValidationRule,
};

// Login form component
const LoginForm: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { validateForm, isFormValid } = useFormValidator();
  const login = useAuthStore((state) => state.login);
  
  // Field validators
  const email = useFieldValidator('email', validationRules.email, 'test@test.com');
  const password = useFieldValidator('password', validationRules.password, 'password123');
  
  // Additional state
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors in the form');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.value, password.value);
    } catch (error: any) {
      Alert.alert(
        'Login Failed', 
        error.message || 'Unable to login. Please check your credentials and try again.',
        [{ text: 'OK' }]
      );
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Password reset functionality will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  const handleDemoLogin = () => {
    Alert.alert(
      'Demo Login',
      'This will log you in with demo credentials',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            email.onChangeText('demo@footballstars.com');
            password.onChangeText('demo123');
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="football" size={60} color={colors.text.inverse} />
          </View>
        </View>
        <Text style={styles.title}>Football Stars</Text>
        <Text style={styles.subtitle}>Your game, your glory</Text>
      </View>

      {/* Login Form */}
      <View style={styles.form}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>
            Sign in to your account to continue
          </Text>
        </View>

        <View style={styles.inputs}>
          <ProfessionalFormInput
            label="Email Address"
            placeholder="Enter your email"
            icon="mail"
            variant="email"
            size="large"
            required
            {...email}
            disabled={isLoading}
            accessibilityLabel="Email address input"
            testID="login-email-input"
          />

          <ProfessionalFormInput
            label="Password"
            placeholder="Enter your password"
            icon="lock-closed"
            variant="password"
            size="large"
            required
            {...password}
            disabled={isLoading}
            accessibilityLabel="Password input"
            testID="login-password-input"
          />
        </View>

        {/* Options */}
        <View style={styles.options}>
          <ProfessionalCheckbox
            label="Remember me"
            value={rememberMe}
            onChange={setRememberMe}
            size="medium"
            disabled={isLoading}
            accessibilityLabel="Remember me checkbox"
            testID="remember-me-checkbox"
          />

          <TextButton
            title="Forgot Password?"
            onPress={handleForgotPassword}
            size="medium"
            disabled={isLoading}
            style={styles.forgotButton}
            accessibilityLabel="Forgot password button"
            testID="forgot-password-button"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <ProfessionalButton
            title={isLoading ? "Signing In..." : "Sign In"}
            onPress={handleLogin}
            variant="primary"
            size="large"
            icon="log-in"
            loading={isLoading}
            disabled={!isFormValid}
            fullWidth
            accessibilityLabel="Sign in button"
            testID="sign-in-button"
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <ProfessionalButton
            title="Demo Login"
            onPress={handleDemoLogin}
            variant="outline"
            size="large"
            icon="play"
            disabled={isLoading}
            fullWidth
            accessibilityLabel="Demo login button"
            testID="demo-login-button"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
          </Text>
          <TextButton
            title="Sign Up"
            onPress={handleSignUp}
            size="medium"
            disabled={isLoading}
            accessibilityLabel="Sign up button"
            testID="sign-up-button"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickButtonsRow}>
            <ProfessionalButton
              title="Guest Mode"
              onPress={() => Alert.alert('Guest Mode', 'Browse as guest')}
              variant="ghost"
              size="small"
              icon="eye"
              disabled={isLoading}
              style={styles.quickButton}
            />
            <ProfessionalButton
              title="Help"
              onPress={() => Alert.alert('Help', 'Getting help')}
              variant="ghost"
              size="small"
              icon="help-circle"
              disabled={isLoading}
              style={styles.quickButton}
            />
            <ProfessionalButton
              title="Support"
              onPress={() => Alert.alert('Support', 'Contact support')}
              variant="ghost"
              size="small"
              icon="chatbubble"
              disabled={isLoading}
              style={styles.quickButton}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// Main login screen component
export default function LoginScreenProfessional({ navigation }: LoginScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FormValidatorProvider
          validationRules={validationRules}
          validateOnChange={true}
          validateOnBlur={true}
        >
          <LoginForm navigation={navigation} />
        </FormValidatorProvider>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface.secondary,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  title: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.black,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    padding: spacing.xl,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontSize: typography.fontSize.title1,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed,
  },
  inputs: {
    marginBottom: spacing.lg,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  forgotButton: {
    marginLeft: spacing.md,
  },
  actions: {
    marginBottom: spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.small,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
  },
  quickActions: {
    alignItems: 'center',
  },
  quickActionsTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickButton: {
    minWidth: 80,
  },
});