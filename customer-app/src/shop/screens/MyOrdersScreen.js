import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { formatPrice } from '../../utils/formatters';
import { fetchMyOrders, cancelOrder } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function MyOrdersScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('active'); // active (pending, confirmed) | completed | cancelled

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await fetchMyOrders();
      setOrders(res);
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancelOrder = (orderId) => {
    Alert.alert(
      'Hủy đơn hàng',
      'Bạn có chắc chắn muốn hủy đơn hàng này không?',
      [
        { text: 'Bỏ qua', style: 'cancel' },
        { 
          text: 'Đồng ý hủy', 
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(orderId);
              Alert.alert('Thành công', 'Đơn hàng của bạn đã được hủy');
              loadOrders(); // Refresh list
            } catch (e) {
              Alert.alert('Lỗi', e.response?.data?.message || 'Không thể hủy đơn hàng');
            }
          }
        }
      ]
    );
  };

  const data = useMemo(() => {
    if (tab === 'cancelled') return orders.filter((o) => o.status === 'cancelled' || o.status === 'refunded');
    if (tab === 'completed') return orders.filter((o) => o.status === 'completed');
    return orders.filter((o) => o.status === 'pending' || o.status === 'confirmed');
  }, [orders, tab]);

  if (loading && orders.length === 0) {
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
          onPress={() => navigation.goBack()} 
          activeOpacity={0.8} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Đơn hàng của tôi</Text>
          <Text style={styles.sub}>Theo dõi và quản lý đơn hàng</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TabButton label="Chờ xử lý" active={tab === 'active'} onPress={() => setTab('active')} />
        <TabButton label="Hoàn thành" active={tab === 'completed'} onPress={() => setTab('completed')} />
        <TabButton label="Đã hủy" active={tab === 'cancelled'} onPress={() => setTab('cancelled')} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={loadOrders}
        refreshing={loading}
        renderItem={({ item }) => (
          <OrderCard 
            order={item} 
            onCancel={() => handleCancelOrder(item.id)} 
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Chưa có đơn hàng nào.</Text>
          </View>
        }
      />
    </Screen>
  );
}

function OrderCard({ order, onCancel }) {
  const statusLabels = {
    pending: { text: 'Chờ xử lý', color: '#F59E0B' },
    confirmed: { text: 'Đã xác nhận', color: '#3B82F6' },
    completed: { text: 'Hoàn thành', color: '#10B981' },
    cancelled: { text: 'Đã hủy', color: '#EF4444' },
    refunded: { text: 'Đã hoàn tiền', color: '#6366F1' },
  };

  const status = statusLabels[order.status] || { text: order.status, color: colors.textMuted };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Mã đơn: #{order.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        {order.items?.map((it, idx) => (
          <Text key={idx} style={styles.itemText} numberOfLines={1}>
            • {it.variant?.product?.name} x{it.quantity}
          </Text>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
          <Text style={styles.totalAmount}>{formatPrice(order.total_cents)}</Text>
        </View>
        
        {order.status === 'pending' && (
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Hủy đơn</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
    alignItems: 'center',
  },
  emptyText: { fontSize: fontSize.md, color: colors.textMuted, fontWeight: fontWeight.semiBold },
  
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  orderId: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  
  itemsList: { marginBottom: spacing.md },
  itemText: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 2 },
  
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  totalLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  totalAmount: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelBtnText: { color: '#EF4444', fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
