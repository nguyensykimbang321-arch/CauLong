import React, { useRef } from 'react';
import { Animated, Pressable, Platform } from 'react-native';
import { coerceBoolean } from '../../utils/coerce';

export default function PressableCard({ children, onPress, disabled = false, style }) {
  const disabledProp = coerceBoolean(disabled);
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabledProp}
        android_ripple={
          Platform.OS === 'android'
            ? { color: 'rgba(46,125,255,0.16)', borderless: false }
            : undefined
        }
        onPressIn={() => {
          Animated.spring(scale, { toValue: 0.99, useNativeDriver: true, speed: 28, bounciness: 0 }).start();
        }}
        onPressOut={() => {
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 6 }).start();
        }}
        style={{ borderRadius: 16, overflow: 'hidden' }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

