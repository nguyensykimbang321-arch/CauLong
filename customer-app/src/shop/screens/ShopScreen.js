import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Animated, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { getProducts } from '../../data/mockStore';
import ProductCard from '../../shared/components/ProductCard';
import Button from '../../shared/components/Button';
import { useAppStore } from '../../data/AppStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ShopScreen({ navigation }) {
  const { state, addToCart } = useAppStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  
  // Animation refs và state
  const cartRef = useRef(null);
  const [flyingObject, setFlyingObject] = useState(null);
  const flyingAnim = useRef(new Animated.Value(0)).current;
  const cartScale = useRef(new Animated.Value(1)).current;

  const handleAddToCart = ({ product, variant, startPos, image }) => {
    cartRef.current?.measureInWindow((destX, destY, destWidth, destHeight) => {
      const endPos = { x: destX + destWidth / 2, y: destY + destHeight / 2 };
      setFlyingObject({ image, startPos, endPos });
      flyingAnim.setValue(0);

      Animated.sequence([
        Animated.timing(flyingAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.spring(cartScale, {
          toValue: 1.4,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(cartScale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setFlyingObject(null);
        addToCart(product, variant, 1);
      });
    });
  };

  const query = q.trim().toLowerCase();

  useEffect(() => {
    let mounted = true;
    getProducts().then(res => {
      if (mounted) {
        setProducts(res || []);
        setLoading(false);
      }
    });
    return () => { mounted = false };
  }, []);

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

  if (loading) {
    return (
      <Screen>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cửa hàng</Text>
          <Text style={styles.sub}>Chọn đồ xịn cho buổi chơi chất.</Text>
        </View>
        <Animated.View style={{ transform: [{ scale: cartScale }] }}>
          <TouchableOpacity 
            ref={cartRef}
            onPress={() => navigation.navigate('Cart')} 
            activeOpacity={0.8} 
            style={styles.cartBtn}
          >
            <Ionicons name="cart-outline" size={22} color={colors.textPrimary} />
            {cartCount > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </Animated.View>
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
        numColumns={2}
        key="shop-grid"
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
            onAddToCart={handleAddToCart}
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

      {/* Animation Layer */}
      {flyingObject && (
        <Animated.Image
          source={{ uri: flyingObject.image }}
          style={[
            styles.flyingImg,
            {
              left: flyingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [flyingObject.startPos.x - 30, flyingObject.endPos.x - 20],
              }),
              top: flyingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [flyingObject.startPos.y - 30, flyingObject.endPos.y - 20],
              }),
              transform: [
                {
                  scale: flyingAnim.interpolate({
                    inputRange: [0, 0.2, 1],
                    outputRange: [1, 1.2, 0.1],
                  })
                },
                {
                  rotate: flyingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }
              ],
              opacity: flyingAnim.interpolate({
                inputRange: [0, 0.8, 1],
                outputRange: [1, 1, 0],
              })
            }
          ]}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sub: { marginTop: 4, fontSize: fontSize.sm, color: colors.textSecondary },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  cartBadgeText: { color: colors.white, fontSize: 10, fontWeight: fontWeight.bold },
  searchWrap: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  search: { flex: 1, paddingVertical: 12, fontSize: fontSize.md, color: colors.textPrimary },
  list: { paddingTop: spacing.lg, paddingBottom: 100 },
  filters: { marginBottom: spacing.md },
  chipsRow: { paddingRight: spacing.lg, gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...shadow.sm,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextSelected: { color: colors.white },
  chipCount: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  chipCountSelected: { color: 'rgba(255,255,255,0.8)' },
  empty: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.md },
  flyingImg: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    zIndex: 9999,
  }
});
