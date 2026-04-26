import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { getAvailabilitiesFor, getFacilities, getCourtTypes } from '../../data/mockStore';
import Button from '../../shared/components/Button';
import { formatPrice } from '../../utils/formatters';
import PressableCard from '../../shared/components/PressableCard';
import { autoAssignCourt } from '../utils/autoAssignCourt';

export default function BookingScreen({ navigation }) {
  const facilities = getFacilities();
  const courtTypes = getCourtTypes();
  const sportImages = useMemo(
    () => ({
      badminton: require('../../image/1.jpg'),
      tennis: require('../../image/2.jpg'),
      table_tennis: require('../../image/3.jpg'),
    }),
    []
  );

  const dateOptions = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);

    return Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const iso = `${yyyy}-${mm}-${dd}`;
      const weekday = d.toLocaleDateString('vi-VN', { weekday: 'short' });
      return { id: iso, weekday, day: dd, month: mm, isToday: i === 0 };
    });
  }, []);

  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? null);
  const [sportId, setSportId] = useState(courtTypes[0]?.id ?? null);
  const [dateId, setDateId] = useState(dateOptions[0]?.id ?? null);
  const selectedFacility = facilities.find((f) => f.id === facilityId) ?? facilities[0];
  const selectedSport = courtTypes.find((s) => s.id === sportId) ?? courtTypes[0];

  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [selectionNote, setSelectionNote] = useState('');

  const { courts, slotsByCourtId } = useMemo(() => {
    if (!facilityId || !sportId || !dateId) return { courts: [], slotsByCourtId: {} };
    return getAvailabilitiesFor({ facilityId, courtTypeId: sportId, date: dateId });
  }, [facilityId, sportId, dateId]);

  const allKeys = useMemo(() => {
    const set = new Set();
    Object.values(slotsByCourtId).forEach((slots) => {
      (slots ?? []).forEach((s) => set.add(`${s.start}-${s.end}`));
    });
    const keys = Array.from(set);
    keys.sort((a, b) => a.localeCompare(b));
    return keys;
  }, [slotsByCourtId]);

  const availabilityCountByKey = useMemo(() => {
    const map = new Map();
    for (const key of allKeys) {
      let count = 0;
      for (const c of courts) {
        const slots = slotsByCourtId[c.id] ?? [];
        const slot = slots.find((s) => `${s.start}-${s.end}` === key);
        if (slot?.available) count += 1;
      }
      map.set(key, count);
    }
    return map;
  }, [allKeys, courts, slotsByCourtId]);

  const desiredKeys = useMemo(() => {
    const arr = Array.from(selectedKeys);
    arr.sort((a, b) => a.localeCompare(b));
    return arr;
  }, [selectedKeys]);

  const assignment = useMemo(() => {
    if (!desiredKeys.length) return null;
    return autoAssignCourt({ courts, slotsByCourtId, desiredKeys });
  }, [courts, slotsByCourtId, desiredKeys]);

  const totalPrice = assignment?.total_cents ?? 0;
  const hours = desiredKeys.length;

  const toggleKey = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setSelectionNote('');
        return next;
      }

      const idx = allKeys.indexOf(key);
      if (idx < 0) return next;

      if (next.size === 0) {
        next.add(key);
        setSelectionNote('');
        return next;
      }

      const indices = Array.from(next).map((k) => allKeys.indexOf(k)).filter((n) => n >= 0);
      const min = Math.min(...indices);
      const max = Math.max(...indices);
      const isAdjacent = idx === min - 1 || idx === max + 1;

      if (!isAdjacent) {
        setSelectionNote('Vui lòng chọn các khung giờ liền nhau (ví dụ 06–07 rồi 07–08).');
        return next;
      }

      next.add(key);
      setSelectionNote('');
      return next;
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Đặt sân</Text>
          <Text style={styles.sub}>Chọn giờ chơi, hệ thống tự chọn sân tối ưu.</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('MyBookings')} activeOpacity={0.8} style={styles.historyBtn}>
          <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.historyText}>Lịch sử</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroTitle}>{selectedFacility?.name ?? 'Chọn cơ sở'}</Text>
        <Text style={styles.heroSub} numberOfLines={2}>{selectedFacility?.address ?? ''}</Text>
        <View style={styles.heroRow}>
          <View style={styles.heroPill}>
            <Ionicons name="walk-outline" size={14} color={colors.primaryDark ?? colors.primary} />
            <Text style={styles.heroPillText}>{selectedSport?.name === 'badminton' ? 'Cầu lông' : selectedSport?.name === 'tennis' ? 'Tennis' : 'Bóng bàn'}</Text>
          </View>
          <View style={styles.heroPill}>
            <Ionicons name="time-outline" size={14} color={colors.primaryDark ?? colors.primary} />
            <Text style={styles.heroPillText}>
              06:00 – 22:00
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Section title="Cơ sở">
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.facilityRow}>
            {facilities.map((f) => {
              const selected = f.id === facilityId;
              return (
                <PressableCard
                  key={f.id}
                  onPress={() => {
                    setFacilityId(f.id);
                    setSelectedKeys(new Set());
                    setSelectionNote('');
                  }}
                  style={[styles.facilityCard, selected && styles.facilityCardSelected]}
                >
                  <View style={styles.facilityInner}>
                    <View style={styles.facilityTop}>
                      <View style={[styles.facilityBadge, selected && styles.facilityBadgeSelected]}>
                        <Ionicons name="location-outline" size={16} color={selected ? colors.primaryDark ?? colors.primary : colors.textMuted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.facilityName} numberOfLines={1}>{f.name}</Text>
                        <Text style={styles.facilityAddr} numberOfLines={2}>{f.address}</Text>
                      </View>
                    </View>
                    <View style={styles.facilityMetaRow}>
                      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.facilityMetaText}>06:00 – 22:00</Text>
                    </View>
                    {selected ? (
                      <View style={styles.facilitySelectedPill}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.white} />
                        <Text style={styles.facilitySelectedText}>Đang chọn</Text>
                      </View>
                    ) : null}
                  </View>
                </PressableCard>
              );
            })}
          </ScrollView>
        </Section>

        <Section title="Bộ môn">
          <View style={styles.sportGrid}>
            {courtTypes.map((s) => {
              const isSelected = s.id === sportId;
              return (
                <PressableCard
                  key={s.id}
                  onPress={() => {
                    setSportId(s.id);
                    setSelectedKeys(new Set());
                    setSelectionNote('');
                  }}
                  style={[styles.sportCard, isSelected && styles.sportCardSelected]}
                >
                  <View style={styles.sportInner}>
                    <ImageBackground
                      source={sportImages[s.name]}
                      style={styles.sportImage}
                      imageStyle={styles.sportImageStyle}
                    >
                      <View style={[styles.sportOverlay, isSelected && styles.sportOverlaySelected]} />
                    </ImageBackground>
                    <Text style={[styles.sportLabel, isSelected && styles.sportLabelSelected]}>
                      {s.name === 'badminton' ? 'Cầu lông' : s.name === 'tennis' ? 'Tennis' : 'Bóng bàn'}
                    </Text>
                  </View>
                </PressableCard>
              );
            })}
          </View>
        </Section>

        <Section title="Ngày">
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dateOptions.map((d) => {
              const selectedDate = d.id === dateId;
              return (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => {
                    setDateId(d.id);
                    setSelectedKeys(new Set());
                    setSelectionNote('');
                  }}
                  activeOpacity={0.85}
                  style={[styles.dateCard, selectedDate && styles.dateCardSelected]}
                >
                  <Text style={[styles.dateWeekday, selectedDate && styles.dateTextSelected]}>
                    {d.isToday ? 'Hôm nay' : d.weekday}
                  </Text>
                  <Text style={[styles.dateDay, selectedDate && styles.dateTextSelected]}>{d.day}</Text>
                  <Text style={[styles.dateMonth, selectedDate && styles.dateTextSelected]}>Thg {d.month}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Section>

        <Section title="Chọn giờ">
          {!facilityId || !sportId || !dateId ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Vui lòng chọn đủ cơ sở, bộ môn và ngày.</Text>
            </View>
          ) : !courts.length ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Không có sân phù hợp (mock).</Text>
            </View>
          ) : (
            <>
              <View style={styles.legendRow}>
                <Text style={styles.hint}>Chọn nhiều khung giờ liền nhau.</Text>
                <View style={styles.legendPill}>
                  <View style={styles.legendDot} />
                  <Text style={styles.legendText}>Còn trống</Text>
                </View>
              </View>
              <View style={styles.grid}>
                {allKeys.map((k) => {
                  const count = availabilityCountByKey.get(k) ?? 0;
                  const disabled = count === 0;
                  const selected = selectedKeys.has(k);
                  return (
                    <TouchableOpacity
                      key={k}
                      activeOpacity={0.85}
                      onPress={() => toggleKey(k)}
                      disabled={disabled}
                      style={[
                        styles.slot,
                        disabled && styles.slotUnavailable,
                        selected && styles.slotSelected,
                      ]}
                    >
                      <Text style={[styles.slotTime, disabled && styles.slotTextUnavailable]}>
                        {k.replace('-', ' – ')}
                      </Text>
                      <View style={[styles.countPill, disabled && styles.countPillDisabled, selected && styles.countPillSelected]}>
                        <Text style={[styles.countText, disabled && styles.countTextDisabled, selected && styles.countTextSelected]}>
                          {count} sân trống
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectionNote ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>{selectionNote}</Text>
                </View>
              ) : null}

              {assignment?.ok ? (
                <View style={styles.assignmentBox}>
                  <View style={styles.assignmentHeader}>
                    <Ionicons 
                      name={assignment.segments?.length === 1 ? "checkmark-circle" : "swap-horizontal"} 
                      size={20} 
                      color={assignment.segments?.length === 1 ? colors.secondary : colors.accent} 
                    />
                    <Text style={styles.assignmentTitle}>
                      {assignment.segments?.length === 1 ? 'Sân trống liên tục' : 'Cần đổi sân trong buổi'}
                    </Text>
                  </View>
                  <View style={styles.assignmentBody}>
                    <Text style={styles.assignmentText}>
                      {assignment.segments?.length === 1 
                        ? `Bạn sẽ chơi tại ${courts.find(c => c.id === assignment.assignedCourtId)?.name}`
                        : `Buổi chơi sẽ được chia ra ${assignment.segments.length} sân khác nhau.`
                      }
                    </Text>
                  </View>
                </View>
              ) : null}

              {assignment?.warnings?.length ? (
                <View style={styles.warnBox}>
                  <View style={styles.warnHeader}>
                    <Ionicons name="alert-circle" size={20} color="#9A3412" />
                    <Text style={styles.warnTitle}>Thông báo chuyển sân</Text>
                  </View>
                  {assignment.warnings.map((w, idx) => (
                    <Text key={idx} style={styles.warnText}>{w}</Text>
                  ))}
                </View>
              ) : null}

              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Thời lượng</Text>
                  <Text style={styles.summaryValue}>{hours ? `${hours} giờ` : '—'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tổng</Text>
                  <Text style={styles.summaryTotal}>{formatPrice(totalPrice)}</Text>
                </View>
                <Button
                  title="Tiếp tục"
                  onPress={() =>
                    navigation.navigate('BookingConfirm', {
                      desiredKeys,
                      assignment,
                      total: totalPrice,
                      facilityId,
                      sportId,
                      date: dateId,
                    })
                  }
                  disabled={!assignment?.ok || hours === 0}
                  fullWidth={true}
                />
              </View>
            </>
          )}
        </Section>

      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ marginTop: spacing.sm }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sub: { marginTop: 4, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18 },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    ...shadow.sm,
  },
  historyText: { fontSize: fontSize.sm, fontWeight: fontWeight.semiBold, color: colors.textPrimary },

  hero: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadow.md,
  },
  heroGlow: {
    position: 'absolute',
    top: -70,
    right: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primaryLight,
    opacity: 0.95,
  },
  heroTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  heroSub: { marginTop: 4, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18 },
  heroRow: { marginTop: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.backgroundAlt ?? colors.primaryLight,
    borderRadius: borderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  heroPillText: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.semiBold },

  bold: { fontWeight: fontWeight.bold, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl },
  sectionTitle: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.bold },
  facilityRow: { paddingRight: spacing.lg, gap: spacing.sm },
  facilityCard: {
    width: 300,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  facilityCardSelected: { borderColor: colors.primary },
  facilityInner: { padding: spacing.md },
  facilityTop: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  facilityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt ?? colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityBadgeSelected: { backgroundColor: colors.primaryLight },
  facilityName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  facilityAddr: { marginTop: 2, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18 },
  facilityMetaRow: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 6 },
  facilityMetaText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.semiBold },
  facilitySelectedPill: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  facilitySelectedText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.semiBold },

  sportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sportCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  sportCardSelected: { borderColor: colors.primary },
  sportInner: { padding: spacing.sm },
  sportImage: { width: '100%', height: 110, justifyContent: 'flex-end' },
  sportImageStyle: { borderRadius: borderRadius.lg },
  sportOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.22)',
    borderRadius: borderRadius.lg,
  },
  sportOverlaySelected: { backgroundColor: 'rgba(46,125,255,0.10)' },
  sportLabel: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sportLabelSelected: { color: colors.primaryDark ?? colors.primary },

  dateRow: { paddingRight: spacing.lg, gap: spacing.sm },
  dateCard: {
    width: 86,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  dateCardSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  dateWeekday: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.semiBold },
  dateDay: { marginTop: 6, fontSize: fontSize.xl, color: colors.textPrimary, fontWeight: fontWeight.bold },
  dateMonth: { marginTop: 2, fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.semiBold },
  dateTextSelected: { color: colors.textPrimary },

  courtsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  courtCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  courtCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  courtInner: { padding: spacing.md },
  courtName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  courtMeta: { marginTop: 4, fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.semiBold },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.sm,
  },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.semiBold, lineHeight: 18 },
  hint: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.sm },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary ?? '#12B981' },
  legendText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.semiBold },
  grid: { marginTop: spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  slotUnavailable: { opacity: 0.5 },
  slotSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  slotTime: { fontSize: fontSize.md, fontWeight: fontWeight.semiBold, color: colors.textPrimary },
  slotPrice: { marginTop: 8, fontSize: fontSize.sm, color: colors.textSecondary },
  slotTextUnavailable: { color: colors.textMuted },
  countPill: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  countPillSelected: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
  countPillDisabled: { backgroundColor: colors.surface, borderColor: colors.border },
  countText: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold, color: '#065F46' },
  countTextSelected: { color: '#1E3A8A' },
  countTextDisabled: { color: colors.textMuted },
  summary: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryLabel: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.semiBold },
  summaryValue: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.semiBold },
  summaryTotal: { fontSize: fontSize.lg, color: colors.primary, fontWeight: fontWeight.bold },
  noteBox: {
    marginTop: spacing.md,
    backgroundColor: '#EEF2FF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    padding: spacing.md,
  },
  noteText: { fontSize: fontSize.sm, color: '#1E3A8A', fontWeight: fontWeight.semiBold, lineHeight: 18 },
  warnBox: {
    marginTop: spacing.md,
    backgroundColor: '#FFF7ED',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: spacing.md,
  },
  warnHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  warnTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#9A3412' },
  warnText: { fontSize: fontSize.sm, color: '#9A3412', fontWeight: fontWeight.medium, lineHeight: 18, marginLeft: 28, marginBottom: 4 },
  assignmentBox: {
    marginTop: spacing.md,
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    padding: spacing.md,
  },
  assignmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  assignmentTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textPrimary },
  assignmentBody: { marginLeft: 28 },
  assignmentText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
});

