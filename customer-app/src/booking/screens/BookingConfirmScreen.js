import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Pressable } from 'react-native';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import Button from '../../shared/components/Button';
import { formatPrice } from '../../utils/formatters';
import { getFacilities, getCourtTypes } from '../../data/mockStore';
import * as api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

/** Tính text thời lượng từ "HH:mm" → "HH:mm" */
function calcDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return '';
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h > 0 ? h + ' tiếng' : ''}${m > 0 ? ` ${m} phút` : ''}`.trim();
}

const PAYMENT_OPTIONS = [
  { key: 'cash', label: 'Tại sân', icon: 'cash-outline' },
  { key: 'vnpay', label: 'VNPay', icon: 'card-outline' },
];

/** Mini selector chọn phương thức thanh toán cho từng booking */
function PaymentMethodChip({ value, onChange }) {
  return (
    <View style={chipStyles.container}>
      {PAYMENT_OPTIONS.map((opt) => {
        const isSelected = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[chipStyles.chip, isSelected && chipStyles.chipSelected]}
          >
            <Ionicons
              name={opt.icon}
              size={13}
              color={isSelected ? colors.white : colors.textMuted}
            />
            <Text style={[chipStyles.chipText, isSelected && chipStyles.chipTextSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFBFF',
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
});

export default function BookingConfirmScreen({ route, navigation }) {
  const selections = route?.params?.selections ?? null;
  const facilityId = route?.params?.facilityId ?? null;
  const sportId = route?.params?.sportId ?? null;
  const sportNameParam = route?.params?.sportName ?? '';
  const date = route?.params?.date ?? null;
  const total = route?.params?.total ?? 0;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [facility, setFacility] = useState(null);
  const [sport, setSport] = useState(null);
  const isSubmittingRef = useRef(false);

  // Mỗi booking item có phương thức thanh toán riêng: { 0: 'cash', 1: 'vnpay', ... }
  const [paymentMethods, setPaymentMethods] = useState({});

  const bookingList = useMemo(
    () => (selections && selections.length > 0 ? selections : []),
    [selections],
  );

  // Khởi tạo tất cả booking mặc định là 'cash'
  useEffect(() => {
    const initial = {};
    bookingList.forEach((_, idx) => { initial[idx] = 'cash'; });
    setPaymentMethods(initial);
  }, [bookingList]);

  const handlePaymentChange = useCallback((idx, method) => {
    setPaymentMethods(prev => ({ ...prev, [idx]: method }));
  }, []);

  /** Đặt tất cả cùng 1 phương thức (nút tiện ích) */
  const setAllPaymentMethod = useCallback((method) => {
    setPaymentMethods(prev => {
      const next = {};
      Object.keys(prev).forEach(k => { next[k] = method; });
      return next;
    });
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [facilities, types] = await Promise.all([
          getFacilities(),
          getCourtTypes(facilityId),
        ]);
        setFacility(facilities.find(f => f.id === facilityId));
        setSport(types.find(s => s.id === sportId));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [facilityId, sportId]);

  const getSportLabel = () => {
    const name = sport?.name || sportNameParam;
    return { badminton: 'Cầu lông', tennis: 'Tennis', football: 'Bóng đá', table_tennis: 'Bóng bàn' }[name] || name || '—';
  };

  // Tổng tiền theo từng phương thức
  const { totalPrice, cashTotal, vnpayTotal, cashCount, vnpayCount } = useMemo(() => {
    let cashSum = 0, vnpaySum = 0, cCount = 0, vCount = 0;
    bookingList.forEach((sel, idx) => {
      const price = sel.price || 0;
      if (paymentMethods[idx] === 'vnpay') {
        vnpaySum += price;
        vCount++;
      } else {
        cashSum += price;
        cCount++;
      }
    });
    return {
      totalPrice: cashSum + vnpaySum,
      cashTotal: cashSum,
      vnpayTotal: vnpaySum,
      cashCount: cCount,
      vnpayCount: vCount,
    };
  }, [bookingList, paymentMethods]);

  /** Tạo booking – gọi batch API để gom VNPay */
  const handleConfirm = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      if (bookingList.length === 0) {
        Alert.alert('Lỗi', 'Không có khung giờ nào được chọn.');
        return;
      }

      // Gom tất cả booking thành 1 batch request
      const batchItems = bookingList.map((sel, idx) => ({
        facility_id: facilityId,
        court_id: sel.courtId,
        date: date,
        start_time: sel.startTime,
        end_time: sel.endTime,
        payment_method: paymentMethods[idx] || 'cash',
      }));

      const result = await api.createBatchBooking(batchItems);

      // Nếu có booking VNPay → chuyển đến trang thanh toán
      if (result?.paymentUrl) {
        if (cashCount > 0) {
          Alert.alert(
            'Đặt sân thành công! 🎉',
            `${cashCount} khung giờ trả tại sân đã được đặt.\nChuyển đến thanh toán VNPay cho ${vnpayCount} khung giờ còn lại.`,
            [{ text: 'Thanh toán ngay', onPress: () => {
              navigation.navigate('PaymentWebView', {
                url: result.paymentUrl,
                type: 'booking',
              });
            }}],
          );
        } else {
          navigation.navigate('PaymentWebView', {
            url: result.paymentUrl,
            type: 'booking',
          });
        }
      } else {
        Alert.alert(
          'Thành công! 🎉',
          `Đã đặt ${bookingList.length} khung giờ thành công!`,
          [{
            text: 'OK',
            onPress: () => navigation.reset({
              index: 1,
              routes: [{ name: 'Booking' }, { name: 'MyBookings' }],
            }),
          }],
        );
      }
    } catch (error) {
      console.error('Lỗi đặt sân:', error.response?.data || error.message);
      const msg = error.response?.data?.message || 'Không thể hoàn tất đặt sân. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const isAllSameMethod = Object.values(paymentMethods).every(m => m === 'cash')
    || Object.values(paymentMethods).every(m => m === 'vnpay');

  /** Tạo label cho nút xác nhận */
  const getConfirmLabel = () => {
    if (vnpayCount > 0 && cashCount > 0) {
      return `Xác nhận (${cashCount} tại sân + ${vnpayCount} VNPay)`;
    }
    if (vnpayCount > 0) return `Thanh toán VNPay (${vnpayCount})`;
    return `Xác nhận ${cashCount} khung giờ`;
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Xác nhận đặt sân</Text>
        <Text style={styles.sub}>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.</Text>

        {/* Thông tin chung */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Thông tin chung</Text>
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={15} color={colors.textMuted} />
            <Text style={styles.infoText}>Cơ sở: <Text style={styles.infoValue}>{facility?.name ?? '—'}</Text></Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="tennisball-outline" size={15} color={colors.textMuted} />
            <Text style={styles.infoText}>Bộ môn: <Text style={styles.infoValue}>{getSportLabel()}</Text></Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
            <Text style={styles.infoText}>Ngày: <Text style={styles.infoValue}>{date ?? '—'}</Text></Text>
          </View>
        </View>

        {/* Danh sách các khung giờ + chọn phương thức từng cái */}
        <View style={styles.card}>
          <View style={styles.bookingHeader}>
            <Text style={styles.sectionLabel}>{bookingList.length} khung giờ</Text>
            {/* Nút chọn nhanh tất cả */}
            {bookingList.length > 1 && (
              <View style={styles.quickSetRow}>
                <Text style={styles.quickSetLabel}>Tất cả:</Text>
                <Pressable
                  onPress={() => setAllPaymentMethod('cash')}
                  style={[styles.quickSetBtn, isAllSameMethod && Object.values(paymentMethods)[0] === 'cash' && styles.quickSetBtnActive]}
                >
                  <Text style={[styles.quickSetBtnText, isAllSameMethod && Object.values(paymentMethods)[0] === 'cash' && styles.quickSetBtnTextActive]}>
                    Tại sân
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setAllPaymentMethod('vnpay')}
                  style={[styles.quickSetBtn, isAllSameMethod && Object.values(paymentMethods)[0] === 'vnpay' && styles.quickSetBtnActive]}
                >
                  <Text style={[styles.quickSetBtnText, isAllSameMethod && Object.values(paymentMethods)[0] === 'vnpay' && styles.quickSetBtnTextActive]}>
                    VNPay
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {bookingList.map((sel, idx) => (
            <View key={sel.id ?? idx} style={[styles.bookingItem, idx === bookingList.length - 1 && styles.bookingItemLast]}>
              <View style={styles.bookingItemTop}>
                <View style={styles.bookingItemLeft}>
                  <View style={styles.bookingIndex}>
                    <Text style={styles.bookingIndexText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookingCourtName}>{sel.courtName}</Text>
                    <Text style={styles.bookingTime}>
                      {sel.startTime} → {sel.endTime}
                      {'  '}
                      <Text style={styles.bookingDuration}>{calcDuration(sel.startTime, sel.endTime)}</Text>
                    </Text>
                  </View>
                </View>
                <Text style={styles.bookingPrice}>
                  {sel.price > 0 ? formatPrice(sel.price) : '—'}
                </Text>
              </View>
              {/* Chọn phương thức thanh toán cho item này */}
              <View style={styles.bookingPaymentRow}>
                <PaymentMethodChip
                  value={paymentMethods[idx] || 'cash'}
                  onChange={(method) => handlePaymentChange(idx, method)}
                />
              </View>
            </View>
          ))}

          <View style={styles.divider} />

          {/* Tổng tiền tách theo phương thức */}
          {cashCount > 0 && vnpayCount > 0 ? (
            <>
              <View style={styles.subtotalRow}>
                <View style={styles.subtotalLeft}>
                  <Ionicons name="cash-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.subtotalLabel}>Tại sân ({cashCount})</Text>
                </View>
                <Text style={styles.subtotalValue}>{formatPrice(cashTotal)}</Text>
              </View>
              <View style={styles.subtotalRow}>
                <View style={styles.subtotalLeft}>
                  <Ionicons name="card-outline" size={14} color={colors.primary} />
                  <Text style={[styles.subtotalLabel, { color: colors.primary }]}>VNPay ({vnpayCount})</Text>
                </View>
                <Text style={[styles.subtotalValue, { color: colors.primary }]}>{formatPrice(vnpayTotal)}</Text>
              </View>
              <View style={[styles.divider, { marginTop: spacing.xs }]} />
            </>
          ) : null}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(totalPrice)}</Text>
          </View>
        </View>

        {/* Chính sách */}
        <View style={styles.policyCard}>
          <Ionicons name="warning-outline" size={16} color="#B45309" />
          <Text style={styles.policyText}>
            <Text style={{ fontWeight: 'bold' }}>Chính sách hoàn tiền:</Text> Hủy đặt sân trong vòng 24h so với giờ chơi sẽ{' '}
            <Text style={{ color: '#B45309', fontWeight: 'bold' }}>không được hoàn tiền</Text>.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={getConfirmLabel()}
            onPress={handleConfirm}
            loading={submitting}
            disabled={submitting}
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
  sectionLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.md,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },

  // Booking list
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  quickSetLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  quickSetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFBFF',
  },
  quickSetBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  quickSetBtnText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  quickSetBtnTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },

  bookingItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  bookingItemLast: {
    borderBottomWidth: 0,
  },
  bookingItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  bookingIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingIndexText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  bookingCourtName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  bookingTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  bookingDuration: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  bookingPrice: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  bookingPaymentRow: {
    marginLeft: 34,
  },

  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },

  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subtotalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtotalLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  subtotalValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.textSecondary,
  },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semiBold, color: colors.textMuted },
  totalValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary },

  policyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  policyText: {
    fontSize: fontSize.xs + 1,
    color: '#78350F',
    flex: 1,
    lineHeight: 18,
  },
  actions: { marginTop: spacing.xl },
});
