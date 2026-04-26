import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { formatPrice } from '../../utils/formatters';
import { coerceBoolean } from '../../utils/coerce';

export default function ProductCard({ product, onPress, horizontal = false }) {
  const horizontalProp = coerceBoolean(horizontal);

  const prices = (product?.variants ?? []).map((v) => v.price_cents).filter((v) => typeof v === 'number');
  const lowestPrice = prices.length ? Math.min(...prices) : 0;
  const isOutOfStock = (product?.variants ?? []).length
    ? (product.variants ?? []).every((v) => (v?.stock ?? 0) === 0)
    : false;

  if (horizontalProp) {
    return (
      <TouchableOpacity style={styles.hCard} onPress={onPress} activeOpacity={0.9}>
        <View style={styles.hImageWrap}>
          <Image source={{ uri: product?.thumbnail_url }} style={styles.hImage} />
          {isOutOfStock ? (
            <View style={styles.hStockPill}>
              <Text style={styles.hStockText}>Hết hàng</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.hContent}>
          <Text style={styles.categoryLabel}>{product?.category_label}</Text>
          <Text style={styles.hName} numberOfLines={2}>{product?.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={colors.accent} />
            <Text style={styles.rating}>{product?.rating}</Text>
            <Text style={styles.reviewCount}>({product?.review_count})</Text>
          </View>
          <View style={styles.hFooter}>
            <Text style={styles.price}>{formatPrice(lowestPrice)}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: product?.thumbnail_url }} style={styles.image} />
        {isOutOfStock ? (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Hết hàng</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.content}>
        <Text style={styles.categoryLabel}>{product?.category_label}</Text>
        <Text style={styles.name} numberOfLines={2}>{product?.name}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color={colors.accent} />
          <Text style={styles.rating}>{product?.rating}</Text>
          <Text style={styles.reviewCount}>({product?.review_count})</Text>
        </View>
        <Text style={styles.price}>{formatPrice(lowestPrice)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    flex: 1,
    margin: spacing.xs,
    ...shadow.sm,
  },
  imageWrapper: { position: 'relative' },
  image: { width: '100%', height: 140, resizeMode: 'cover' },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  content: { padding: spacing.sm },
  categoryLabel: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semiBold,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.xs },
  rating: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.textSecondary },
  reviewCount: { fontSize: fontSize.xs, color: colors.textMuted },
  price: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  hCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  hImageWrap: { width: 110, height: 110, backgroundColor: colors.divider },
  hImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  hStockPill: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm,
    backgroundColor: 'rgba(15,23,42,0.75)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.full,
  },
  hStockText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  hContent: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  hName: { fontSize: fontSize.md, fontWeight: fontWeight.semiBold, color: colors.textPrimary, marginBottom: spacing.xs },
  hFooter: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

