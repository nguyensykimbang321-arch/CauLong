import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import { formatDatetime, formatPrice, getBookingStatusMeta } from '../../utils/formatters';

// Bỏ import QRCode vì chưa cài lib, đã dùng icon thay thế ở dưới


export default function BookingDetailScreen({ route, navigation }) {
  const booking = route?.params?.booking;
  const status = getBookingStatusMeta(booking?.status);

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
        <Badge label={status.label} color={status.color} size="sm" />
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
              <InfoItem label="Bộ môn" value={booking?.court_type_label} icon="fitness-outline" />
              <InfoItem label="Sân" value={booking?.court_name} icon="location-outline" />
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

            <View style={styles.qrSection}>
              <View style={styles.qrBox}>
                 {/* Thay bằng QR Code thực tế nếu có lib, ở đây dùng placeholder icon đẹp */}
                 <Ionicons name="qr-code" size={120} color={colors.textPrimary} />
              </View>
              <Text style={styles.qrText}>Mã đặt sân: #{booking?.id}</Text>
              <Text style={styles.qrHint}>Đưa mã này cho nhân viên khi đến sân</Text>
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
        <Button title="Về trang chủ" variant="outline" onPress={() => navigation.navigate('HomeTab')} fullWidth={true} />
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
  
  qrSection: { alignItems: 'center', paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider },
  qrBox: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  qrText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  qrHint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  
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
});

