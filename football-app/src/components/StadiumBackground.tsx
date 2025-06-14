import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface StadiumBackgroundProps {
  children: React.ReactNode;
}

export const StadiumBackground: React.FC<StadiumBackgroundProps> = ({ children }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer effect
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0E27', '#1A1F3A', '#0A0E27']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Field Pattern */}
      <View style={styles.fieldPattern}>
        <View style={[styles.fieldLine, styles.fieldLine1]} />
        <View style={[styles.fieldLine, styles.fieldLine2]} />
        <View style={[styles.fieldLine, styles.fieldLine3]} />
        <View style={[styles.fieldLine, styles.fieldLine4]} />
        <View style={[styles.fieldLine, styles.fieldLine5]} />
      </View>
      
      {/* Subtle Glow Effect */}
      <Animated.View
        style={[
          styles.glowEffect,
          {
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.1, 0.3, 0.1],
            }),
          },
        ]}
      />
      
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  fieldPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fieldLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  fieldLine1: {
    top: '20%',
  },
  fieldLine2: {
    top: '40%',
  },
  fieldLine3: {
    top: '60%',
  },
  fieldLine4: {
    top: '80%',
  },
  fieldLine5: {
    top: '50%',
    height: 2,
    backgroundColor: 'rgba(46, 125, 50, 0.15)',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
});