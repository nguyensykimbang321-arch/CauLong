import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import Badge from '../../shared/components/Badge';
import PaymentStatusIcon from '../../shared/components/PaymentStatusIcon';
import Button from '../../shared/components/Button';
import { formatDatetime, formatPrice, getBookingStatusMeta } from '../../utils/formatters';
import { cancelBooking } from '../../services/api';
import { getBookings, getCurrentUser } from '../../data/mockStore';
import { socketService } from '../../services/socket';

// Bỏ import QRCode vì chưa cài lib, đã dùng icon thay thế ở dưới


export default function BookingDetailScreen({ route, navigation }) {
  const [booking, setBooking] = useState(route?.params?.booking);
  const bookingStatus = getBookingStatusMeta(booking?.status);
  const [submitting, setSubmitting] = useState(false);

  const reloadBooking = useCallback(async () => {
    if (!booking?.id) return;
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const list = await getBookings(user.id);
      const updated = list.find((b) => b.id === booking.id);
      if (updated) setBooking(updated);
    } catch (e) {
      console.error(e);
    }
  }, [booking?.id]);

  useEffect(() => {
    const handleBookingUpdated = (data) => {
      if (data?.bookingId !== booking?.id) return;
      console.log('Booking detail updated via socket:', data);
      reloadBooking();
    };

    socketService.on('booking_status_updated', handleBookingUpdated);
    return () => {
      socketService.off('booking_status_updated', handleBookingUpdated);
    };
  }, [booking?.id, reloadBooking]);

  const handleCancel = () => {
    Alert.alert(
      'Hủy đặt sân',
      'Bạn có chắc chắn muốn hủy đơn đặt sân này không? Sân sẽ được giải phóng cho người khác đặt.',
      [
        { text: 'Bỏ qua', style: 'cancel' },
        {
          text: 'Đồng ý hủy',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              const updated = await cancelBooking(booking.id);
              setBooking(updated);
              Alert.alert('Thành công', 'Đơn đặt sân đã được hủy thành công!');
            } catch (e) {
              console.error(e);
              Alert.alert('Lỗi', e.response?.data?.message || 'Không thể hủy đặt sân. Vui lòng thử lại.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  // Lấy bộ môn từ dữ liệu (hỗ trợ cả mock và data thực từ API)
  const getSportLabel = () => {
    if (booking?.court_type_label) return booking.court_type_label;
    const type = booking?.slots?.[0]?.court?.court_type || booking?.court_type;
    const mapping = {
      badminton: 'Cầu lông',
      tennis: 'Tennis',
      football: 'Bóng đá',
      table_tennis: 'Bóng bàn'
    };
    return mapping[type] || type || '—';
  };

  const getCourtName = () => {
     if (booking?.court_name) return booking.court_name;
     return booking?.slots?.[0]?.court?.name || '—';
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MyBookings');
            }
          }} 
          activeOpacity={0.8} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết đơn đặt</Text>
        <View style={styles.statusBadges}>
          <Badge label={bookingStatus.label} color={bookingStatus.color} size="sm" />
          <PaymentStatusIcon paymentStatus={booking?.payment_status} size={20} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.ticket}>
          <View style={styles.ticketHeader}>
            <Text style={styles.facilityName}>{booking?.facility?.name || '—'}</Text>
            <Text style={styles.facilityAddr} numberOfLines={1}>{booking?.facility?.address || '—'}</Text>
          </View>

          <View style={styles.ticketDivider}>
            <View style={[styles.circle, { left: -10 }]} />
            <View style={styles.dashedLine} />
            <View style={[styles.circle, { right: -10 }]} />
          </View>

          <View style={styles.ticketBody}>
            <View style={styles.infoGrid}>
              <InfoItem label="Bộ môn" value={getSportLabel()} icon="fitness-outline" />
              <InfoItem label="Sân" value={getCourtName()} icon="location-outline" />
            </View>

            <View style={styles.timeSection}>
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>BẮT ĐẦU</Text>
                <Text style={styles.timeValue}>{formatDatetime(booking?.start_at).slice(-5)}</Text>
              </View>
              <View style={styles.timeArrow}>
                <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
              </View>
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>KẾT THÚC</Text>
                <Text style={styles.timeValue}>{formatDatetime(booking?.end_at).slice(-5)}</Text>
              </View>
            </View>

            <View style={styles.dateSection}>
               <Ionicons name="calendar-outline" size={16} color={colors.primary} />
               <Text style={styles.dateValue}>{booking?.date}</Text>
            </View>

            <View style={styles.bookingIdBox}>
              <Text style={styles.bookingIdText}>Mã đơn: #{booking?.id}</Text>
            </View>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Giá tiền</Text>
            <Text style={styles.priceValue}>{formatPrice(booking?.total_cents)}</Text>
          </View>
        </View>

        <View style={styles.footerInfo}>
           <Text style={styles.noteTitle}>Ghi chú:</Text>
           <Text style={styles.noteText}>{booking?.note || 'Không có ghi chú nào.'}</Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        {booking?.payment_status === 'paid' && (booking?.status === 'pending' || booking?.status === 'confirmed') ? (
          <View style={styles.paidInfoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#0284C7" />
            <Text style={styles.paidInfoText}>
              Đơn đã thanh toán không thể tự hủy trên ứng dụng. Vui lòng liên hệ Hotline: <Text style={{ fontWeight: 'bold' }}>0867809347</Text> để được hỗ trợ hủy và hoàn tiền.
            </Text>
          </View>
        ) : (booking?.status === 'pending' || booking?.status === 'confirmed') ? (
          <Button 
            title="Hủy đặt sân" 
            variant="danger" 
            onPress={handleCancel}
            isLoading={submitting}
            disabled={submitting}
            fullWidth={true}
            style={{ marginBottom: spacing.sm }}
          />
        ) : null}
        <Button title="Về trang đặt sân" variant="outline" onPress={() => navigation.navigate('Booking')} fullWidth={true} />
      </View>
    </Screen>
  );
}

function InfoItem({ label, value, icon }) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={14} color={colors.primary} />
      </View>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value ?? '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.sm, 
    marginBottom: spacing.lg,
    justifyContent: 'space-between'
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary, flex: 1, marginLeft: spacing.xs },
  statusBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    maxWidth: '42%',
  },
  scroll: { paddingBottom: spacing.xxl },
  ticket: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadow.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  ticketHeader: { padding: spacing.lg, backgroundColor: '#F8FAFC' },
  facilityName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  facilityAddr: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  ticketDivider: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surface,
  },
  circle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background, // Match screen background
    borderWidth: 1,
    borderColor: colors.border,
  },
  dashedLine: {
    width: '100%',
    height: 0,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.divider,
    marginHorizontal: 15,
  },
  ticketBody: { padding: spacing.lg },
  infoGrid: { flexDirection: 'row', marginBottom: spacing.lg },
  infoItem: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.semiBold },
  infoValue: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.bold },
  
  timeSection: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md
  },
  timeBox: { alignItems: 'center' },
  timeLabel: { fontSize: 10, color: colors.textMuted, fontWeight: fontWeight.bold, letterSpacing: 1 },
  timeValue: { fontSize: fontSize.xl, fontWeight: '900', color: colors.primary },
  timeArrow: { opacity: 0.5 },
  
  dateSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: spacing.lg },
  dateValue: { fontSize: fontSize.md, fontWeight: fontWeight.semiBold, color: colors.textPrimary },
  
  bookingIdBox: { alignItems: 'center', paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider },
  bookingIdText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  
  priceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: spacing.lg,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: colors.divider
  },
  priceLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textSecondary },
  priceValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },
  
  footerInfo: { marginTop: spacing.md, padding: spacing.sm },
  noteTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textPrimary },
  noteText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  
  actions: { paddingVertical: spacing.md, backgroundColor: colors.background },
  paidInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderColor: '#B9E6FE',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  paidInfoText: {
    fontSize: fontSize.sm,
    color: '#0369A1',
    flex: 1,
    lineHeight: 18,
  },
});

