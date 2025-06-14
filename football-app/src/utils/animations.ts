import { Animated, Easing } from 'react-native';

// Beautiful animation utilities for the football app

export const ANIMATION_CONFIG = {
  DURATIONS: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
    VERY_SLOW: 800,
  },
  EASING: {
    EASE_OUT: Easing.out(Easing.cubic),
    EASE_IN: Easing.in(Easing.cubic),
    EASE_IN_OUT: Easing.inOut(Easing.cubic),
    BOUNCE: Easing.bounce,
    ELASTIC: Easing.elastic(1),
  },
};

// Beautiful entrance animations
export const createEntranceAnimation = (
  opacity: Animated.Value,
  translateY: Animated.Value,
  scale: Animated.Value = new Animated.Value(0.95)
) => {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration: ANIMATION_CONFIG.DURATIONS.SLOW,
      easing: ANIMATION_CONFIG.EASING.EASE_OUT,
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 0,
      duration: ANIMATION_CONFIG.DURATIONS.SLOW,
      easing: ANIMATION_CONFIG.EASING.EASE_OUT,
      useNativeDriver: true,
    }),
    Animated.timing(scale, {
      toValue: 1,
      duration: ANIMATION_CONFIG.DURATIONS.SLOW,
      easing: ANIMATION_CONFIG.EASING.EASE_OUT,
      useNativeDriver: true,
    }),
  ]);
};

// Goal celebration animation
export const createGoalCelebrationAnimation = (
  scale: Animated.Value,
  rotation: Animated.Value,
  opacity: Animated.Value
) => {
  return Animated.sequence([
    // Scale up with rotation
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1.5,
        duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
        easing: ANIMATION_CONFIG.EASING.EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 1,
        duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
        easing: ANIMATION_CONFIG.EASING.EASE_OUT,
        useNativeDriver: true,
      }),
    ]),
    // Bounce effect
    Animated.timing(scale, {
      toValue: 1.2,
      duration: ANIMATION_CONFIG.DURATIONS.FAST,
      easing: ANIMATION_CONFIG.EASING.BOUNCE,
      useNativeDriver: true,
    }),
    // Return to normal
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
        easing: ANIMATION_CONFIG.EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.8,
        duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
        easing: ANIMATION_CONFIG.EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
    ]),
  ]);
};

// Staggered list animation
export const createStaggeredAnimation = (
  items: Animated.Value[],
  delay: number = 100
) => {
  return Animated.stagger(
    delay,
    items.map(item =>
      Animated.timing(item, {
        toValue: 1,
        duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
        easing: ANIMATION_CONFIG.EASING.EASE_OUT,
        useNativeDriver: true,
      })
    )
  );
};

// Pulse animation for live indicators
export const createPulseAnimation = (scale: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.2,
        duration: ANIMATION_CONFIG.DURATIONS.SLOW,
        easing: ANIMATION_CONFIG.EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: ANIMATION_CONFIG.DURATIONS.SLOW,
        easing: ANIMATION_CONFIG.EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
    ])
  );
};

// Floating animation for cards
export const createFloatingAnimation = (translateY: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(translateY, {
        toValue: -5,
        duration: 2000,
        easing: ANIMATION_CONFIG.EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 2000,
        easing: ANIMATION_CONFIG.EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
    ])
  );
};

// Shimmer loading animation
export const createShimmerAnimation = (translateX: Animated.Value, width: number) => {
  return Animated.loop(
    Animated.timing(translateX, {
      toValue: width * 2,
      duration: 1500,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

// Button press animation
export const createButtonPressAnimation = (
  scale: Animated.Value,
  onPress: () => void
) => {
  return () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: ANIMATION_CONFIG.DURATIONS.FAST,
        easing: ANIMATION_CONFIG.EASING.EASE_IN,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: ANIMATION_CONFIG.DURATIONS.FAST,
        easing: ANIMATION_CONFIG.EASING.EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start(() => onPress());
  };
};

// Ball rolling animation
export const createBallRollingAnimation = (
  translateX: Animated.Value,
  rotation: Animated.Value,
  screenWidth: number
) => {
  return Animated.loop(
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: screenWidth,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ])
  );
};

// Score increment animation
export const createScoreIncrementAnimation = (
  scale: Animated.Value,
  translateY: Animated.Value,
  opacity: Animated.Value
) => {
  return Animated.parallel([
    Animated.timing(scale, {
      toValue: 1.5,
      duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
      easing: ANIMATION_CONFIG.EASING.EASE_OUT,
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: -20,
      duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
      easing: ANIMATION_CONFIG.EASING.EASE_OUT,
      useNativeDriver: true,
    }),
    Animated.timing(opacity, {
      toValue: 0,
      duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
      easing: ANIMATION_CONFIG.EASING.EASE_OUT,
      useNativeDriver: true,
    }),
  ]);
};

// Trophy sparkle animation
export const createTrophySparkleAnimation = (
  sparkles: Animated.Value[],
  rotations: Animated.Value[]
) => {
  return Animated.loop(
    Animated.stagger(200, [
      ...sparkles.map(sparkle =>
        Animated.sequence([
          Animated.timing(sparkle, {
            toValue: 1,
            duration: 800,
            easing: ANIMATION_CONFIG.EASING.EASE_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(sparkle, {
            toValue: 0,
            duration: 800,
            easing: ANIMATION_CONFIG.EASING.EASE_IN,
            useNativeDriver: true,
          }),
        ])
      ),
      ...rotations.map(rotation =>
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1600,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ])
  );
};

// Page transition animation
export const createPageTransitionAnimation = (
  currentOpacity: Animated.Value,
  currentTranslateX: Animated.Value,
  nextOpacity: Animated.Value,
  nextTranslateX: Animated.Value
) => {
  return Animated.parallel([
    // Current page slides out
    Animated.parallel([
      Animated.timing(currentOpacity, {
        toValue: 0,
        duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
        easing: ANIMATION_CONFIG.EASING.EASE_IN,
        useNativeDriver: true,
      }),
      Animated.timing(currentTranslateX, {
        toValue: -100,
        duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
        easing: ANIMATION_CONFIG.EASING.EASE_IN,
        useNativeDriver: true,
      }),
    ]),
    // Next page slides in
    Animated.parallel([
      Animated.timing(nextOpacity, {
        toValue: 1,
        duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
        easing: ANIMATION_CONFIG.EASING.EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(nextTranslateX, {
        toValue: 0,
        duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
        easing: ANIMATION_CONFIG.EASING.EASE_OUT,
        useNativeDriver: true,
      }),
    ]),
  ]);
};

// Loading wave animation
export const createLoadingWaveAnimation = (waves: Animated.Value[]) => {
  return Animated.loop(
    Animated.stagger(
      150,
      waves.map(wave =>
        Animated.sequence([
          Animated.timing(wave, {
            toValue: 1,
            duration: 600,
            easing: ANIMATION_CONFIG.EASING.EASE_IN_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(wave, {
            toValue: 0.3,
            duration: 600,
            easing: ANIMATION_CONFIG.EASING.EASE_IN_OUT,
            useNativeDriver: true,
          }),
        ])
      )
    )
  );
};