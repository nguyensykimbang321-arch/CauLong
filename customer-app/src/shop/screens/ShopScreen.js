import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { getProducts } from '../../data/mockStore';
import ProductCard from '../../shared/components/ProductCard';
import Button from '../../shared/components/Button';
import { useAppStore } from '../../data/AppStore';

export default function ShopScreen({ navigation }) {
  const { state } = useAppStore();
  const products = getProducts();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const query = q.trim().toLowerCase();

  const categories = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const key = p.category ?? 'other';
      const label = p.category_label ?? key;
      map.set(key, { id: key, label, count: (map.get(key)?.count ?? 0) + 1 });
    }
    return [{ id: 'all', label: 'Tất cả', count: products.length }, ...Array.from(map.values())];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (category !== 'all') list = list.filter((p) => p.category === category);
    if (!query) return list;
    return list.filter((p) => (p.name ?? '').toLowerCase().includes(query));
  }, [products, query, category]);

  const cartCount = state.cartItems?.reduce((sum, x) => sum + (x.quantity ?? 0), 0) ?? 0;

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cửa hàng</Text>
          <Text style={styles.sub}>Chọn đồ xịn cho buổi chơi chất.</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} activeOpacity={0.8} style={styles.cartBtn}>
          <Ionicons name="cart-outline" size={20} color={colors.textPrimary} />
          {cartCount > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Tìm sản phẩm..."
          autoCorrect={false}
          style={styles.search}
        />
        {q ? (
          <TouchableOpacity onPress={() => setQ('')} activeOpacity={0.8} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.filters}>
            <FlatList
              data={categories}
              keyExtractor={(c) => c.id}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setCategory(item.id)}
                  style={[styles.chip, item.id === category && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, item.id === category && styles.chipTextSelected]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.chipCount, item.id === category && styles.chipCountSelected]}>
                    {item.count}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            horizontal={true}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Không tìm thấy sản phẩm.</Text>
            <Button title="Xoá lọc" variant="outline" onPress={() => { setQ(''); setCategory('all'); }} />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sub: { marginTop: 4, fontSize: fontSize.sm, color: colors.textSecondary },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface,
  },
  cartBadgeText: { color: colors.white, fontSize: 11, fontWeight: fontWeight.bold },
  searchWrap: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  search: { flex: 1, paddingVertical: 10, fontSize: fontSize.md },
  clearBtn: { paddingVertical: 6 },
  list: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  filters: { marginBottom: spacing.md },
  chipsRow: { paddingRight: spacing.lg, gap: spacing.sm },
  chip: {
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
  chipSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.semiBold },
  chipTextSelected: { color: colors.textPrimary },
  chipCount: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.bold },
  chipCountSelected: { color: colors.textPrimary },
  empty: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.sm },
});

