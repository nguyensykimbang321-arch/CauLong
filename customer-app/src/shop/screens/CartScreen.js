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
      <Text style={styles.title}>Giỏ hàng</Text>
      <Text style={styles.sub}>Demo mock: giỏ hàng chạy local trong app.</Text>

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
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sub: { marginTop: 6, fontSize: fontSize.sm, color: colors.textMuted },
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  item: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  thumb: { width: 92, height: 92, backgroundColor: colors.divider },
  itemBody: { flex: 1, padding: spacing.md },
  itemTopRow: { flexDirection: 'row', gap: spacing.sm },
  itemName: { fontSize: fontSize.md, fontWeight: fontWeight.semiBold, color: colors.textPrimary },
  itemMeta: { marginTop: 4, fontSize: fontSize.sm, color: colors.textMuted },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt ?? colors.primaryLight,
  },
  itemFooter: { marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemPrice: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemQty: { minWidth: 18, textAlign: 'center', fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.semiBold },
  summary: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  label: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.semiBold },
  value: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.semiBold },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  totalLabel: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.bold },
  totalValue: { fontSize: fontSize.lg, color: colors.primary, fontWeight: fontWeight.bold },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.sm,
  },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: fontWeight.semiBold },
});

