import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { getBookings, getCurrentUser } from '../../data/mockStore';
import BookingCard from '../../shared/components/BookingCard';

export default function MyBookingsScreen({ navigation }) {
  const user = getCurrentUser();
  const bookings = getBookings(user?.id);
  const [tab, setTab] = useState('upcoming'); // upcoming | past | cancelled

  const data = useMemo(() => {
    const now = new Date();
    const parse = (b) => new Date(String(b?.start_at ?? b?.date ?? ''));

    if (tab === 'cancelled') return bookings.filter((b) => b.status === 'cancelled');
    if (tab === 'past') return bookings.filter((b) => parse(b) < now && b.status !== 'cancelled');
    return bookings.filter((b) => parse(b) >= now && b.status !== 'cancelled');
  }, [bookings, tab]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch sử đặt sân</Text>
        <Text style={styles.sub}>Demo mock</Text>
      </View>

      <View style={styles.tabs}>
        <TabButton label="Sắp tới" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <TabButton label="Đã qua" active={tab === 'past'} onPress={() => setTab('past')} />
        <TabButton label="Đã hủy" active={tab === 'cancelled'} onPress={() => setTab('cancelled')} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookingCard booking={item} onPress={() => navigation.navigate('BookingDetail', { booking: item })} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Chưa có lịch nào.</Text>
          </View>
        }
      />
    </Screen>
  );
}

function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.tabBtn, active && styles.tabBtnActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sub: { marginTop: 4, fontSize: fontSize.sm, color: colors.textMuted },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    ...shadow.sm,
    marginBottom: spacing.md,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.full, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  tabText: { fontSize: fontSize.sm, fontWeight: fontWeight.semiBold, color: colors.textSecondary },
  tabTextActive: { color: colors.textPrimary },
  list: { paddingBottom: spacing.xxl },
  empty: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.sm,
  },
  emptyText: { fontSize: fontSize.md, color: colors.textMuted, fontWeight: fontWeight.semiBold },
});

