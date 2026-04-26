import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { getCurrentUser, getFacilities, getBookings, getProducts } from '../../data/mockStore';
import BookingCard from '../../shared/components/BookingCard';
import ProductCard from '../../shared/components/ProductCard';
import Button from '../../shared/components/Button';
import PressableCard from '../../shared/components/PressableCard';

export default function HomeScreen({ navigation }) {
  const currentUser = getCurrentUser();
  const facility = getFacilities()[0]; // Lấy cơ sở đầu tiên làm mặc định
  const bookings = getBookings(currentUser?.id);
  const products = getProducts();

  const quickActions = [
    { id: 'book', label: 'Đặt sân', icon: 'calendar-outline', onPress: () => navigation.navigate('BookingTab') },
    { id: 'shop', label: 'Cửa hàng', icon: 'cart-outline', onPress: () => navigation.navigate('ShopTab') },
    { id: 'qr', label: 'QR Check-in', icon: 'qr-code-outline', onPress: () => navigation.navigate('QRCheckin') },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.userRow}>
            {currentUser?.avatar_url && <Image source={{ uri: currentUser.avatar_url }} style={styles.avatar} />}
            <View style={styles.userText}>
              <Text style={styles.greeting}>Xin chào</Text>
              <Text style={styles.userName}>{currentUser?.full_name}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} activeOpacity={0.8} style={styles.bell}>
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <Text style={styles.cardTitle}>{facility?.name}</Text>
          <Text style={styles.cardSub}>{facility?.address}</Text>
          {facility && (
            <View style={styles.openRow}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.openText}>
                {facility?.open_time} – {facility?.close_time}
              </Text>
            </View>
          )}
          <Button title="Xem sân trống" onPress={() => navigation.navigate('BookingTab')} fullWidth={true} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.quickRow}>
            {quickActions.map((a) => (
              <PressableCard key={a.id} onPress={a.onPress} style={styles.quickItem}>
                <View style={styles.quickInner}>
                  <View style={styles.quickIcon}>
                    <Ionicons name={a.icon} size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.quickLabel}>{a.label}</Text>
                </View>
              </PressableCard>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lịch gần đây</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('BookingTab', { screen: 'MyBookings' })}
              activeOpacity={0.8}
            >
              <Text style={styles.link}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {bookings.slice(0, 2).map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onPress={() => navigation.navigate('BookingTab', { screen: 'BookingDetail', params: { booking: b } })}
            />
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gợi ý sản phẩm</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ShopTab')} activeOpacity={0.8}>
              <Text style={styles.link}>Mở shop</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
            {products.map((p) => (
              <View key={p.id} style={styles.hItem}>
                <ProductCard product={p} horizontal={true} onPress={() => navigation.navigate('ShopTab', { screen: 'ProductDetail', params: { product: p } })} />
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.divider },
  userText: { gap: 2 },
  greeting: { fontSize: fontSize.sm, color: colors.textMuted },
  userName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  heroCard: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primaryLight,
    opacity: 0.9,
  },
  cardTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  cardSub: { marginTop: 4, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18 },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm, marginBottom: spacing.md },
  openText: { fontSize: fontSize.sm, color: colors.textSecondary },
  section: { marginTop: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  link: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.semiBold },
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  quickInner: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm, alignItems: 'center', gap: spacing.sm },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundAlt ?? colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semiBold, color: colors.textPrimary, textAlign: 'center' },
  hList: { paddingRight: spacing.lg },
  hItem: { width: 320, marginRight: spacing.sm },
});

