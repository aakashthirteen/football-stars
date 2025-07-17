import React from 'react';
import { Dimensions, Platform } from 'react-native';
import { ProfessionalHeader } from './ProfessionalHeader';
import { ProfessionalSearchHeader } from './ProfessionalSearchHeader';
import { ProfessionalMatchHeader } from './ProfessionalMatchHeader';
import { ProfessionalProfileHeader } from './ProfessionalProfileHeader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device type detection
const isTablet = screenWidth >= 768;
const isLargePhone = screenWidth >= 414;
const isSmallPhone = screenWidth < 375;

// Header type definitions
export type HeaderType = 
  | 'default'
  | 'search'
  | 'match'
  | 'profile'
  | 'minimal'
  | 'transparent'
  | 'centered';

// Screen context types
export type ScreenContext = 
  | 'home'
  | 'teams'
  | 'matches'
  | 'tournaments'
  | 'profile'
  | 'search'
  | 'settings'
  | 'live-match'
  | 'match-details';

// Responsive configuration
const getResponsiveConfig = () => ({
  isTablet,
  isLargePhone,
  isSmallPhone,
  screenWidth,
  screenHeight,
  // Responsive typography
  titleSize: isTablet ? 28 : isLargePhone ? 24 : 22,
  subtitleSize: isTablet ? 16 : 14,
  // Responsive spacing
  padding: isTablet ? 24 : 20,
  headerHeight: isTablet ? 200 : isLargePhone ? 180 : 160,
  // Icon sizes
  iconSize: isTablet ? 28 : 24,
  actionIconSize: isTablet ? 24 : 22,
});

// Header configuration based on screen context
const getHeaderConfig = (
  context: ScreenContext,
  type?: HeaderType
): {
  variant: string;
  showBack: boolean;
  showSearch: boolean;
  showNotifications: boolean;
  showProfile: boolean;
  showMenu: boolean;
  centerTitle: boolean;
  animateOnMount: boolean;
  transparent: boolean;
} => {
  const baseConfig = {
    variant: 'default',
    showBack: false,
    showSearch: false,
    showNotifications: false,
    showProfile: false,
    showMenu: false,
    centerTitle: false,
    animateOnMount: true,
    transparent: false,
  };

  switch (context) {
    case 'home':
      return {
        ...baseConfig,
        variant: 'default',
        showNotifications: true,
        showProfile: true,
        showSearch: true,
      };

    case 'teams':
    case 'matches':
    case 'tournaments':
      return {
        ...baseConfig,
        variant: 'default',
        showBack: false,
        showSearch: true,
        showNotifications: true,
        showProfile: true,
      };

    case 'profile':
      return {
        ...baseConfig,
        variant: 'profile',
        showBack: true,
        showMenu: true,
      };

    case 'search':
      return {
        ...baseConfig,
        variant: 'search',
        showBack: true,
      };

    case 'live-match':
    case 'match-details':
      return {
        ...baseConfig,
        variant: 'match',
        showBack: true,
        showNotifications: true,
        centerTitle: true,
      };

    case 'settings':
      return {
        ...baseConfig,
        variant: 'minimal',
        showBack: true,
        centerTitle: true,
      };

    default:
      return {
        ...baseConfig,
        showBack: true,
        centerTitle: type === 'centered',
        transparent: type === 'transparent',
        variant: type || 'default',
      };
  }
};

// Accessibility helpers
const getAccessibilityProps = (context: ScreenContext) => ({
  accessibilityRole: 'header' as const,
  accessibilityLabel: `${context} screen header`,
  importantForAccessibility: 'yes' as const,
});

// Main Header System Component
interface HeaderSystemProps {
  context: ScreenContext;
  type?: HeaderType;
  title?: string;
  subtitle?: string;
  user?: any;
  match?: any;
  timer?: any;
  stats?: any;
  searchProps?: any;
  onBack?: () => void;
  onSearch?: () => void;
  onNotifications?: () => void;
  onProfile?: () => void;
  onMenu?: () => void;
  onSettings?: () => void;
  customProps?: any;
  children?: React.ReactNode;
}

export const ProfessionalHeaderSystem: React.FC<HeaderSystemProps> = ({
  context,
  type,
  title,
  subtitle,
  user,
  match,
  timer,
  stats,
  searchProps,
  onBack,
  onSearch,
  onNotifications,
  onProfile,
  onMenu,
  onSettings,
  customProps,
  children,
}) => {
  const config = getHeaderConfig(context, type);
  const responsiveConfig = getResponsiveConfig();
  const accessibilityProps = getAccessibilityProps(context);

  // Search Header
  if (context === 'search' || type === 'search') {
    return (
      <ProfessionalSearchHeader
        onBack={onBack}
        {...searchProps}
        {...accessibilityProps}
        autoFocus={true}
      />
    );
  }

  // Match Header
  if (context === 'live-match' || context === 'match-details' || type === 'match') {
    if (!match) {
      console.warn('HeaderSystem: Match header requested but no match data provided');
      return null;
    }
    
    return (
      <ProfessionalMatchHeader
        match={match}
        timer={timer}
        onBack={onBack}
        competition={match.competition}
        {...customProps}
        {...accessibilityProps}
      />
    );
  }

  // Profile Header
  if (context === 'profile' || type === 'profile') {
    if (!user) {
      console.warn('HeaderSystem: Profile header requested but no user data provided');
      return null;
    }

    return (
      <ProfessionalProfileHeader
        user={user}
        stats={stats}
        onBack={onBack}
        onSettings={onSettings}
        {...customProps}
        {...accessibilityProps}
      />
    );
  }

  // Default/Enhanced Header
  return (
    <ProfessionalHeader
      title={title}
      subtitle={subtitle}
      variant={config.variant as any}
      showBack={config.showBack}
      showSearch={config.showSearch}
      showNotifications={config.showNotifications}
      showProfile={config.showProfile}
      showMenu={config.showMenu}
      centerTitle={config.centerTitle}
      animateOnMount={config.animateOnMount}
      transparent={config.transparent}
      onBack={onBack}
      onSearch={onSearch}
      onNotifications={onNotifications}
      onProfile={onProfile}
      onMenu={onMenu}
      profileData={user}
      {...customProps}
      {...accessibilityProps}
    >
      {children}
    </ProfessionalHeader>
  );
};

// Convenience hooks and utilities
export const useResponsiveHeader = () => {
  return getResponsiveConfig();
};

export const getHeaderHeight = (context: ScreenContext, type?: HeaderType) => {
  const config = getResponsiveConfig();
  
  switch (context) {
    case 'profile':
      return config.isTablet ? 320 : 280;
    case 'live-match':
    case 'match-details':
      return config.isTablet ? 260 : 220;
    case 'search':
      return config.isTablet ? 120 : 100;
    default:
      return config.headerHeight;
  }
};

// Pre-configured header components for common use cases
export const HomeHeader: React.FC<{
  user?: any;
  onSearch?: () => void;
  onNotifications?: () => void;
  onProfile?: () => void;
  children?: React.ReactNode;
}> = (props) => (
  <ProfessionalHeaderSystem
    context="home"
    {...props}
  />
);

export const TeamsHeader: React.FC<{
  onSearch?: () => void;
  onNotifications?: () => void;
  onProfile?: () => void;
}> = (props) => (
  <ProfessionalHeaderSystem
    context="teams"
    title="Teams"
    subtitle="Manage your football teams"
    {...props}
  />
);

export const MatchesHeader: React.FC<{
  onSearch?: () => void;
  onNotifications?: () => void;
  onProfile?: () => void;
}> = (props) => (
  <ProfessionalHeaderSystem
    context="matches"
    title="Matches"
    subtitle="Track your football matches"
    {...props}
  />
);

export const TournamentsHeader: React.FC<{
  onSearch?: () => void;
  onNotifications?: () => void;
  onProfile?: () => void;
}> = (props) => (
  <ProfessionalHeaderSystem
    context="tournaments"
    title="Tournaments"
    subtitle="Compete in football tournaments"
    {...props}
  />
);

export const SearchHeader: React.FC<{
  onBack?: () => void;
  onSearch?: () => void;
  searchResults?: any[];
  placeholder?: string;
}> = (props) => (
  <ProfessionalHeaderSystem
    context="search"
    searchProps={props}
    {...props}
  />
);

export const ProfileHeader: React.FC<{
  user: any;
  stats?: any;
  onBack?: () => void;
  onSettings?: () => void;
  editable?: boolean;
}> = (props) => (
  <ProfessionalHeaderSystem
    context="profile"
    {...props}
  />
);

export const LiveMatchHeader: React.FC<{
  match: any;
  timer: any;
  onBack?: () => void;
  onEndMatch?: () => void;
}> = (props) => (
  <ProfessionalHeaderSystem
    context="live-match"
    customProps={{ onEndMatch: props.onEndMatch }}
    {...props}
  />
);

export const MatchDetailsHeader: React.FC<{
  match: any;
  onBack?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
}> = (props) => (
  <ProfessionalHeaderSystem
    context="match-details"
    customProps={{ 
      onShare: props.onShare,
      onFavorite: props.onFavorite,
      showActions: true
    }}
    {...props}
  />
);

// Export individual components for direct use
export {
  ProfessionalHeader,
  ProfessionalSearchHeader,
  ProfessionalMatchHeader,
  ProfessionalProfileHeader,
};

// Export types
export type { HeaderSystemProps };