import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ProfessionalCheckboxProps {
  label?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'card';
  labelPosition?: 'right' | 'left';
  indeterminate?: boolean;
  containerStyle?: ViewStyle;
  checkboxStyle?: ViewStyle;
  labelStyle?: TextStyle;
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const ProfessionalCheckbox: React.FC<ProfessionalCheckboxProps> = ({
  label,
  value,
  onChange,
  error,
  hint,
  disabled = false,
  size = 'medium',
  variant = 'default',
  labelPosition = 'right',
  indeterminate = false,
  containerStyle,
  checkboxStyle,
  labelStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          checkboxSize: 16,
          iconSize: 12,
          fontSize: typography.fontSize.small,
          padding: spacing.xs,
        };
      case 'large':
        return {
          checkboxSize: 24,
          iconSize: 18,
          fontSize: typography.fontSize.large,
          padding: spacing.md,
        };
      default:
        return {
          checkboxSize: 20,
          iconSize: 14,
          fontSize: typography.fontSize.regular,
          padding: spacing.sm,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const getCheckboxColor = () => {
    if (disabled) return colors.surface.disabled;
    if (error) return colors.semantic.error.main;
    if (value || indeterminate) return colors.primary.main;
    return colors.surface.tertiary;
  };

  const getBorderColor = () => {
    if (disabled) return colors.border.light;
    if (error) return colors.semantic.error.main;
    if (value || indeterminate) return colors.primary.main;
    return colors.border.medium;
  };

  const getIconName = () => {
    if (indeterminate) return 'remove' as const;
    return value ? 'checkmark' as const : undefined;
  };

  const getIconColor = () => {
    if (disabled) return colors.text.disabled;
    return colors.text.inverse;
  };

  const handlePress = () => {
    if (!disabled) {
      onChange(!value);
    }
  };

  const renderCheckbox = () => (
    <View
      style={[
        styles.checkbox,
        {
          width: sizeStyles.checkboxSize,
          height: sizeStyles.checkboxSize,
          backgroundColor: getCheckboxColor(),
          borderColor: getBorderColor(),
        },
        (value || indeterminate) && styles.checkedCheckbox,
        disabled && styles.disabledCheckbox,
        checkboxStyle,
      ]}
    >
      {getIconName() && (
        <Ionicons
          name={getIconName()!}
          size={sizeStyles.iconSize}
          color={getIconColor()}
        />
      )}
    </View>
  );

  const renderLabel = () => (
    label && (
      <Text
        style={[
          styles.label,
          { fontSize: sizeStyles.fontSize },
          disabled && styles.disabledLabel,
          error && styles.errorLabel,
          labelStyle,
        ]}
        numberOfLines={variant === 'card' ? undefined : 2}
      >
        {label}
      </Text>
    )
  );

  const content = (
    <>
      {labelPosition === 'left' && renderLabel()}
      {renderCheckbox()}
      {labelPosition === 'right' && renderLabel()}
    </>
  );

  if (variant === 'card') {
    return (
      <View style={[styles.container, containerStyle]} testID={testID}>
        <Pressable
          style={[
            styles.cardContainer,
            value && styles.checkedCard,
            error && styles.errorCard,
            disabled && styles.disabledCard,
          ]}
          onPress={handlePress}
          disabled={disabled}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint || hint}
          accessibilityRole="checkbox"
          accessibilityState={{
            checked: indeterminate ? 'mixed' : value,
            disabled: disabled,
          }}
          android_ripple={{
            color: colors.primary.main + '20',
            borderless: false,
          }}
        >
          <View style={styles.cardContent}>
            {content}
          </View>
        </Pressable>
        
        {(error || hint) && (
          <View style={styles.messageContainer}>
            {error ? (
              <View style={styles.errorMessage}>
                <Ionicons
                  name="alert-circle"
                  size={14}
                  color={colors.semantic.error.main}
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

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      <TouchableOpacity
        style={[
          styles.touchableContainer,
          { padding: sizeStyles.padding },
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint || hint}
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: indeterminate ? 'mixed' : value,
          disabled: disabled,
        }}
      >
        {content}
      </TouchableOpacity>
      
      {(error || hint) && (
        <View style={styles.messageContainer}>
          {error ? (
            <View style={styles.errorMessage}>
              <Ionicons
                name="alert-circle"
                size={14}
                color={colors.semantic.error.main}
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
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  touchableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  cardContainer: {
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  checkedCard: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.background,
  },
  errorCard: {
    borderColor: colors.semantic.error.main,
    backgroundColor: colors.semantic.error.background,
  },
  disabledCard: {
    opacity: 0.6,
  },
  checkbox: {
    borderRadius: borderRadius.xs,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
  checkedCheckbox: {
    borderWidth: 0,
  },
  disabledCheckbox: {
    opacity: 0.6,
  },
  label: {
    color: colors.text.primary,
    fontFamily: typography.fontFamily.body,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  disabledLabel: {
    color: colors.text.disabled,
  },
  errorLabel: {
    color: colors.semantic.error.main,
  },
  messageContainer: {
    marginTop: spacing.sm,
    marginLeft: spacing.lg,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.small,
    color: colors.semantic.error.main,
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

export default ProfessionalCheckbox;