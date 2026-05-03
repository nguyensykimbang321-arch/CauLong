import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { formatPrice } from '../../utils/formatters';
import { coerceBoolean } from '../../utils/coerce';

export default function ProductCard({ product, onPress, onAddToCart, horizontal = false }) {
  const horizontalProp = coerceBoolean(horizontal);
  const imageRef = useRef(null);

  const prices = (product?.variants ?? []).map((v) => v.price_cents).filter((v) => typeof v === 'number');
  const lowestPrice = prices.length ? Math.min(...prices) : 0;
  const isOutOfStock = (product?.variants ?? []).length
    ? (product.variants ?? []).every((v) => (v?.stock ?? 0) === 0)
    : false;

  const handleQuickAdd = () => {
    if (isOutOfStock || !onAddToCart) return;
    
    imageRef.current?.measureInWindow((x, y, width, height) => {
      onAddToCart({
        product,
        variant: product?.variants?.[0],
        startPos: { x: x + width / 2, y: y + height / 2 },
        image: product?.thumbnail_url
      });
    });
  };

  if (horizontalProp) {
    return (
      <TouchableOpacity style={styles.hCard} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.hImageWrap}>
          <Image ref={imageRef} source={{ uri: product?.thumbnail_url }} style={styles.hImage} />
          {isOutOfStock && (
            <View style={styles.outOfStockPill}>
              <Text style={styles.outOfStockPillText}>Hết hàng</Text>
            </View>
          )}
        </View>
        <View style={styles.hContent}>
          <View>
            <Text style={styles.categoryBadge}>{product?.category_label}</Text>
            <Text style={styles.hName} numberOfLines={1}>{product?.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#FBBF24" />
              <Text style={styles.ratingText}>{product?.rating ?? '4.8'}</Text>
              <Text style={styles.reviewText}>({product?.review_count ?? 15})</Text>
            </View>
          </View>
          <View style={styles.hFooter}>
            <Text style={styles.priceText}>{formatPrice(lowestPrice)}</Text>
            <TouchableOpacity 
              style={[styles.addButton, isOutOfStock && { opacity: 0.5 }]} 
              onPress={handleQuickAdd}
              activeOpacity={0.6}
            >
              <Ionicons name="add" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.vCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.vImageWrap}>
        <Image ref={imageRef} source={{ uri: product?.thumbnail_url }} style={styles.vImage} />
        <View style={styles.categoryTag}>
           <Text style={styles.categoryTagText}>{product?.category_label}</Text>
        </View>
        {isOutOfStock && (
          <View style={styles.vStockOverlay}>
            <Text style={styles.vStockText}>Đã bán hết</Text>
          </View>
        )}
      </View>
      <View style={styles.vContent}>
        <Text style={styles.vName} numberOfLines={2}>{product?.name}</Text>
        <View style={styles.vFooter}>
          <Text style={styles.vPrice}>{formatPrice(lowestPrice)}</Text>
          <TouchableOpacity 
             style={[styles.vRating, { backgroundColor: colors.primary, paddingHorizontal: 4, borderRadius: 8 }]} 
             onPress={handleQuickAdd}
          >
             <Ionicons name="add" size={14} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Horizontal Style
  hCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: spacing.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    ...shadow.md,
  },
  hImageWrap: {
    width: 100,
    height: 110,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  hImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  hContent: {
    flex: 1,
    paddingLeft: 14,
    paddingVertical: 2,
    justifyContent: 'space-between',
  },
  categoryBadge: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  hName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  reviewText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  hFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  
  // Vertical Style (Shop Grid)
  vCard: {
    flex: 1,
    margin: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    ...shadow.sm,
  },
  vImageWrap: {
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  vImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  vContent: {
    padding: 10,
  },
  vName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    lineHeight: 18,
    marginBottom: 10,
    height: 36, // Ensure 2 lines alignment
  },
  vFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  vPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  vRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vRatingScore: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  
  // Overlays
  outOfStockPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  outOfStockPillText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'Bold',
  },
  vStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vStockText: {
    backgroundColor: '#1E293B',
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: 'uppercase',
  }
});


