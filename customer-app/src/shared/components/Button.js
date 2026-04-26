import React, { useMemo, useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { coerceBoolean } from '../../utils/coerce';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  style,
}) {
  const loading = coerceBoolean(isLoading);
  const disabledProp = coerceBoolean(disabled);
  const fullWidthProp = coerceBoolean(fullWidth);

  const isDisabled = disabledProp || loading;
  const scale = useRef(new Animated.Value(1)).current;

  const containerStyles = useMemo(
    () => ([
      styles.base,
      styles[variant],
      styles[`size_${size}`],
      fullWidthProp && styles.fullWidth,
      isDisabled && styles.disabled,
      style,
    ].filter(Boolean)),
    [variant, size, fullWidthProp, isDisabled, style]
  );

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    isDisabled && styles.textDisabled,
  ];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        android_ripple={
          Platform.OS === 'android'
            ? { color: 'rgba(255,255,255,0.22)', borderless: false }
            : undefined
        }
        onPressIn={() => {
          Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, speed: 30, bounciness: 0 }).start();
        }}
        onPressOut={() => {
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
        }}
        style={containerStyles}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} size="small" />
        ) : (
          <Text style={textStyles}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    ...shadow.sm,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryLight },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  danger: { backgroundColor: colors.danger },
  size_sm: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md },
  size_md: { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg },
  size_lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.55 },
  text: { fontWeight: fontWeight.semiBold },
  text_primary: { color: colors.white },
  text_secondary: { color: colors.primaryDark ?? colors.primary },
  text_outline: { color: colors.textPrimary },
  text_danger: { color: colors.white },
  textSize_sm: { fontSize: fontSize.sm },
  textSize_md: { fontSize: fontSize.md },
  textSize_lg: { fontSize: fontSize.lg },
  textDisabled: { opacity: 0.7 },
});

