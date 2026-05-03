import React, { useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import Button from '../../shared/components/Button';
import Badge from '../../shared/components/Badge';
import { formatPrice } from '../../utils/formatters';
import { useAppStore } from '../../data/AppStore';

import { Ionicons } from '@expo/vector-icons';

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
    <Screen padding={0}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Hero Image Section */}
          <View style={styles.heroContainer}>
            <Image source={{ uri: product?.thumbnail_url }} style={styles.heroImage} />
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.headerRow}>
              <View style={styles.categoryBadge}>
                 <Text style={styles.categoryBadgeText}>{product?.category_label}</Text>
              </View>
              <View style={styles.ratingRow}>
                 <Ionicons name="star" size={14} color="#FBBF24" />
                 <Text style={styles.ratingValue}>{product?.rating ?? '4.8'}</Text>
              </View>
            </View>

            <Text style={styles.productName}>{product?.name}</Text>
            <Text style={styles.productPrice}>{formatPrice(selectedVariant?.price_cents)}</Text>
            
            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin sản phẩm</Text>
              <Text style={styles.productDesc}>{product?.description}</Text>
            </View>

            {/* Trust Badges */}
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
                <Text style={styles.trustText}>Chính hãng</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="flash-outline" size={18} color={colors.primary} />
                <Text style={styles.trustText}>Giao nhanh 2h</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="refresh-outline" size={18} color={colors.primary} />
                <Text style={styles.trustText}>Đổi trả 7 ngày</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.variantHeader}>
                <Text style={styles.sectionTitle}>Chọn phiên bản</Text>
                <Text style={styles.stockStatus}>
                  {isOutOfStock ? 'Hết hàng' : `Còn ${selectedVariant?.stock ?? 0} sản phẩm`}
                </Text>
              </View>
              
              <View style={styles.variantsGrid}>
                {variants.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => setSelectedVariantId(v.id)}
                    style={[
                      styles.variantCard,
                      v.id === selectedVariantId && styles.variantCardActive
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.variantLabel,
                      v.id === selectedVariantId && styles.variantLabelActive
                    ]}>
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.totalWrap}>
              <Text style={styles.totalLabel}>Giá tạm tính</Text>
              <Text style={styles.totalValue}>{formatPrice(selectedVariant?.price_cents)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.buyButton, isOutOfStock && styles.buttonDisabled]}
              onPress={() => {
                addToCart(product, selectedVariant, 1);
                navigation.navigate('Cart');
              }}
              disabled={isOutOfStock}
              activeOpacity={0.9}
            >
              <Text style={styles.buyButtonText}>
                {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroContainer: { position: 'relative', width: '100%', height: 350, backgroundColor: colors.white },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  mainContent: {
    padding: 24,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -30,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValue: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  productName: { fontSize: 24, fontWeight: '800', color: '#0F172A', lineHeight: 32, marginBottom: 8 },
  productPrice: { fontSize: 28, fontWeight: '900', color: colors.primary, marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  productDesc: { fontSize: 15, color: '#475569', lineHeight: 24 },
  trustRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: '#F8FAFC', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 24 
  },
  trustItem: { alignItems: 'center', gap: 6 },
  trustText: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  variantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  stockStatus: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  variantsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  variantCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  variantCardActive: { borderColor: colors.primary, backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  variantLabel: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  variantLabelActive: { color: colors.primary },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    ...shadow.lg,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalWrap: { flex: 1 },
  totalLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  buyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 160,
    alignItems: 'center',
    ...shadow.md,
  },
  buyButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  buttonDisabled: { backgroundColor: '#CBD5E1' }
});
