import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { getCurrentUser } from '../../data/mockStore';

export default function AccountScreen({ navigation }) {
  const user = getCurrentUser();

  const items = [
    { id: 'bookings', label: 'Lịch đặt sân', icon: 'calendar-outline', onPress: () => navigation.navigate('MyBookings') },
    { id: 'noti', label: 'Thông báo', icon: 'notifications-outline', onPress: () => navigation.navigate('Notifications') },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.profile}>
          <Image source={{ uri: user?.avatar_url }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.full_name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.points}>Điểm: {user?.loyalty_points}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {items.map((it) => (
            <TouchableOpacity key={it.id} onPress={it.onPress} activeOpacity={0.85} style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.iconWrap}>
                  <Ionicons name={it.icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.rowLabel}>{it.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.divider },
  name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  email: { marginTop: 2, fontSize: fontSize.sm, color: colors.textMuted },
  points: { marginTop: 8, fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.semiBold },
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.semiBold },
});

