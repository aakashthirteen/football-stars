/**
 * Professional Text Components
 * 
 * Semantic text components for the Football Stars app that ensure consistent
 * typography throughout the application. Based on modern sports apps like
 * FIFA, ESPN, and Premier League apps.
 * 
 * Features:
 * - Semantic component names
 * - Automatic color theming
 * - Responsive text scaling
 * - Accessibility compliance
 * - Sports-specific text styles
 * - Performance optimized
 */

import React from 'react';
import { Text, TextProps, TextStyle, Dimensions } from 'react-native';
import { Typography } from '../../theme/typography';
import DesignSystem from '../../theme/designSystem';

const { colors } = DesignSystem;
const screenWidth = Dimensions.get('window').width;

// Base interface for all text components
interface BaseTextProps extends TextProps {
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  responsive?: boolean;
  accessible?: boolean;
  children: React.ReactNode;
}

// Helper function to merge styles
const mergeStyles = (
  baseStyle: TextStyle,
  color?: string,
  align?: string,
  responsive?: boolean,
  accessible?: boolean,
  customStyle?: TextStyle | TextStyle[]
): TextStyle => {
  let style: TextStyle = { ...baseStyle };
  
  // Apply color
  if (color) {
    style.color = color;
  } else {
    style.color = colors.text.primary;
  }
  
  // Apply text alignment
  if (align) {
    style.textAlign = align as any;
  }
  
  // Apply responsive scaling
  if (responsive && style.fontSize) {
    style.fontSize = Typography.utils.getResponsiveFontSize(style.fontSize, screenWidth);
  }
  
  // Apply accessibility improvements
  if (accessible) {
    style = Typography.utils.createAccessibleTextStyle(style as any);
  }
  
  // Merge custom styles
  if (customStyle) {
    if (Array.isArray(customStyle)) {
      style = { ...style, ...Object.assign({}, ...customStyle) };
    } else {
      style = { ...style, ...customStyle };
    }
  }
  
  return style;
};

// === DISPLAY & HERO TEXT COMPONENTS ===

export const HeroText: React.FC<BaseTextProps> = ({
  color,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.hero,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const Display1Text: React.FC<BaseTextProps> = ({
  color,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.display1,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const Display2Text: React.FC<BaseTextProps> = ({
  color,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.display2,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

// === HEADING COMPONENTS ===

export const H1Text: React.FC<BaseTextProps> = ({
  color,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.h1,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const H2Text: React.FC<BaseTextProps> = ({
  color,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.h2,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const H3Text: React.FC<BaseTextProps> = ({
  color,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.h3,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const H4Text: React.FC<BaseTextProps> = ({
  color,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.h4,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const H5Text: React.FC<BaseTextProps> = ({
  color,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.h5,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const H6Text: React.FC<BaseTextProps> = ({
  color,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.h6,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

// === BODY TEXT COMPONENTS ===

export const BodyLargeText: React.FC<BaseTextProps> = ({
  color,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.bodyLarge,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const BodyText: React.FC<BaseTextProps> = ({
  color,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.body,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const BodySmallText: React.FC<BaseTextProps> = ({
  color,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.bodySmall,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const BodyBoldText: React.FC<BaseTextProps> = ({
  color,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.bodyBold,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

// === CAPTION & LABEL COMPONENTS ===

export const CaptionText: React.FC<BaseTextProps> = ({
  color = colors.text.secondary,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.caption,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const CaptionBoldText: React.FC<BaseTextProps> = ({
  color = colors.text.secondary,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.captionBold,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const LabelText: React.FC<BaseTextProps> = ({
  color = colors.text.tertiary,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.label,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const LabelSmallText: React.FC<BaseTextProps> = ({
  color = colors.text.tertiary,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.labelSmall,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

// === BUTTON TEXT COMPONENTS ===

export const ButtonPrimaryText: React.FC<BaseTextProps> = ({
  color = colors.text.inverse,
  align = 'center',
  responsive = false,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.buttonPrimary,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const ButtonSecondaryText: React.FC<BaseTextProps> = ({
  color = colors.primary.main,
  align = 'center',
  responsive = false,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.buttonSecondary,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const ButtonSmallText: React.FC<BaseTextProps> = ({
  color = colors.text.inverse,
  align = 'center',
  responsive = false,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.buttonSmall,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

// === SPORTS-SPECIFIC COMPONENTS ===

export const ScoreMainText: React.FC<BaseTextProps> = ({
  color = colors.text.primary,
  align = 'center',
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.scoreMain,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const ScoreSecondaryText: React.FC<BaseTextProps> = ({
  color = colors.text.primary,
  align = 'center',
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.scoreSecondary,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const TimerText: React.FC<BaseTextProps> = ({
  color = colors.text.primary,
  align = 'center',
  responsive = false,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.timer,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const TimerLargeText: React.FC<BaseTextProps> = ({
  color = colors.text.primary,
  align = 'center',
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.timerLarge,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const StatValueText: React.FC<BaseTextProps> = ({
  color = colors.text.primary,
  align = 'center',
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.statValue,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const StatLabelText: React.FC<BaseTextProps> = ({
  color = colors.text.secondary,
  align = 'center',
  responsive = false,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.statLabel,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const TeamNameText: React.FC<BaseTextProps> = ({
  color = colors.text.primary,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.teamName,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const TeamNameLargeText: React.FC<BaseTextProps> = ({
  color = colors.text.primary,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.teamNameLarge,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const PlayerNameText: React.FC<BaseTextProps> = ({
  color = colors.text.primary,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.playerName,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const PlayerNameLargeText: React.FC<BaseTextProps> = ({
  color = colors.text.primary,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.playerNameLarge,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const MatchEventText: React.FC<BaseTextProps> = ({
  color = colors.text.secondary,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.matchEvent,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const LiveIndicatorText: React.FC<BaseTextProps> = ({
  color = colors.text.inverse,
  align = 'center',
  responsive = false,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.liveIndicator,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const CompetitionText: React.FC<BaseTextProps> = ({
  color = colors.text.secondary,
  align,
  responsive = true,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.competition,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

export const PositionText: React.FC<BaseTextProps> = ({
  color = colors.text.primary,
  align = 'center',
  responsive = false,
  accessible = true,
  style,
  children,
  ...props
}) => (
  <Text
    style={mergeStyles(
      Typography.styles.position,
      color,
      align,
      responsive,
      accessible,
      style
    )}
    {...props}
  >
    {children}
  </Text>
);

// === CONVENIENCE EXPORTS ===

// Main text component for backward compatibility
export const ProfessionalText = BodyText;

// Export all components
export const ProfessionalTextComponents = {
  // Display & Hero
  Hero: HeroText,
  Display1: Display1Text,
  Display2: Display2Text,
  
  // Headings
  H1: H1Text,
  H2: H2Text,
  H3: H3Text,
  H4: H4Text,
  H5: H5Text,
  H6: H6Text,
  
  // Body
  BodyLarge: BodyLargeText,
  Body: BodyText,
  BodySmall: BodySmallText,
  BodyBold: BodyBoldText,
  
  // Caption & Labels
  Caption: CaptionText,
  CaptionBold: CaptionBoldText,
  Label: LabelText,
  LabelSmall: LabelSmallText,
  
  // Buttons
  ButtonPrimary: ButtonPrimaryText,
  ButtonSecondary: ButtonSecondaryText,
  ButtonSmall: ButtonSmallText,
  
  // Sports Specific
  ScoreMain: ScoreMainText,
  ScoreSecondary: ScoreSecondaryText,
  Timer: TimerText,
  TimerLarge: TimerLargeText,
  StatValue: StatValueText,
  StatLabel: StatLabelText,
  TeamName: TeamNameText,
  TeamNameLarge: TeamNameLargeText,
  PlayerName: PlayerNameText,
  PlayerNameLarge: PlayerNameLargeText,
  MatchEvent: MatchEventText,
  LiveIndicator: LiveIndicatorText,
  Competition: CompetitionText,
  Position: PositionText,
};

// Export type definitions
export type ProfessionalTextProps = BaseTextProps;
export type ProfessionalTextComponent = React.FC<BaseTextProps>;