import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import Badge from './Badge';
import { formatDatetime, formatPrice, getBookingStatusMeta } from '../../utils/formatters';

export default function BookingCard({ booking, onPress }) {
  const statusMeta = getBookingStatusMeta(booking?.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.courtType}>{booking?.court_type_label}</Text>
          <Text style={styles.courtName}>{booking?.court_name}</Text>
        </View>
        <Badge label={statusMeta.label} color={statusMeta.color} size="sm" />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
        <Text style={styles.infoText}>{booking?.date}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
        <Text style={styles.infoText}>
          {formatDatetime(booking?.start_at)} – {formatDatetime(booking?.end_at).slice(-5)}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>{formatPrice(booking?.total_cents)}</Text>
        {booking?.status === 'confirmed' ? (
          <View style={styles.qrHint}>
            <Ionicons name="qr-code-outline" size={14} color={colors.primary} />
            <Text style={styles.qrText}>Xem QR</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: { flex: 1, marginRight: spacing.sm },
  courtType: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  courtName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  price: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  qrHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qrText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.medium },
});

