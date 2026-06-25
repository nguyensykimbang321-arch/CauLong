import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';

const SLOT_WIDTH = 36;      // chiều rộng 1 ô 30 phút
const COURT_LABEL_WIDTH = 64;
const SLOT_HEIGHT = 40;

/**
 * Timeline lịch trống với multi-selection (30 phút / ô).
 *
 * Props:
 *  courts           – danh sách sân
 *  slotsByCourtId   – map courtId → slot[] (mỗi slot 30 phút)
 *  selections       – [{id, courtId, startTime, endTime}] — các range đã xác nhận
 *  onRangeAdd(courtId, courtName, startTime, endTime) — thêm 1 range mới
 *  onClearAll()     — xóa toàn bộ selections
 *  onConflict()     — gọi khi range bị trùng với selection đã có
 *  isLoading
 */
export default function AvailabilityTimeline({
  courts,
  slotsByCourtId,
  selections = [],
  onRangeAdd,
  onClearAll,
  onConflict,
  isLoading,
}) {
  // Bước đang chọn: {courtId, courtName, slotStart} hoặc null
  const [pendingStart, setPendingStart] = useState(null);

  // Header: các mốc 30 phút từ 06:00 → 22:00
  const halfHours = useMemo(() => {
    const list = [];
    for (let h = 6; h <= 22; h++) {
      list.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < 22) list.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return list;
  }, []);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <Text style={styles.loadingText}>Đang tải lịch trống...</Text>
      </View>
    );
  }

  if (!courts || courts.length === 0) return null;

  /** Kiểm tra slot có nằm trong bất kỳ selection nào không */
  const isSlotInSelections = (slot, court) =>
    selections.some(
      sel =>
        sel.courtId === court.id &&
        slot.start >= sel.startTime &&
        slot.start < sel.endTime,
    );

  /** Kiểm tra range [start, end) có chồng chéo với selection đã có trên cùng sân */
  const hasConflict = (courtId, rangeStart, rangeEnd) =>
    selections.some(
      sel =>
        sel.courtId === courtId &&
        rangeStart < sel.endTime &&
        rangeEnd > sel.startTime,
    );

  /** Trạng thái hiển thị của 1 ô */
  const resolveStatus = (slot, court) => {
    const slotHour = parseInt(slot.start.split(':')[0], 10);
    const slotMin = parseInt(slot.start.split(':')[1], 10);
    const isPast =
      slotHour < currentHour ||
      (slotHour === currentHour && slotMin < currentMinute);
    if (isPast) return 'past';
    if (!slot.available) return 'booked';

    if (pendingStart?.courtId === court.id && pendingStart?.slotStart === slot.start)
      return 'pendingStart';

    if (isSlotInSelections(slot, court)) return 'confirmed';

    return 'available';
  };

  /** Ô có thể làm điểm kết thúc hợp lệ */
  const isValidEnd = (slot, court) => {
    if (!pendingStart) return false;
    if (pendingStart.courtId !== court.id) return false;
    if (slot.start <= pendingStart.slotStart) return false;
    if (!slot.available) return false;
    const slotHour = parseInt(slot.start.split(':')[0], 10);
    const slotMin = parseInt(slot.start.split(':')[1], 10);
    if (
      slotHour < currentHour ||
      (slotHour === currentHour && slotMin < currentMinute)
    )
      return false;
    // Không chồng chéo với selection đã có
    return !hasConflict(court.id, pendingStart.slotStart, slot.end);
  };

  const handleSlotPress = (slot, court) => {
    if (!pendingStart) {
      // Bước 1 — đặt điểm bắt đầu (bỏ qua ô đã nằm trong selection)
      if (isSlotInSelections(slot, court)) return;
      setPendingStart({ courtId: court.id, courtName: court.name, slotStart: slot.start });
      return;
    }

    if (pendingStart.courtId === court.id && slot.start > pendingStart.slotStart) {
      // Bước 2 — xác nhận kết thúc
      if (hasConflict(court.id, pendingStart.slotStart, slot.end)) {
        setPendingStart(null);
        onConflict?.();
        return;
      }
      onRangeAdd?.(court.id, court.name, pendingStart.slotStart, slot.end);
      setPendingStart(null);
      return;
    }

    // Nhấn sân khác hoặc trước start → reset
    if (!isSlotInSelections(slot, court)) {
      setPendingStart({ courtId: court.id, courtName: court.name, slotStart: slot.start });
    }
  };

  const handleClearAll = () => {
    setPendingStart(null);
    onClearAll?.();
  };

  const hasAnySelection = selections.length > 0;
  const isSelecting = !!pendingStart;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="grid-outline" size={16} color={colors.primary} />
          <Text style={styles.headerTitle}>Lịch trống trong ngày</Text>
        </View>
        {(isSelecting || hasAnySelection) && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={13} color={colors.error || '#EF4444'} />
            <Text style={styles.clearBtnText}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status bar */}
      <View style={styles.statusBar}>
        {!isSelecting && !hasAnySelection && (
          <Text style={styles.statusText}>
            Nhấn ô xanh để chọn <Text style={styles.statusBold}>điểm bắt đầu</Text>, nhấn ô tiếp theo để chọn <Text style={styles.statusBold}>điểm kết thúc</Text>
          </Text>
        )}
        {isSelecting && (
          <Text style={styles.statusText}>
            <Text style={styles.statusBold}>Bắt đầu: {pendingStart.slotStart}</Text>
            {'  '}({pendingStart.courtName}){'  —  '}
            Nhấn ô kế tiếp để xác nhận giờ kết thúc
          </Text>
        )}
        {!isSelecting && hasAnySelection && (
          <Text style={[styles.statusText, { color: '#16A34A' }]}>
            ✓ Đã chọn {selections.length} khung giờ — nhấn tiếp để thêm
          </Text>
        )}
      </View>

      {/* Timeline table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View>
          {/* Header giờ: chỉ hiện nhãn ở mốc :00 */}
          <View style={styles.timeHeaderRow}>
            <View style={styles.courtLabelCell} />
            {halfHours.map((t) => (
              <View key={t} style={styles.timeCell}>
                <Text style={styles.timeText}>
                  {t.endsWith(':00') ? `${t.substring(0, 2)}h` : ''}
                </Text>
              </View>
            ))}
          </View>

          {/* Rows từng sân */}
          {courts.map((court, courtIndex) => {
            const slots = slotsByCourtId?.[court.id] ?? [];
            const selCountOnCourt = selections.filter(s => s.courtId === court.id).length;
            const isPendingCourt = pendingStart?.courtId === court.id;

            return (
              <View
                key={court.id}
                style={[
                  styles.courtRow,
                  courtIndex % 2 === 0 && styles.courtRowAlt,
                  selCountOnCourt > 0 && styles.courtRowSelected,
                  isPendingCourt && !selCountOnCourt && styles.courtRowPending,
                ]}
              >
                {/* Tên sân */}
                <View style={styles.courtLabelCell}>
                  <Text
                    style={[
                      styles.courtLabel,
                      selCountOnCourt > 0 && styles.courtLabelSelected,
                      isPendingCourt && styles.courtLabelPending,
                    ]}
                    numberOfLines={1}
                  >
                    {court.name}
                  </Text>
                  {selCountOnCourt > 0 && (
                    <View style={styles.courtBadge}>
                      <Text style={styles.courtBadgeText}>{selCountOnCourt}</Text>
                    </View>
                  )}
                </View>

                {/* Slots */}
                {slots.map((slot, slotIndex) => {
                  const status = resolveStatus(slot, court);
                  const validEnd = isValidEnd(slot, court);
                  const isDisabled =
                    (status === 'past' || status === 'booked') && !validEnd;

                  return (
                    <TouchableOpacity
                      key={`${court.id}-${slotIndex}`}
                      style={[
                        styles.slotCell,
                        status === 'available' && styles.slotAvailable,
                        status === 'booked' && styles.slotBooked,
                        status === 'past' && styles.slotPast,
                        status === 'pendingStart' && styles.slotPendingStart,
                        status === 'confirmed' && styles.slotConfirmed,
                        validEnd && styles.slotValidEnd,
                      ]}
                      disabled={isDisabled && !validEnd}
                      onPress={() => handleSlotPress(slot, court)}
                      activeOpacity={0.7}
                    >
                      {status === 'booked' && <Ionicons name="close" size={10} color="#DC2626" />}
                      {status === 'available' && !validEnd && <View style={styles.availableDot} />}
                      {status === 'pendingStart' && <Text style={styles.labelText}>BĐ</Text>}
                      {status === 'confirmed' && <Ionicons name="checkmark" size={11} color={colors.white} />}
                      {validEnd && status === 'available' && <Text style={styles.labelTextEnd}>KT</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legendRow}>
        {[
          { color: '#DCFCE7', border: '#86EFAC', label: 'Trống' },
          { color: '#FED7AA', border: '#FB923C', label: 'Bắt đầu' },
          { color: colors.primary, border: colors.primary, label: 'Đã chọn' },
          { color: '#BBF7D0', border: '#4ADE80', label: 'Kết thúc' },
          { color: '#FEE2E2', border: '#FECACA', label: 'Đã đặt' },
          { color: '#F1F5F9', border: '#E2E8F0', label: 'Qua giờ' },
        ].map(item => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color, borderColor: item.border }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearBtnText: {
    fontSize: 11,
    color: colors.error || '#EF4444',
    fontWeight: fontWeight.semiBold,
  },
  loadingBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  statusBar: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 32,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
  },
  statusBold: {
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollView: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  timeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  courtLabelCell: {
    width: COURT_LABEL_WIDTH,
    justifyContent: 'center',
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeCell: {
    width: SLOT_WIDTH,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: fontWeight.bold,
  },
  courtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    borderRadius: 6,
    paddingVertical: 2,
  },
  courtRowAlt: {},
  courtRowSelected: {
    backgroundColor: 'rgba(46,125,255,0.06)',
  },
  courtRowPending: {
    backgroundColor: 'rgba(251,146,60,0.06)',
  },
  courtLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semiBold,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  courtLabelSelected: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  courtLabelPending: {
    color: '#EA580C',
    fontWeight: fontWeight.bold,
  },
  courtBadge: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courtBadgeText: {
    fontSize: 9,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },

  // Slot cells
  slotCell: {
    width: SLOT_WIDTH - 3,
    height: SLOT_HEIGHT,
    marginHorizontal: 1.5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  slotAvailable: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  slotBooked: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  slotPast: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  slotPendingStart: {
    backgroundColor: '#FED7AA',
    borderColor: '#FB923C',
  },
  slotConfirmed: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark || colors.primary,
  },
  slotValidEnd: {
    backgroundColor: '#BBF7D0',
    borderColor: '#4ADE80',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  availableDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  labelText: {
    fontSize: 8,
    fontWeight: fontWeight.bold,
    color: '#9A3412',
  },
  labelTextEnd: {
    fontSize: 8,
    fontWeight: fontWeight.bold,
    color: '#15803D',
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  legendText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: fontWeight.semiBold,
  },
});
