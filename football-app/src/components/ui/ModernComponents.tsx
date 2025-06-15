import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { BorderRadius, Spacing } from '../../theme/styles';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, onPress }) => {
  const content = (
    <View style={[styles.glassCard, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

interface TabBarProps {
  tabs: string[];
  activeTab: number;
  onTabPress: (index: number) => void;
  style?: ViewStyle;
}

export const ModernTabBar: React.FC<TabBarProps> = ({ 
  tabs, 
  activeTab, 
  onTabPress,
  style 
}) => {
  return (
    <View style={[styles.tabContainer, style]}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.tabItem,
            activeTab === index && styles.tabItemActive
          ]}
          onPress={() => onTabPress(index)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            activeTab === index && styles.tabTextActive
          ]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

interface LiveBadgeProps {
  minute?: number;
  style?: ViewStyle;
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({ minute, style }) => {
  return (
    <View style={[styles.liveBadge, style]}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>
        LIVE {minute ? `${minute}'` : ''}
      </Text>
    </View>
  );
};

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, icon, style }) => {
  return (
    <View style={[styles.statCard, style]}>
      {icon && <Text style={styles.statIcon}>{icon}</Text>}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Glass Card Styles
  glassCard: {
    backgroundColor: Colors.glass.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.glow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
    overflow: 'hidden',
  },

  // Tab Bar Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    gap: 4, // Proper spacing between tabs
  },
  
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tabItemActive: {
    backgroundColor: Colors.primary.main,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary.glow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: Colors.text.tertiary,
  },
  
  tabTextActive: {
    color: Colors.text.primary,
  },

  // Live Badge Styles
  liveBadge: {
    backgroundColor: Colors.live.background,
    borderWidth: 1,
    borderColor: Colors.live.main,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.live.main,
  },
  
  liveText: {
    color: Colors.live.main,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Stat Card Styles
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.light,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary.main,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
