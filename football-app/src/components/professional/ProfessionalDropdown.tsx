import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Modal,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

export interface DropdownOption {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

interface ProfessionalDropdownProps {
  label?: string;
  placeholder?: string;
  options: DropdownOption[];
  value?: string | number;
  onSelect: (option: DropdownOption) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean;
  multiSelect?: boolean;
  containerStyle?: ViewStyle;
  dropdownStyle?: ViewStyle;
  labelStyle?: TextStyle;
  size?: 'small' | 'medium' | 'large';
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const ProfessionalDropdown: React.FC<ProfessionalDropdownProps> = ({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onSelect,
  error,
  hint,
  required = false,
  disabled = false,
  loading = false,
  searchable = false,
  multiSelect = false,
  containerStyle,
  dropdownStyle,
  labelStyle,
  size = 'medium',
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<DropdownOption[]>([]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          minHeight: 40,
          fontSize: typography.fontSize.small,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        };
      case 'large':
        return {
          minHeight: 56,
          fontSize: typography.fontSize.large,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        };
      default:
        return {
          minHeight: 48,
          fontSize: typography.fontSize.regular,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const getBorderColor = () => {
    if (error) return colors.semantic.error.main;
    if (isOpen) return colors.primary.main;
    return colors.border.light;
  };

  const getBackgroundColor = () => {
    if (error) return colors.semantic.error.background;
    if (disabled) return colors.surface.disabled;
    return colors.surface.secondary;
  };

  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption?.label || placeholder;

  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchText.toLowerCase())
      )
    : options;

  const handleOptionSelect = useCallback((option: DropdownOption) => {
    if (option.disabled) return;

    if (multiSelect) {
      const isSelected = selectedOptions.some(selected => selected.value === option.value);
      if (isSelected) {
        setSelectedOptions(prev => prev.filter(selected => selected.value !== option.value));
      } else {
        setSelectedOptions(prev => [...prev, option]);
      }
    } else {
      onSelect(option);
      setIsOpen(false);
    }
  }, [multiSelect, selectedOptions, onSelect]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchText('');
  }, []);

  const renderOption = ({ item }: { item: DropdownOption }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.disabled && styles.disabledOption,
        multiSelect && selectedOptions.some(selected => selected.value === item.value) && styles.selectedOption,
      ]}
      onPress={() => handleOptionSelect(item)}
      disabled={item.disabled}
      activeOpacity={0.7}
    >
      {item.icon && (
        <Ionicons
          name={item.icon}
          size={20}
          color={item.disabled ? colors.text.disabled : colors.text.primary}
          style={styles.optionIcon}
        />
      )}
      <Text
        style={[
          styles.optionText,
          item.disabled && styles.disabledOptionText,
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      {multiSelect && selectedOptions.some(selected => selected.value === item.value) && (
        <Ionicons
          name="checkmark"
          size={20}
          color={colors.primary.main}
          style={styles.checkmark}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { fontSize: sizeStyles.fontSize }, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.dropdown,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
            minHeight: sizeStyles.minHeight,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            paddingVertical: sizeStyles.paddingVertical,
          },
          isOpen && styles.openDropdown,
          error && styles.errorDropdown,
          disabled && styles.disabledDropdown,
          dropdownStyle,
        ]}
        onPress={() => !disabled && !loading && setIsOpen(true)}
        disabled={disabled || loading}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint || hint}
        accessibilityRole="button"
        accessibilityState={{
          disabled: disabled || loading,
          expanded: isOpen,
        }}
      >
        <Text
          style={[
            styles.dropdownText,
            { fontSize: sizeStyles.fontSize },
            !selectedOption && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        
        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.text.tertiary}
          />
        ) : (
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={disabled ? colors.text.disabled : colors.text.tertiary}
          />
        )}
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

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.modalOverlay} onPress={handleClose}>
          <View style={styles.modalContent}>
            {searchable && (
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color={colors.text.tertiary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search options..."
                  placeholderTextColor={colors.text.tertiary}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoFocus
                />
              </View>
            )}
            
            <FlatList
              data={filteredOptions}
              renderItem={renderOption}
              keyExtractor={(item) => item.value.toString()}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            
            {multiSelect && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => {
                    // Handle multi-select confirmation logic here
                    handleClose();
                  }}
                >
                  <Text style={styles.confirmButtonText}>
                    Done ({selectedOptions.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
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
  label: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  required: {
    color: colors.semantic.error.main,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.input,
    borderWidth: 1,
    ...shadows.sm,
  },
  openDropdown: {
    borderWidth: 2,
    ...shadows.md,
  },
  errorDropdown: {
    borderWidth: 2,
  },
  disabledDropdown: {
    opacity: 0.6,
  },
  dropdownText: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.body,
  },
  placeholderText: {
    color: colors.text.tertiary,
  },
  disabledText: {
    color: colors.text.disabled,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...shadows.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.regular,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
  },
  optionsList: {
    paddingVertical: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  selectedOption: {
    backgroundColor: colors.primary.background,
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionIcon: {
    marginRight: spacing.sm,
  },
  optionText: {
    flex: 1,
    fontSize: typography.fontSize.regular,
    color: colors.text.primary,
  },
  disabledOptionText: {
    color: colors.text.disabled,
  },
  checkmark: {
    marginLeft: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  cancelButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.regular,
  },
  confirmButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.button,
  },
  confirmButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default ProfessionalDropdown;