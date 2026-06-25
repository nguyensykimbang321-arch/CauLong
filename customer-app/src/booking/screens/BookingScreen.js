import React, { useMemo, useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, ActivityIndicator, Alert, Modal, FlatList, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { getAvailableCourts, getFacilities, getCourtTypes, getDailyAvailability } from '../../data/mockStore';
import AvailabilityTimeline from '../components/AvailabilityTimeline';
import { getBookingRangeError } from '../utils/bookingGapUtils';
import Button from '../../shared/components/Button';
import { formatPrice } from '../../utils/formatters';
import PressableCard from '../../shared/components/PressableCard';
import { useAppStore } from '../../data/AppStore';

const { width: windowWidth } = Dimensions.get('window');

export default function BookingScreen({ navigation }) {
  const { selectedFacility: globalFacility, setFacility: setGlobalFacility } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (msg) => {
    setToastMessage(msg);
    toastOpacity.setValue(0);
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Tự động ẩn sau 3 giây
    setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setToastMessage('');
      });
    }, 3500);
  };
  const [facilities, setFacilities] = useState([]);
  const [courtTypes, setCourtTypes] = useState([]);
  
  const [dateOptions] = useState(() => {
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
  });

  const [dateId, setDateId] = useState(dateOptions[0]?.id ?? null);
  
  const [facilityId, setFacilityId] = useState(globalFacility?.id || null);
  const [sportId, setSportId] = useState(null);
  
  // Danh sách các range đã chọn: [{id, courtId, courtName, startTime, endTime, price}]
  const [selections, setSelections] = useState([]);
  const [selectionError, setSelectionError] = useState('');
  const [timelineData, setTimelineData] = useState({ courts: [], slotsByCourtId: {} });
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Key để reset internal state của AvailabilityTimeline khi đổi ngày/sân/bộ môn
  const [timelineKey, setTimelineKey] = useState(0);

  useEffect(() => {
    async function loadInitial() {
      try {
        const f = await getFacilities();
        setFacilities(f);
        
        if (!facilityId && f.length > 0) {
            const initialId = globalFacility?.id || f[0].id;
            const initialF = f.find(item => item.id === initialId) || f[0];
            setFacilityId(initialF.id);
            setGlobalFacility(initialF);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadSports() {
        if (!facilityId) return;
        try {
            const ct = await getCourtTypes(facilityId);
            setCourtTypes(ct);
            // Reset khi đổi cơ sở
            setSportId(null);
            setSelections([]);
            setSelectionError('');
            setTimelineKey(k => k + 1);
        } catch (e) {
            console.error(e);
        }
    }
    loadSports();
  }, [facilityId]);

  // Khi facilityId thay đổi locally, cập nhật global
  const handleFacilityChange = (f) => {
    setSportId(null);
    setSelections([]);
    setSelectionError('');
    setTimelineKey(k => k + 1);
    setFacilityId(f.id);
    setGlobalFacility(f);
  };

  // Load timeline data khi có đủ facilityId + sportId + dateId
  useEffect(() => {
    async function loadTimeline() {
      if (!facilityId || !sportId || !dateId) {
        setTimelineData({ courts: [], slotsByCourtId: {} });
        return;
      }
      const currentSport = courtTypes.find(s => s.id === sportId);
      if (!currentSport) return;

      setTimelineLoading(true);
      try {
        const data = await getDailyAvailability({
          facilityId,
          date: dateId,
          courtType: currentSport.name,
        });
        setTimelineData(data || { courts: [], slotsByCourtId: {} });
      } catch (e) {
        console.error('Lỗi load timeline:', e);
        setTimelineData({ courts: [], slotsByCourtId: {} });
      } finally {
        setTimelineLoading(false);
      }
    }
    loadTimeline();
  }, [facilityId, sportId, dateId, courtTypes]);

  /** Thêm range ngay lập tức; lấy giá ở background để không block UI */
  const handleRangeAdd = (courtId, courtName, rangeStart, rangeEnd) => {
    setSelectionError('');

    const rangeErr = getBookingRangeError({
      courtId,
      startTime: rangeStart,
      endTime: rangeEnd,
      rawBookedSlots: timelineData.rawBookedSlots || [],
      openTime: timelineData.open_time?.slice(0, 5) || '06:00',
      closeTime: timelineData.close_time?.slice(0, 5) || '22:00',
      minBookingMinutes: timelineData.min_booking_minutes ?? 30,
    });
    if (rangeErr) {
      showToast(rangeErr);
      return;
    }

    const selId = `${courtId}-${rangeStart}-${rangeEnd}-${Date.now()}`;

    setSelections(prev => [
      ...prev,
      {
        id: selId,
        courtId,
        courtName,
        startTime: rangeStart,
        endTime: rangeEnd,
        price: 0,
        priceLoading: true,
      },
    ]);

    const currentSport = courtTypes.find(s => s.id === sportId);
    if (!currentSport) return;

    getAvailableCourts({
      facilityId,
      courtType: currentSport.name,
      date: dateId,
      startTime: rangeStart,
      endTime: rangeEnd,
    })
      .then((availCourts) => {
        const courtData = (availCourts || []).find(c => c.id === courtId);
        const price = courtData?.total_price ?? 0;
        setSelections(prev => {
          if (!prev.some(s => s.id === selId)) return prev;
          return prev.map(s => (s.id === selId ? { ...s, price, priceLoading: false } : s));
        });
      })
      .catch((e) => {
        console.warn('Không lấy được giá, để 0:', e?.message);
        setSelections(prev => {
          if (!prev.some(s => s.id === selId)) return prev;
          return prev.map(s => (s.id === selId ? { ...s, priceLoading: false } : s));
        });
      });
  };

  const handleRangeRemove = (selId) => {
    setSelections(prev => prev.filter(s => s.id !== selId));
  };

  const handleClearSelections = () => {
    setSelections([]);
    setSelectionError('');
    setTimelineKey(k => k + 1);
  };

  const handleTimelineConflict = () => {
    showToast('Khung giờ bị trùng với lịch đã chọn!');
  };

  const handleTimelineGapError = (message) => {
    showToast(message);
  };

  const sportImages = useMemo(
    () => ({
      badminton: require('../../image/badminton.jpg'),
      tennis: require('../../image/tennis.jpg'),
      football: require('../../image/football.jpg'),
      table_tennis: require('../../image/table_tennis.jpg'),
    }),
    []
  );

  const selectedFacility = useMemo(() => facilities.find((f) => f.id === facilityId) ?? facilities[0], [facilities, facilityId]);
  const selectedSport = useMemo(() => courtTypes.find((s) => s.id === sportId) ?? courtTypes[0], [courtTypes, sportId]);

  const totalPrice = useMemo(() => selections.reduce((sum, s) => sum + (s.price || 0), 0), [selections]);

  /** Tính text thời lượng cho 1 selection */
  const getDurationText = (start, end) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return '';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h > 0 ? h + 'h' : ''}${m > 0 ? m + 'p' : ''}`;
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

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
          <View>
            <Text style={styles.title}>Đặt sân</Text>
            <Text style={styles.sub}>Xem lịch trống, nhấn vào ô để chọn sân & giờ.</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MyBookings')} activeOpacity={0.8} style={styles.historyBtn}>
            <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.historyText}>Lịch sử</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroContainer}>
          <FlatList
            data={facilities}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
              const facility = facilities[index];
              if (facility && facility.id !== facilityId) {
                handleFacilityChange(facility);
              }
            }}
            renderItem={({ item }) => {
              const isSelected = item.id === facilityId;
              return (
                <View style={{ width: windowWidth, paddingHorizontal: spacing.lg }}>
                  <View style={[styles.hero, isSelected && styles.heroSelected]}>
                    <View style={styles.heroGlow} />
                    <View style={styles.heroHeader}>
                      <Text style={styles.heroTitle} numberOfLines={1}>{item.name}</Text>
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color={colors.white} />
                          <Text style={styles.selectedBadgeText}>Đã chọn</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.heroSub} numberOfLines={2}>{item.address}</Text>
                    <View style={styles.heroRow}>
                      <View style={styles.heroPill}>
                        <Ionicons name="time-outline" size={14} color={colors.primaryDark ?? colors.primary} />
                        <Text style={styles.heroPillText}>
                          {item.open_time?.substring(0, 5)} – {item.close_time?.substring(0, 5)}
                        </Text>
                      </View>
                      <View style={styles.heroPill}>
                        <Ionicons name="location-outline" size={14} color={colors.primaryDark ?? colors.primary} />
                        <Text style={styles.heroPillText}>
                          {item.address.includes('Quận') ? `Quận ${item.address.split('Quận')[1].split(',')[0].trim()}` : 'TP.HCM'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }}
          />
          {/* Indicators */}
          <View style={styles.indicators}>
            {facilities.map((f, i) => (
              <View 
                key={f.id} 
                style={[
                  styles.indicator, 
                  f.id === facilityId && styles.indicatorActive
                ]} 
              />
            ))}
          </View>
        </View>

        <Section title="Bộ môn">
          <View style={styles.sportGrid}>
            {courtTypes.map((s) => {
              const isSelected = s.id === sportId;
              return (
                <PressableCard
                  key={s.id}
                  onPress={() => {
                    setSportId(s.id);
                    // Reset timeline khi đổi bộ môn
                    setSelections([]);
                    setSelectionError('');
                    setTimelineKey(k => k + 1);
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
                      {s.name === 'badminton' ? 'Cầu lông' : 
                       s.name === 'tennis' ? 'Tennis' : 
                       s.name === 'football' ? 'Bóng đá' : 'Bóng bàn'}
                    </Text>
                  </View>
                </PressableCard>
              );
            })}
          </View>
        </Section>

        <Section title="Ngày đặt">
          <TouchableOpacity 
            style={styles.dateSelectorButton} 
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dateSelectorLeft}>
              <View style={styles.calendarIconContainer}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.dateValueMain}>
                  {dateOptions.find(d => d.id === dateId)?.isToday ? 'Hôm nay, ' : ''}
                  {dateOptions.find(d => d.id === dateId)?.weekday}, {dayjs(dateId).format('DD/MM/YYYY')}
                </Text>
                <Text style={styles.dateValueSub}>Nhấn để thay đổi ngày</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </Section>

        {/* Modal chọn ngày */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '80%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn ngày chơi</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={dateOptions}
                keyExtractor={(item) => item.id}
                numColumns={4}
                contentContainerStyle={styles.dateGrid}
                renderItem={({ item }) => {
                  const isSelected = item.id === dateId;
                  return (
                    <TouchableOpacity 
                      style={[
                        styles.dateGridItem,
                        isSelected && styles.dateGridItemSelected
                      ]}
                      onPress={() => {
                        setDateId(item.id);
                        setShowDatePicker(false);
                        // Reset selections khi đổi ngày
                        setSelections([]);
                        setSelectionError('');
                        setTimelineKey(k => k + 1);
                      }}
                    >
                      <Text style={[styles.dateGridMonth, isSelected && styles.dateGridTextSelected]}>
                         {item.isToday ? 'Hôm nay' : `T.${item.month}`}
                      </Text>
                      <Text style={[styles.dateGridDay, isSelected && styles.dateGridTextSelected]}>
                        {item.day}
                      </Text>
                      <Text style={[styles.dateGridWeekday, isSelected && styles.dateGridTextSelected]}>
                        {item.weekday}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>

        {/* Timeline xem lịch trống */}
        {facilityId && sportId && dateId ? (
          <Section title="Lịch trống">
            <AvailabilityTimeline
              key={timelineKey}
              courts={timelineData.courts}
              slotsByCourtId={timelineData.slotsByCourtId}
              timeLabels={timelineData.timeLabels}
              rawBookedSlots={timelineData.rawBookedSlots}
              openTime={timelineData.open_time}
              closeTime={timelineData.close_time}
              minBookingMinutes={timelineData.min_booking_minutes ?? 30}
              selectedDate={dateId}
              selections={selections}
              onRangeAdd={handleRangeAdd}
              onClearAll={handleClearSelections}
              onConflict={handleTimelineConflict}
              onGapError={handleTimelineGapError}
              isLoading={timelineLoading}
            />

            {/* Summary: danh sách các range đã chọn */}
            {selections.length > 0 && (
              <View style={styles.summary}>
                {/* Header summary */}
                <View style={styles.summaryHeaderRow}>
                  <View style={styles.summaryHeaderLeft}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    <Text style={styles.summaryHeaderText}>
                      {selections.length} khung giờ đã chọn
                    </Text>
                  </View>
                </View>

                {/* Danh sách các selections */}
                {selections.map((sel) => (
                  <View key={sel.id} style={styles.selectionItem}>
                    <View style={styles.selectionLeft}>
                      <View style={styles.selectionCourtBadge}>
                        <Ionicons name="apps-outline" size={12} color={colors.primary} />
                      </View>
                      <View style={styles.selectionInfo}>
                        <Text style={styles.selectionCourtName}>{sel.courtName}</Text>
                        <Text style={styles.selectionTime}>
                          {sel.startTime} → {sel.endTime}
                          <Text style={styles.selectionDuration}>
                            {'  '}{getDurationText(sel.startTime, sel.endTime)}
                          </Text>
                        </Text>
                      </View>
                    </View>
                    <View style={styles.selectionRight}>
                      <Text style={styles.selectionPrice}>
                        {sel.priceLoading ? '...' : sel.price > 0 ? formatPrice(sel.price) : '—'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRangeRemove(sel.id)}
                        style={styles.removeBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={20} color={colors.error || '#EF4444'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tổng cộng</Text>
                  <Text style={styles.summaryTotal}>{formatPrice(totalPrice)}</Text>
                </View>

                <Button
                  title={`Đặt ${selections.length} khung giờ`}
                  onPress={() =>
                    navigation.navigate('BookingConfirm', {
                      selections,
                      facilityId,
                      sportId,
                      sportName: selectedSport?.name || '',
                      date: dateId,
                      total: totalPrice,
                    })
                  }
                  fullWidth={true}
                />
              </View>
            )}
          </Section>
        ) : null}

      </ScrollView>

      {toastMessage ? (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.white} style={{ marginRight: spacing.sm }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
          <TouchableOpacity onPress={() => setToastMessage('')} style={styles.toastCloseBtn}>
            <Ionicons name="close" size={20} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

function Section({ title, children, style }) {
  return (
    <View style={[styles.section, style]}>
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

  heroContainer: {
    paddingVertical: spacing.md,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    overflow: 'hidden',
    ...shadow.lg,
    elevation: 8,
  },
  heroSelected: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.full,
  },
  selectedBadgeText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.white },
  heroSub: { marginTop: 4, fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  heroRow: { marginTop: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  heroPillText: { fontSize: fontSize.sm, color: colors.white, fontWeight: fontWeight.semiBold },

  bold: { fontWeight: fontWeight.bold, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl, paddingTop: spacing.md },
  section: { marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  sectionTitle: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.bold },
  
  // Indicators
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.divider,
  },
  indicatorActive: {
    width: 16,
    backgroundColor: colors.primary,
  },
  indicatorActive: {
    width: 16,
    backgroundColor: colors.primary,
  },

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

  // Date Selector Styles
  dateSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    ...shadow.sm,
  },
  dateSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  calendarIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: (colors.primaryLight || '#F0F9FF'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateValueMain: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  dateValueSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  
  // Date Grid Modal Styles
  dateGrid: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  dateGridItem: {
    flex: 1,
    aspectRatio: 0.8,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  dateGridItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadow.md,
  },
  dateGridMonth: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  dateGridDay: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginVertical: 2,
  },
  dateGridWeekday: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  dateGridTextSelected: {
    color: colors.white,
  },

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
  
  // New Styles
  timeButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  timeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeValueText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  timeButtonDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.sm,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  modalList: {
    paddingHorizontal: spacing.lg,
  },
  modalTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTimeItemSelected: {
    borderBottomColor: colors.primary,
  },
  modalTimeText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  modalTimeTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  modalTimeItemDisabled: {
    opacity: 0.4,
    backgroundColor: colors.background,
  },
  modalTimeTextDisabled: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  disabledLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    backgroundColor: (colors.errorLight || '#FEE2E2'),
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: (colors.error || '#EF4444'),
    fontWeight: fontWeight.medium,
  },
  courtHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  slotTime: { fontSize: fontSize.md, fontWeight: fontWeight.semiBold, color: colors.textPrimary, flex: 1 },
  slotTextSelected: {
    color: colors.primary,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(232, 72, 85, 0.95)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.md,
    zIndex: 9999,
  },
  toastText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
    lineHeight: 18,
  },
  toastCloseBtn: {
    paddingLeft: spacing.sm,
  },

  // Multi-selection summary styles
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryHeaderText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  selectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  selectionCourtBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: (colors.primaryLight || '#EFF6FF'),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: (colors.primaryLight || '#BFDBFE'),
  },
  selectionInfo: {
    flex: 1,
  },
  selectionCourtName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  selectionTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  selectionDuration: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  selectionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  selectionPrice: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  removeBtn: {
    padding: 2,
  },
});

