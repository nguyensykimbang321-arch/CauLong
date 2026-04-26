import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { getNotifications, getCurrentUser } from '../../data/mockStore';
import Badge from '../../shared/components/Badge';
import { formatRelativeTime } from '../../utils/formatters';

export default function NotificationsScreen() {
  const user = getCurrentUser();
  const data = getNotifications(user?.id);

  return (
    <Screen>
      <Text style={styles.title}>Thông báo</Text>
      <Text style={styles.sub}>Mock data</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Badge
                label={item.is_read ? 'Đã đọc' : 'Mới'}
                color={item.is_read ? '#64748B' : colors.primary}
                size="sm"
              />
            </View>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sub: { marginTop: 6, fontSize: fontSize.sm, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  body: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 20 },
  time: { marginTop: spacing.sm, fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.semiBold },
});

