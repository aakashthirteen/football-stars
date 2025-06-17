import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ProfessionalFormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  required?: boolean;
  success?: boolean;
}

export const ProfessionalFormInput = forwardRef<TextInput, ProfessionalFormInputProps>(
  ({
    label,
    error,
    hint,
    icon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    required = false,
    success = false,
    style,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const getBorderColor = () => {
      if (error) return colors.status.error;
      if (success) return colors.status.success;
      if (isFocused) return colors.primary.main;
      return colors.surface.border;
    };

    const getIconColor = () => {
      if (error) return colors.status.error;
      if (success) return colors.status.success;
      if (isFocused) return colors.primary.main;
      return colors.text.tertiary;
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <View style={styles.labelContainer}>
            <Text style={styles.label}>
              {label}
              {required && <Text style={styles.required}> *</Text>}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.inputContainer,
          { borderColor: getBorderColor() },
          isFocused && styles.focusedContainer,
          error && styles.errorContainer,
          success && styles.successContainer,
        ]}>
          {icon && (
            <View style={styles.leftIconContainer}>
              <Ionicons 
                name={icon as any} 
                size={20} 
                color={getIconColor()} 
              />
            </View>
          )}
          
          <TextInput
            ref={ref}
            style={[
              styles.input,
              icon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              style,
            ]}
            placeholderTextColor={colors.text.tertiary}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {rightIcon && (
            <TouchableOpacity
              style={styles.rightIconContainer}
              onPress={onRightIconPress}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={rightIcon as any} 
                size={20} 
                color={getIconColor()} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        {(error || hint) && (
          <View style={styles.messageContainer}>
            {error ? (
              <View style={styles.errorMessage}>
                <Ionicons 
                  name="alert-circle" 
                  size={14} 
                  color={colors.status.error} 
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : hint ? (
              <View style={styles.hintMessage}>
                <Ionicons 
                  name="information-circle-outline" 
                  size={14} 
                  color={colors.text.tertiary} 
                />
                <Text style={styles.hintText}>{hint}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    );
  }
);

ProfessionalFormInput.displayName = 'ProfessionalFormInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  labelContainer: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  required: {
    color: colors.status.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  focusedContainer: {
    backgroundColor: colors.primary.main + '05',
    ...shadows.md,
  },
  errorContainer: {
    backgroundColor: colors.status.error + '05',
  },
  successContainer: {
    backgroundColor: colors.status.success + '05',
  },
  leftIconContainer: {
    marginRight: spacing.sm,
  },
  rightIconContainer: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.regular,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  inputWithLeftIcon: {
    marginLeft: 0,
  },
  inputWithRightIcon: {
    marginRight: 0,
  },
  messageContainer: {
    marginTop: spacing.sm,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.small,
    color: colors.status.error,
    marginLeft: spacing.xs,
    flex: 1,
  },
  hintMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintText: {
    fontSize: typography.fontSize.small,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
    flex: 1,
  },
});