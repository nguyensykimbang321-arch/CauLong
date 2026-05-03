import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import Button from '../../shared/components/Button';
import { formatPrice } from '../../utils/formatters';
import { getCourts, getFacilities, getCourtTypes } from '../../data/mockStore';
import * as api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import PaymentOption from '../../shared/components/PaymentOption';

export default function BookingConfirmScreen({ route, navigation }) {
  const desiredKeys = route?.params?.desiredKeys ?? [];
  const assignment = route?.params?.assignment ?? null;
  const total = route?.params?.total ?? 0;
  const facilityId = route?.params?.facilityId ?? null;
  const sportId = route?.params?.sportId ?? null;
  const date = route?.params?.date ?? null;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [facility, setFacility] = useState(null);
  const [sport, setSport] = useState(null);
  const [courts, setCourts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cod'); 

  useEffect(() => {
    async function loadData() {
      try {
        const [facilities, types, allCourts] = await Promise.all([
          getFacilities(),
          getCourtTypes(),
          getCourts({ facilityId })
        ]);
        setFacility(facilities.find(f => f.id === facilityId));
        setSport(types.find(s => s.id === sportId));
        setCourts(allCourts);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [facilityId, sportId]);

  const courtName = (id) => courts.find((c) => c.id === id)?.name ?? id;
  const sportLabel = sport?.name === 'badminton' ? 'Cầu lông' : sport?.name === 'tennis' ? 'Tennis' : sport?.name === 'table_tennis' ? 'Bóng bàn' : '—';

  const handleConfirm = async () => {
    try {
        setSubmitting(true);
        const pricePerSlot = Math.round(total / desiredKeys.length);
        const slots = assignment.segments.flatMap(seg => seg.keys.map(k => ({
            court_id: seg.courtId,
            start_at: `${date}T${k.split('-')[0]}:00Z`,
            end_at: `${date}T${k.split('-')[1]}:00Z`,
            price_cents: pricePerSlot
        })));

        const response = await api.createBooking({
            facility_id: facilityId,
            total_cents: total,
            note: '',
            payment_method: paymentMethod,
            slots
        });

        if (paymentMethod === 'vnpay' && response?.paymentUrl) {
           navigation.navigate('PaymentWebView', { 
             url: response.paymentUrl,
             onPaymentSuccess: (url) => {
               navigation.navigate('MyBookings');
               Alert.alert('Thành công', 'Thanh toán đặt sân thành công qua VNPay!');
             },
             onPaymentCancel: (url) => {
               Alert.alert('Thông báo', 'Giao dịch đặt sân đã bị hủy.');
             }
           });
        } else {
           Alert.alert('Thành công', 'Đặt sân thành công!', [
               { text: 'OK', onPress: () => navigation.navigate('MyBookings') }
           ]);
        }
    } catch (error) {
        console.error(error);
        Alert.alert('Lỗi', 'Không thể hoàn tất đặt sân. Vui lòng thử lại.');
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) {
      return (
          <Screen>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
              </View>
          </Screen>
      )
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Xác nhận đặt sân</Text>
        <Text style={styles.sub}>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.</Text>

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
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Phương thức thanh toán</Text>
          <PaymentOption 
            label="Thanh toán tại quầy" 
            selected={paymentMethod === 'cod'} 
            onPress={() => setPaymentMethod('cod')} 
            icon="cash-outline"
          />
          <PaymentOption 
            label="VNPay (Thanh toán online)" 
            selected={paymentMethod === 'vnpay'} 
            onPress={() => setPaymentMethod('vnpay')} 
            icon="card-outline"
          />
        </View>

        <View style={styles.actions}>
          <Button 
            title={paymentMethod === 'vnpay' ? "Thanh toán VNPay" : "Xác nhận đặt sân"} 
            onPress={handleConfirm}
            loading={submitting}
            fullWidth={true} 
          />
          <View style={{ height: spacing.sm }} />
          <Button title="Quay lại" variant="outline" onPress={() => navigation.goBack()} fullWidth={true} disabled={submitting} />
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
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semiBold, color: colors.textMuted },
  totalValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary },
  actions: { marginTop: spacing.xl },
  paymentCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  paymentTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  paymentOptionSelected: {
    // borderBottomColor: colors.primary,
  },
  paymentLabel: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: fontWeight.medium },
  paymentLabelSelected: { color: colors.primary, fontWeight: fontWeight.bold },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
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

