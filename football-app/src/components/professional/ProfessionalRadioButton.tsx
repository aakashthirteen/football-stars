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

export interface RadioOption {
  label: string;
  value: string | number;
  description?: string;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface ProfessionalRadioButtonProps {
  options: RadioOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'card' | 'button';
  direction?: 'vertical' | 'horizontal';
  containerStyle?: ViewStyle;
  optionStyle?: ViewStyle;
  labelStyle?: TextStyle;
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const ProfessionalRadioButton: React.FC<ProfessionalRadioButtonProps> = ({
  options,
  value,
  onChange,
  label,
  error,
  hint,
  disabled = false,
  size = 'medium',
  variant = 'default',
  direction = 'vertical',
  containerStyle,
  optionStyle,
  labelStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          radioSize: 16,
          dotSize: 8,
          fontSize: typography.fontSize.small,
          padding: spacing.xs,
          spacing: spacing.sm,
        };
      case 'large':
        return {
          radioSize: 24,
          dotSize: 12,
          fontSize: typography.fontSize.large,
          padding: spacing.md,
          spacing: spacing.lg,
        };
      default:
        return {
          radioSize: 20,
          dotSize: 10,
          fontSize: typography.fontSize.regular,
          padding: spacing.sm,
          spacing: spacing.md,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const getRadioColor = (isSelected: boolean, isDisabled: boolean) => {
    if (isDisabled) return colors.surface.disabled;
    if (error) return colors.semantic.error.main;
    if (isSelected) return colors.primary.main;
    return colors.surface.tertiary;
  };

  const getBorderColor = (isSelected: boolean, isDisabled: boolean) => {
    if (isDisabled) return colors.border.light;
    if (error) return colors.semantic.error.main;
    if (isSelected) return colors.primary.main;
    return colors.border.medium;
  };

  const handleOptionPress = (optionValue: string | number, isDisabled?: boolean) => {
    if (!disabled && !isDisabled) {
      onChange(optionValue);
    }
  };

  const renderRadioCircle = (isSelected: boolean, isDisabled?: boolean) => (
    <View
      style={[
        styles.radioCircle,
        {
          width: sizeStyles.radioSize,
          height: sizeStyles.radioSize,
          borderRadius: sizeStyles.radioSize / 2,
          backgroundColor: getRadioColor(isSelected, isDisabled || disabled),
          borderColor: getBorderColor(isSelected, isDisabled || disabled),
        },
        isSelected && styles.selectedRadio,
        (isDisabled || disabled) && styles.disabledRadio,
      ]}
    >
      {isSelected && (
        <View
          style={[
            styles.radioDot,
            {
              width: sizeStyles.dotSize,
              height: sizeStyles.dotSize,
              borderRadius: sizeStyles.dotSize / 2,
              backgroundColor: (isDisabled || disabled) ? colors.text.disabled : colors.text.inverse,
            },
          ]}
        />
      )}
    </View>
  );

  const renderOption = (option: RadioOption, index: number) => {
    const isSelected = option.value === value;
    const isDisabled = option.disabled || disabled;

    if (variant === 'card') {
      return (
        <Pressable
          key={option.value}
          style={[
            styles.cardOption,
            isSelected && styles.selectedCard,
            error && styles.errorCard,
            isDisabled && styles.disabledCard,
            direction === 'horizontal' && styles.horizontalCard,
            optionStyle,
          ]}
          onPress={() => handleOptionPress(option.value, option.disabled)}
          disabled={isDisabled}
          accessibilityRole="radio"
          accessibilityState={{
            checked: isSelected,
            disabled: isDisabled,
          }}
          accessibilityLabel={option.label}
          accessibilityHint={option.description}
          android_ripple={{
            color: colors.primary.main + '20',
            borderless: false,
          }}
        >
          <View style={styles.cardOptionContent}>
            {option.icon && (
              <Ionicons
                name={option.icon}
                size={sizeStyles.fontSize + 4}
                color={isDisabled ? colors.text.disabled : colors.text.primary}
                style={styles.optionIcon}
              />
            )}
            <View style={styles.optionTextContainer}>
              <Text
                style={[
                  styles.optionLabel,
                  { fontSize: sizeStyles.fontSize },
                  isDisabled && styles.disabledLabel,
                  labelStyle,
                ]}
              >
                {option.label}
              </Text>
              {option.description && (
                <Text
                  style={[
                    styles.optionDescription,
                    isDisabled && styles.disabledDescription,
                  ]}
                >
                  {option.description}
                </Text>
              )}
            </View>
            {renderRadioCircle(isSelected, option.disabled)}
          </View>
        </Pressable>
      );
    }

    if (variant === 'button') {
      return (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.buttonOption,
            isSelected && styles.selectedButton,
            error && styles.errorButton,
            isDisabled && styles.disabledButton,
            direction === 'horizontal' && styles.horizontalButton,
            optionStyle,
          ]}
          onPress={() => handleOptionPress(option.value, option.disabled)}
          disabled={isDisabled}
          activeOpacity={0.7}
          accessibilityRole="radio"
          accessibilityState={{
            checked: isSelected,
            disabled: isDisabled,
          }}
          accessibilityLabel={option.label}
        >
          {option.icon && (
            <Ionicons
              name={option.icon}
              size={sizeStyles.fontSize}
              color={isSelected ? colors.text.inverse : (isDisabled ? colors.text.disabled : colors.primary.main)}
              style={styles.buttonIcon}
            />
          )}
          <Text
            style={[
              styles.buttonLabel,
              { fontSize: sizeStyles.fontSize },
              isSelected && styles.selectedButtonLabel,
              isDisabled && styles.disabledButtonLabel,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    }

    // Default variant
    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.defaultOption,
          { padding: sizeStyles.padding },
          direction === 'horizontal' && styles.horizontalOption,
          optionStyle,
        ]}
        onPress={() => handleOptionPress(option.value, option.disabled)}
        disabled={isDisabled}
        activeOpacity={0.7}
        accessibilityRole="radio"
        accessibilityState={{
          checked: isSelected,
          disabled: isDisabled,
        }}
        accessibilityLabel={option.label}
        accessibilityHint={option.description}
      >
        {renderRadioCircle(isSelected, option.disabled)}
        <View style={styles.optionTextContainer}>
          <Text
            style={[
              styles.optionLabel,
              { fontSize: sizeStyles.fontSize },
              isDisabled && styles.disabledLabel,
              labelStyle,
            ]}
          >
            {option.label}
          </Text>
          {option.description && (
            <Text
              style={[
                styles.optionDescription,
                isDisabled && styles.disabledDescription,
              ]}
            >
              {option.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.groupLabel, { fontSize: sizeStyles.fontSize }, labelStyle]}>
            {label}
          </Text>
        </View>
      )}
      
      <View
        style={[
          styles.optionsContainer,
          direction === 'horizontal' && styles.horizontalContainer,
          { gap: sizeStyles.spacing },
        ]}
        accessibilityRole="radiogroup"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint || hint}
      >
        {options.map(renderOption)}
      </View>
      
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
    marginBottom: spacing.lg,
  },
  labelContainer: {
    marginBottom: spacing.sm,
  },
  groupLabel: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  horizontalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // Default variant styles
  defaultOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: borderRadius.sm,
  },
  horizontalOption: {
    flex: 1,
    minWidth: 120,
  },
  radioCircle: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2, // Align with text baseline
  },
  selectedRadio: {
    borderWidth: 0,
  },
  disabledRadio: {
    opacity: 0.6,
  },
  radioDot: {
    // Dot styles are dynamically applied
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    color: colors.text.primary,
    fontFamily: typography.fontFamily.body,
    lineHeight: typography.lineHeight.normal,
  },
  optionDescription: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: typography.lineHeight.normal,
  },
  disabledLabel: {
    color: colors.text.disabled,
  },
  disabledDescription: {
    color: colors.text.disabled,
  },
  optionIcon: {
    marginRight: spacing.sm,
  },
  // Card variant styles
  cardOption: {
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  cardOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  selectedCard: {
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
  horizontalCard: {
    flex: 1,
    minWidth: 150,
  },
  // Button variant styles
  buttonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  selectedButton: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  errorButton: {
    borderColor: colors.semantic.error.main,
  },
  disabledButton: {
    opacity: 0.6,
  },
  horizontalButton: {
    flex: 1,
    minWidth: 100,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  buttonLabel: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  selectedButtonLabel: {
    color: colors.text.inverse,
  },
  disabledButtonLabel: {
    color: colors.text.disabled,
  },
  // Message styles
  messageContainer: {
    marginTop: spacing.sm,
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

export default ProfessionalRadioButton;