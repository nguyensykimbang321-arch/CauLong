import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { coerceBoolean } from '../../utils/coerce';

export default function Badge({
  label,
  color = colors.primary,
  size = 'md',
  onPress,
  pressable = false,
}) {
  const isSmall = size === 'sm';
  const isPressable = coerceBoolean(pressable) || typeof onPress === 'function';

  const containerStyle = [
    styles.badge,
    { backgroundColor: color + '18', borderColor: color },
    isSmall && styles.badgeSm,
  ];

  const textStyle = [
    styles.label,
    { color },
    isSmall && styles.labelSm,
  ];

  const content = (
    <View style={containerStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );

  if (!isPressable) return content;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  labelSm: {
    fontSize: fontSize.xs,
  },
});

