import React, { useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import Button from '../../shared/components/Button';
import Badge from '../../shared/components/Badge';
import { formatPrice } from '../../utils/formatters';
import { useAppStore } from '../../data/AppStore';

export default function ProductDetailScreen({ route, navigation }) {
  const product = route?.params?.product;
  const variants = product?.variants ?? [];
  const { addToCart } = useAppStore();

  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? null);
  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? variants[0],
    [variants, selectedVariantId]
  );

  const isOutOfStock = (selectedVariant?.stock ?? 0) === 0;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Image source={{ uri: product?.thumbnail_url }} style={styles.hero} />

        <View style={styles.content}>
          <Text style={styles.category}>{product?.category_label}</Text>
          <Text style={styles.name}>{product?.name}</Text>
          <Text style={styles.desc}>{product?.description}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn phiên bản</Text>
            <View style={styles.variantsRow}>
              {variants.map((v) => (
                <Badge
                  key={v.id}
                  label={v.label}
                  color={v.id === selectedVariantId ? colors.primary : '#64748B'}
                  pressable={true}
                  onPress={() => setSelectedVariantId(v.id)}
                />
              ))}
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(selectedVariant?.price_cents)}</Text>
            <Text style={styles.stock}>{isOutOfStock ? 'Hết hàng' : `Còn ${selectedVariant?.stock ?? 0}`}</Text>
          </View>

          <Button
            title={isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
            onPress={() => {
              addToCart(product, selectedVariant, 1);
              navigation.navigate('Cart');
            }}
            disabled={isOutOfStock}
            fullWidth={true}
          />

          <View style={{ height: spacing.sm }} />

          <Button title="Quay lại" variant="outline" onPress={() => navigation.goBack()} fullWidth={true} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.divider,
  },
  content: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  category: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semiBold, textTransform: 'uppercase' },
  name: { marginTop: 6, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  desc: { marginTop: 8, fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 20 },
  section: { marginTop: spacing.lg },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  variantsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  priceRow: { marginTop: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  price: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary },
  stock: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.semiBold },
});

