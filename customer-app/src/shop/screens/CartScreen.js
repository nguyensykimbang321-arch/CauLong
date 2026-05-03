import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import Button from '../../shared/components/Button';
import { calcCartTotal, formatPrice } from '../../utils/formatters';
import { useAppStore } from '../../data/AppStore';

export default function CartScreen({ navigation }) {
  const { state, setCartQty, removeFromCart, clearCart } = useAppStore();
  const items = state.cartItems;
  const total = useMemo(() => calcCartTotal(items), [items]);

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Giỏ hàng</Text>
          <Text style={styles.sub}>Kiểm tra lại danh sách món đồ của bạn.</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {items.length ? (
          items.map((it) => (
            <View key={it.id} style={styles.item}>
              <Image source={{ uri: it.thumbnail_url }} style={styles.thumb} />
              <View style={styles.itemBody}>
                <View style={styles.itemTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={2}>{it.product_name}</Text>
                    <Text style={styles.itemMeta}>{it.variant_label}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFromCart(it.id)} activeOpacity={0.8} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>{formatPrice(it.price_cents)}</Text>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      onPress={() => setCartQty(it.id, it.quantity - 1)}
                      activeOpacity={0.85}
                      style={styles.qtyBtn}
                    >
                      <Ionicons name="remove" size={16} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.itemQty}>{it.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => setCartQty(it.id, it.quantity + 1)}
                      activeOpacity={0.85}
                      style={styles.qtyBtn}
                    >
                      <Ionicons name="add" size={16} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={22} color={colors.textMuted} />
            <Text style={styles.emptyText}>Giỏ hàng đang trống.</Text>
            <Button title="Mua sắm ngay" variant="outline" onPress={() => navigation.navigate('Shop')} />
          </View>
        )}

        <View style={styles.summary}>
          <View style={styles.row}>
            <Text style={styles.label}>Tạm tính</Text>
            <Text style={styles.value}>{formatPrice(total)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phí vận chuyển</Text>
            <Text style={styles.value}>{formatPrice(0)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Tổng</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
          <Button title="Thanh toán" onPress={() => navigation.navigate('Checkout')} fullWidth={true} disabled={!items.length} />
          {items.length ? (
            <>
              <View style={{ height: spacing.sm }} />
              <Button title="Xoá giỏ hàng" variant="outline" onPress={clearCart} fullWidth={true} />
            </>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sub: { marginTop: 4, fontSize: fontSize.sm, color: colors.textMuted },
  scroll: { paddingBottom: 120 },
  item: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: 16,
    padding: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  thumb: { 
    width: 80, 
    height: 80, 
    borderRadius: 12, 
    backgroundColor: colors.backgroundAlt ?? '#f5f5f5' 
  },
  itemBody: { 
    flex: 1, 
    marginLeft: 12, 
    justifyContent: 'space-between' 
  },
  itemTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  itemName: { 
    flex: 1,
    fontSize: 15, 
    fontWeight: '600', 
    color: colors.textPrimary,
    lineHeight: 20
  },
  itemMeta: { 
    marginTop: 2, 
    fontSize: 12, 
    color: colors.textMuted,
    fontWeight: '500'
  },
  removeBtn: {
    padding: 4,
    marginLeft: 8
  },
  itemFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 8
  },
  itemPrice: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: colors.primary 
  },
  qtyControls: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.backgroundAlt ?? '#f9f9f9',
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.xs,
  },
  itemQty: { 
    minWidth: 30, 
    textAlign: 'center', 
    fontSize: 14, 
    color: colors.textPrimary, 
    fontWeight: '700' 
  },
  summary: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12 
  },
  label: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  value: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  divider: { 
    height: 1, 
    backgroundColor: colors.border, 
    marginVertical: 12,
    borderStyle: 'dashed'
  },
  totalLabel: { fontSize: 16, color: colors.textPrimary, fontWeight: '700' },
  totalValue: { fontSize: 20, color: colors.primary, fontWeight: '800' },
  empty: {
    marginTop: 100,
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { 
    fontSize: 16, 
    color: colors.textMuted, 
    fontWeight: '600' 
  },
});


