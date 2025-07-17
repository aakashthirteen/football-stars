import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Platform,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface SearchResult {
  id: string;
  type: 'player' | 'team' | 'match' | 'tournament';
  title: string;
  subtitle?: string;
  icon?: string;
  avatar?: string;
}

interface ProfessionalSearchHeaderProps {
  placeholder?: string;
  onBack?: () => void;
  onSearch?: (query: string) => void;
  onResultSelect?: (result: SearchResult) => void;
  searchResults?: SearchResult[];
  showRecentSearches?: boolean;
  recentSearches?: SearchResult[];
  onClearRecent?: () => void;
  showFilters?: boolean;
  activeFilters?: string[];
  onFilterToggle?: (filter: string) => void;
  showVoiceSearch?: boolean;
  onVoiceSearch?: () => void;
  isLoading?: boolean;
  autoFocus?: boolean;
}

export const ProfessionalSearchHeader: React.FC<ProfessionalSearchHeaderProps> = ({
  placeholder = "Search players, teams, matches...",
  onBack,
  onSearch,
  onResultSelect,
  searchResults = [],
  showRecentSearches = true,
  recentSearches = [],
  onClearRecent,
  showFilters = false,
  activeFilters = [],
  onFilterToggle,
  showVoiceSearch = false,
  onVoiceSearch,
  isLoading = false,
  autoFocus = true,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (isFocused || query.length > 0) {
      setShowResults(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowResults(false);
      });
    }
  }, [isFocused, query, fadeAnim, slideAnim]);

  const handleSearch = (text: string) => {
    setQuery(text);
    onSearch?.(text);
  };

  const handleClear = () => {
    setQuery('');
    searchInputRef.current?.focus();
    onSearch?.('');
  };

  const handleResultPress = (result: SearchResult) => {
    onResultSelect?.(result);
    Keyboard.dismiss();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'player': return 'person';
      case 'team': return 'people';
      case 'match': return 'football';
      case 'tournament': return 'trophy';
      default: return 'search';
    }
  };

  const renderSearchFilters = () => {
    if (!showFilters) return null;

    const filters = ['All', 'Players', 'Teams', 'Matches', 'Tournaments'];

    return (
      <View style={styles.filtersContainer}>
        <View style={styles.filtersScrollView}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                activeFilters.includes(filter) && styles.filterChipActive
              ]}
              onPress={() => onFilterToggle?.(filter)}
            >
              <Text style={[
                styles.filterText,
                activeFilters.includes(filter) && styles.filterTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSearchResults = () => {
    if (!showResults) return null;

    const hasQuery = query.length > 0;
    const resultsToShow = hasQuery ? searchResults : recentSearches;
    const sectionTitle = hasQuery ? 'Search Results' : 'Recent Searches';

    return (
      <Animated.View
        style={[
          styles.resultsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
          {!hasQuery && recentSearches.length > 0 && (
            <TouchableOpacity onPress={onClearRecent}>
              <Text style={styles.clearButton}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {resultsToShow.length > 0 ? (
          <View style={styles.resultsList}>
            {resultsToShow.map((result, index) => (
              <TouchableOpacity
                key={`${result.id}-${index}`}
                style={styles.resultItem}
                onPress={() => handleResultPress(result)}
              >
                <View style={styles.resultIcon}>
                  <Ionicons
                    name={getResultIcon(result.type) as any}
                    size={20}
                    color={colors.text.secondary}
                  />
                </View>
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {result.title}
                  </Text>
                  {result.subtitle && (
                    <Text style={styles.resultSubtitle} numberOfLines={1}>
                      {result.subtitle}
                    </Text>
                  )}
                </View>
                <View style={styles.resultAction}>
                  <Ionicons
                    name={hasQuery ? 'arrow-forward' : 'time'}
                    size={16}
                    color={colors.text.tertiary}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name={hasQuery ? 'search' : 'time-outline'}
              size={48}
              color={colors.text.disabled}
            />
            <Text style={styles.emptyStateText}>
              {hasQuery ? 'No results found' : 'No recent searches'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {hasQuery 
                ? 'Try adjusting your search terms' 
                : 'Your recent searches will appear here'
              }
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Header Background */}
        <LinearGradient
          colors={[colors.background.secondary, colors.background.primary]}
          style={StyleSheet.absoluteFillObject}
        />
        
        <SafeAreaView style={styles.safeArea}>
          {/* Search Bar */}
          <View style={styles.searchBar}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>

            {/* Search Input Container */}
            <View style={[styles.searchInputContainer, isFocused && styles.searchInputFocused]}>
              <Ionicons
                name="search"
                size={20}
                color={isFocused ? colors.primary.main : colors.text.tertiary}
                style={styles.searchIcon}
              />
              
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder={placeholder}
                placeholderTextColor={colors.text.tertiary}
                value={query}
                onChangeText={handleSearch}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                returnKeyType="search"
                clearButtonMode="never"
                autoCorrect={false}
                autoCapitalize="none"
              />

              {/* Clear Button */}
              {query.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClear}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
              )}

              {/* Voice Search Button */}
              {showVoiceSearch && query.length === 0 && (
                <TouchableOpacity
                  style={styles.voiceButton}
                  onPress={onVoiceSearch}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="mic" size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <View style={styles.loadingIndicator}>
                  <Animated.View
                    style={[
                      styles.loadingDot,
                      { backgroundColor: colors.primary.main }
                    ]}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Search Filters */}
          {renderSearchFilters()}

          {/* Search Results */}
          {renderSearchResults()}
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    paddingTop: Platform.OS === 'ios' ? spacing.md : spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  searchInputFocused: {
    borderColor: colors.primary.main,
    backgroundColor: colors.surface.primary,
    ...shadows.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.regular,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.regular,
  },
  clearButton: {
    marginLeft: spacing.sm,
  },
  voiceButton: {
    marginLeft: spacing.sm,
  },
  loadingIndicator: {
    marginLeft: spacing.sm,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  filtersContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
  },
  filtersScrollView: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  filterTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearButton: {
    color: colors.primary.main,
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  resultIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  resultSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
  },
  resultAction: {
    marginLeft: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateText: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.regular,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});