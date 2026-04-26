import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import Button from '../../shared/components/Button';
import { formatPrice } from '../../utils/formatters';
import { getCourts, getFacilities, getCourtTypes } from '../../data/mockStore';

export default function BookingConfirmScreen({ route, navigation }) {
  const desiredKeys = route?.params?.desiredKeys ?? [];
  const assignment = route?.params?.assignment ?? null;
  const total = route?.params?.total ?? 0;
  const facilityId = route?.params?.facilityId ?? null;
  const sportId = route?.params?.sportId ?? null;
  const date = route?.params?.date ?? null;

  const facility = getFacilities().find((f) => f.id === facilityId);
  const sport = getCourtTypes().find((s) => s.id === sportId);
  const courts = getCourts({ facilityId });
  const courtName = (id) => courts.find((c) => c.id === id)?.name ?? id;

  const sportLabel = sport?.name === 'badminton' ? 'Cầu lông' : sport?.name === 'tennis' ? 'Tennis' : sport?.name === 'table_tennis' ? 'Bóng bàn' : '—';

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Xác nhận đặt sân</Text>
        <Text style={styles.sub}>Demo mock: chưa gọi backend, chỉ hiển thị tạm.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Thông tin</Text>
          <Text style={styles.meta}>Cơ sở: {facility?.name ?? '—'}</Text>
          <Text style={styles.meta}>Bộ môn: {sportLabel}</Text>
          <Text style={styles.meta}>Ngày: {date ?? '—'}</Text>
          <Text style={styles.meta}>
            Sân: {assignment?.segments?.length === 1 ? courtName(assignment.segments[0].courtId) : 'Tự động (nhiều sân)'}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.label}>Khung giờ</Text>
          {desiredKeys.length ? (
            <Text style={styles.item}>
              - {desiredKeys[0].split('-')[0]} – {desiredKeys[desiredKeys.length - 1].split('-')[1]} ({desiredKeys.length} giờ)
            </Text>
          ) : <Text style={styles.item}>—</Text>}

          {assignment?.segments?.length ? (
            <>
              <View style={styles.divider} />
              <View style={styles.assignmentHeader}>
                <Ionicons 
                  name={assignment.segments.length === 1 ? "location" : "swap-horizontal"} 
                  size={16} 
                  color={assignment.segments.length === 1 ? colors.primary : colors.accent} 
                />
                <Text style={styles.label}>Chi tiết sân/bàn</Text>
              </View>
              {assignment.segments.map((seg, idx) => (
                <View key={`${seg.courtId}_${idx}`} style={styles.assignmentRow}>
                   <Text style={styles.assignmentSlot}>{seg.keys[0].split('-')[0]} – {seg.keys[seg.keys.length - 1].split('-')[1]}</Text>
                   <Text style={styles.assignmentCourt}>{courtName(seg.courtId)}</Text>
                </View>
              ))}
            </>
          ) : null}

          {assignment?.warnings?.length ? (
            <View style={styles.warnBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="alert-circle" size={16} color="#9A3412" />
                <Text style={{ fontSize: fontSize.xs, fontWeight: 'bold', color: '#9A3412' }}>Lưu ý chuyển sân</Text>
              </View>
              {assignment.warnings.map((w, idx) => (
                <Text key={idx} style={styles.warnText}>{w}</Text>
              ))}
            </View>
          ) : null}
          <View style={styles.divider} />
          <Text style={styles.total}>Tổng: {formatPrice(total)}</Text>
        </View>

        <View style={styles.actions}>
          <Button title="Xác nhận (mock)" onPress={() => navigation.navigate('MyBookings')} fullWidth={true} />
          <View style={{ height: spacing.sm }} />
          <Button title="Quay lại" variant="outline" onPress={() => navigation.goBack()} fullWidth={true} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sub: { marginTop: 6, fontSize: fontSize.sm, color: colors.textMuted },
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  label: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.semiBold, marginBottom: spacing.sm },
  assignmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  assignmentRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  assignmentSlot: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  assignmentCourt: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.bold },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 6, fontWeight: fontWeight.semiBold },
  item: { fontSize: fontSize.md, color: colors.textPrimary, marginBottom: 6 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  total: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },
  actions: { marginTop: spacing.lg },
  warnBox: {
    marginTop: spacing.sm,
    backgroundColor: '#FFF7ED',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: spacing.md,
  },
  warnText: { fontSize: fontSize.sm, color: '#9A3412', fontWeight: fontWeight.semiBold, lineHeight: 18 },
});

