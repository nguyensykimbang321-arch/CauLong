import React, { useMemo, useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, ActivityIndicator, Alert, Modal, FlatList, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { getAvailableCourts, getFacilities, getCourtTypes } from '../../data/mockStore';
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
  
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    let minutes = now.getMinutes();
    let hours = now.getHours();
    // Làm tròn lên 30 phút tiếp theo
    if (minutes > 0 && minutes <= 30) {
      minutes = 30;
    } else if (minutes > 30) {
      minutes = 0;
      hours += 1;
    }
    // Giới hạn trong khung giờ hoạt động (06:00 - 21:00)
    if (hours < 6) { hours = 6; minutes = 0; }
    if (hours >= 21) { hours = 21; minutes = 0; }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });
  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    let minutes = now.getMinutes();
    let hours = now.getHours();
    if (minutes > 0 && minutes <= 30) {
      minutes = 30;
    } else if (minutes > 30) {
      minutes = 0;
      hours += 1;
    }
    if (hours < 6) { hours = 6; minutes = 0; }
    if (hours >= 21) { hours = 21; minutes = 0; }
    // +1 tiếng so với startTime
    hours += 1;
    if (hours > 22) { hours = 22; minutes = 0; }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });
  const [availableCourts, setAvailableCourts] = useState([]);
  const [selectedCourtId, setSelectedCourtId] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(null); // 'start', 'end' or null
  const [showDatePicker, setShowDatePicker] = useState(false);

  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 6; h <= 21; h++) {
      options.push(`${h.toString().padStart(2, '0')}:00`);
      options.push(`${h.toString().padStart(2, '0')}:30`);
    }
    options.push('22:00');
    return options;
  }, []);

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
            
            // Reset bộ môn & sân khi đổi cơ sở — bắt buộc user chọn lại
            setSportId(null);
            setAvailableCourts([]);
            setSelectedCourtId(null);
            setSearchError('');
        } catch (e) {
            console.error(e);
        }
    }
    loadSports();
  }, [facilityId]);

  // Khi facilityId thay đổi locally, cập nhật global
  const handleFacilityChange = (f) => {
    // Reset ngay lập tức để tránh race condition với useEffect loadAvailability
    setSportId(null);
    setAvailableCourts([]);
    setSelectedCourtId(null);
    setSearchError('');
    
    setFacilityId(f.id);
    setGlobalFacility(f);
    
    // Kiểm tra giờ hoạt động của cơ sở mới
    const openTime = f.open_time || '06:00:00';
    const closeTime = f.close_time || '22:00:00';
    const openHHmm = openTime.substring(0, 5);
    const closeHHmm = closeTime.substring(0, 5);

    if (startTime < openHHmm || startTime > closeHHmm) {
       setStartTime(openHHmm);
       // Đẩy giờ kết thúc lên +1h
       const [h, m] = openHHmm.split(':');
       const nextHour = (parseInt(h) + 1).toString().padStart(2, '0');
       setEndTime(`${nextHour}:${m}`);
    }
  };

  useEffect(() => {
    async function loadAvailability() {
      if (!facilityId || !sportId || !dateId || !startTime || !endTime) return;

      const currentSport = courtTypes.find(s => s.id === sportId);
      if (!currentSport) return;
      
      const startObj = new Date(`${dateId}T${startTime}:00`);
      const endObj = new Date(`${dateId}T${endTime}:00`);
      const now = new Date();

      if (startObj < now) {
          setSearchError('Không thể chọn giờ trong quá khứ');
          setAvailableCourts([]);
          return;
      }
      
      if (endObj <= startObj) {
          setSearchError('Giờ kết thúc phải sau giờ bắt đầu');
          setAvailableCourts([]);
          return;
      }

      const diffMins = (endObj - startObj) / (1000 * 60);
      if (diffMins < 60) {
          setSearchError('Thời lượng tối thiểu là 1 tiếng');
          setAvailableCourts([]);
          return;
      }

      setSearchError('');
      try {
        const res = await getAvailableCourts({ 
            facilityId, 
            courtType: currentSport.name, // Truyền tên bộ môn thay vì ID
            date: dateId,
            startTime,
            endTime
        });
        setAvailableCourts(res || []);
        if (res.length > 0) {
            if (!res.find(c => c.id === selectedCourtId)) {
                setSelectedCourtId(res[0].id);
            }
        } else {
            setSelectedCourtId(null);
        }
      } catch (e) {
        console.error(e);
        setAvailableCourts([]);
        const msg = e.response?.data?.message || 'Tất cả sân trong khung giờ này đã được đặt hết. Vui lòng chọn giờ khác!';
        showToast(msg);
      }
    }
    loadAvailability();
  }, [facilityId, sportId, dateId, startTime, endTime, courtTypes]);

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

  const selectedCourt = useMemo(() => availableCourts.find(c => c.id === selectedCourtId), [availableCourts, selectedCourtId]);
  const totalPrice = selectedCourt?.total_price || 0;
  const durationText = useMemo(() => {
     const startObj = new Date(`${dateId}T${startTime}:00`);
     const endObj = new Date(`${dateId}T${endTime}:00`);
     const diffMins = (endObj - startObj) / (1000 * 60);
     if (diffMins <= 0) return '';
     const h = Math.floor(diffMins / 60);
     const m = diffMins % 60;
     return `${h} tiếng${m > 0 ? ` ${m} phút` : ''}`;
  }, [startTime, endTime]);

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
            <Text style={styles.sub}>Chọn giờ chơi, hệ thống tự chọn sân tối ưu.</Text>
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

        <Section title="Thời gian">
          <View style={styles.timeButtonRow}>
            <TouchableOpacity 
              style={styles.timeButton} 
              onPress={() => setShowTimePicker('start')}
            >
              <Text style={styles.timeButtonLabel}>Giờ bắt đầu</Text>
              <View style={styles.timeValueContainer}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.timeValueText}>{startTime}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.timeButtonDivider} />

            <TouchableOpacity 
              style={styles.timeButton} 
              onPress={() => setShowTimePicker('end')}
            >
              <Text style={styles.timeButtonLabel}>Giờ kết thúc</Text>
              <View style={styles.timeValueContainer}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.timeValueText}>{endTime}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {searchError ? (
            <View style={styles.errorBox}>
               <Ionicons name="alert-circle" size={16} color={colors.error || '#EF4444'} />
               <Text style={styles.errorText}>{searchError}</Text>
            </View>
          ) : null}
        </Section>

        {/* Modal chọn giờ */}
        <Modal
          visible={showTimePicker !== null}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}> Chọn {showTimePicker === 'start' ? 'giờ bắt đầu' : 'giờ kết thúc'} </Text>
                <TouchableOpacity onPress={() => setShowTimePicker(null)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={showTimePicker === 'start' ? timeOptions.slice(0, -2) : timeOptions.slice(2)}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const now = new Date();
                  const itemDate = new Date(`${dateId}T${item}:00`);
                  let isPast = itemDate < now;
                  
                  // Lấy giờ đóng/mở cửa của cơ sở
                  const openTime = selectedFacility?.open_time || '06:00:00';
                  const closeTime = selectedFacility?.close_time || '22:00:00';
                  
                  // Chuyển đổi sang HH:mm để so sánh chuỗi
                  const openHHmm = openTime.substring(0, 5);
                  const closeHHmm = closeTime.substring(0, 5);
                  
                  const isClosed = item < openHHmm || item > closeHHmm;

                  let isInvalidEnd = false;
                  if (showTimePicker === 'end') {
                    const startObj = new Date(`${dateId}T${startTime}:00`);
                    isInvalidEnd = itemDate <= startObj; 
                  }

                  const isDisabled = isPast || isInvalidEnd || isClosed;

                  return (
                    <TouchableOpacity 
                      style={[
                        styles.modalTimeItem,
                        (showTimePicker === 'start' ? startTime === item : endTime === item) && styles.modalTimeItemSelected,
                        isDisabled && styles.modalTimeItemDisabled
                      ]}
                      disabled={isDisabled}
                      onPress={() => {
                        if (showTimePicker === 'start') {
                          setStartTime(item);
                          const currentEndObj = new Date(`${dateId}T${endTime}:00`);
                          const newStartObj = new Date(`${dateId}T${item}:00`);
                          if (currentEndObj <= newStartObj) {
                            const [h, m] = item.split(':');
                            const nextHour = (parseInt(h) + 1).toString().padStart(2, '0');
                            setEndTime(`${nextHour}:${m}`);
                          }
                        } else {
                          setEndTime(item);
                        }
                        setShowTimePicker(null);
                      }}
                    >
                      <View>
                        <Text style={[
                          styles.modalTimeText,
                          (showTimePicker === 'start' ? startTime === item : endTime === item) && styles.modalTimeTextSelected,
                          isDisabled && styles.modalTimeTextDisabled
                        ]}>{item}</Text>
                        {isDisabled && (
                          <Text style={styles.disabledLabel}>
                            {isPast ? 'Đã qua' : isClosed ? 'Đóng cửa' : 'Không hợp lệ'}
                          </Text>
                        )}
                      </View>
                      {(showTimePicker === 'start' ? startTime === item : endTime === item) && !isDisabled && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.modalList}
              />
            </View>
          </View>
        </Modal>

        <Section title="Chọn sân">
          {!facilityId || !sportId || !dateId ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Vui lòng chọn đủ cơ sở, bộ môn và ngày.</Text>
            </View>
          ) : searchError ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Vui lòng điều chỉnh lại thời gian phù hợp.</Text>
            </View>
          ) : !availableCourts.length ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Không có sân nào trống trong khung giờ này!</Text>
            </View>
          ) : (
            <>
              <Text style={styles.hint}>Danh sách sân đang rảnh:</Text>
              <View style={styles.grid}>
                {availableCourts.map((c) => {
                  const selected = c.id === selectedCourtId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      activeOpacity={0.85}
                      onPress={() => setSelectedCourtId(c.id)}
                      style={[
                        styles.slot,
                        selected && styles.slotSelected,
                      ]}
                    >
                      <View style={styles.courtHeader}>
                         <Ionicons name="apps-outline" size={16} color={selected ? colors.primary : colors.textMuted} style={{ marginTop: 2 }} />
                         <Text style={[styles.slotTime, selected && styles.slotTextSelected]}>
                          {c.name}
                        </Text>
                      </View>
                      
                      <View style={[styles.countPill, selected && styles.countPillSelected]}>
                        <Text style={[styles.countText, selected && styles.countTextSelected]}>
                          Giá: {formatPrice(c.total_price)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Thời lượng</Text>
                  <Text style={styles.summaryValue}>{durationText || '—'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Giá (cho khung giờ này)</Text>
                  <Text style={styles.summaryTotal}>{formatPrice(totalPrice)}</Text>
                </View>
                <Button
                  title="Tiếp tục"
                  onPress={() =>
                    navigation.navigate('BookingConfirm', {
                      courtId: selectedCourtId,
                      startTime,
                      endTime,
                      facilityId,
                      sportId,
                      sportName: selectedSport?.name || '',
                      date: dateId,
                      total: totalPrice,
                      courtName: selectedCourt?.name
                    })
                  }
                  disabled={!selectedCourtId || searchError !== ''}
                  fullWidth={true}
                />
              </View>
            </>
          )}
        </Section>

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
});

