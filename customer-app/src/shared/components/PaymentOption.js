import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentOption({ label, selected, onPress, icon }) {
  return (
    <Pressable 
      onPress={onPress}
      style={[
        styles.paymentOption, 
        selected && styles.paymentOptionSelected
      ]}
    >
      <View style={styles.leftRow}>
        {icon && <Ionicons name={icon} size={20} color={selected ? colors.primary : colors.textMuted} style={styles.icon} />}
        <Text style={[styles.paymentLabel, selected && styles.paymentLabelSelected]}>{label}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFBFF',
    marginBottom: spacing.sm,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paymentLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  paymentLabelSelected: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});
