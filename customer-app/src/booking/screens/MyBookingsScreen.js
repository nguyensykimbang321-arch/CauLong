import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { getBookings, getCurrentUser } from '../../data/mockStore';
import BookingCard from '../../shared/components/BookingCard';

import { Ionicons } from '@expo/vector-icons';

export default function MyBookingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('upcoming'); // upcoming | past | cancelled

  useEffect(() => {
    async function loadBookings() {
        try {
            const user = await getCurrentUser();
            if (user) {
                const res = await getBookings(user.id);
                setBookings(res);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    loadBookings();
  }, []);

  const data = useMemo(() => {
    const now = new Date();
    const parse = (b) => {
        const dStr = b?.start_at ?? b?.date ?? '';
        return dStr ? new Date(dStr) : new Date(0);
    };

    if (tab === 'cancelled') return bookings.filter((b) => b.status === 'cancelled');
    if (tab === 'past') return bookings.filter((b) => parse(b) < now && b.status !== 'cancelled');
    return bookings.filter((b) => parse(b) >= now && b.status !== 'cancelled');
  }, [bookings, tab]);

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
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Booking');
            }
          }} 
          activeOpacity={0.8} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Lịch sử đặt sân</Text>
          <Text style={styles.sub}>Quản lý các buổi tập của bạn</Text>
        </View>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
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

