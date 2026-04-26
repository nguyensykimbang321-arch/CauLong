import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import { formatDatetime, formatPrice, getBookingStatusMeta } from '../../utils/formatters';

export default function BookingDetailScreen({ route, navigation }) {
  const booking = route?.params?.booking;
  const status = getBookingStatusMeta(booking?.status);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Chi tiết booking</Text>
        </View>
        <Badge label={status.label} color={status.color} size="sm" />
      </View>

      <View style={styles.card}>
        <Row label="Sân" value={booking?.court_name} />
        <Row label="Loại" value={booking?.court_type_label} />
        <Row label="Cơ sở" value={booking?.facility_name} />
        <Row label="Bắt đầu" value={formatDatetime(booking?.start_at)} />
        <Row label="Kết thúc" value={formatDatetime(booking?.end_at)} />
        <Row label="Tổng tiền" value={formatPrice(booking?.total_cents)} />
        <Row label="Ghi chú" value={booking?.note || '—'} />
        <Row label="QR" value={booking?.qr_code || '—'} />
      </View>

      <View style={styles.actions}>
        <Button title="Về danh sách" variant="outline" onPress={() => navigation.navigate('MyBookings')} fullWidth={true} />
      </View>
    </Screen>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, marginRight: spacing.sm },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  row: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.semiBold },
  value: { marginTop: 3, fontSize: fontSize.md, color: colors.textPrimary },
  actions: { marginTop: spacing.lg },
});

