import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, Alert, Pressable } from 'react-native';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { getFacilities, getCurrentUser } from '../../data/mockStore';
import Button from '../../shared/components/Button';
import { calcCartTotal, formatPrice } from '../../utils/formatters';
import { useAppStore } from '../../data/AppStore';
import PaymentOption from '../../shared/components/PaymentOption';
import { createOrder } from '../../services/api';

export default function CheckoutScreen({ navigation }) {
  const { state, clearCart } = useAppStore();
  const total = useMemo(() => calcCartTotal(state.cartItems), [state.cartItems]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod'); 

  useEffect(() => {
    async function loadInitial() {
        try {
            const [user, facilities] = await Promise.all([getCurrentUser(), getFacilities()]);
            if (user) {
                setName(user.full_name);
                setPhone(user.phone);
            }
            if (facilities && facilities.length > 0) {
                setAddress(facilities[0].address);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    loadInitial();
  }, []);

  const handleCheckout = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const orderData = {
        customer_name: name,
        customer_phone: phone,
        shipping_address: address,
        payment_method: paymentMethod,
        items: state.cartItems.map(it => ({
          product_variant_id: it.variant_id,
          quantity: it.quantity,
          price_cents: it.price_cents
        }))
      };

      const result = await createOrder(orderData);

      if (paymentMethod === 'vnpay' && result.payment_url) {
        navigation.navigate('PaymentWebView', {
          url: result.payment_url,
          type: 'shop'
        });
      } else {
        clearCart();
        navigation.navigate('Shop');
        Alert.alert('Thành công', 'Đặt hàng thành công!');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = useMemo(() => name.trim() && phone.trim() && address.trim(), [name, phone, address]);

  if (loading) {
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
      <Text style={styles.title}>Thanh toán</Text>
      <Text style={styles.sub}>Vui lòng điền thông tin giao hàng để chốt đơn.</Text>

      <View style={styles.card}>
        <Field label="Họ tên" value={name} onChangeText={setName} />
        <Field label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Địa chỉ" value={address} onChangeText={setAddress} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng đơn hàng</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.label}>Phương thức thanh toán</Text>
          <View style={styles.paymentOptions}>
            <PaymentOption 
              label="Tiền mặt (COD)" 
              selected={paymentMethod === 'cod'} 
              onPress={() => setPaymentMethod('cod')} 
              icon="cash-outline"
            />
            <PaymentOption 
              label="VNPay" 
              selected={paymentMethod === 'vnpay'} 
              onPress={() => setPaymentMethod('vnpay')} 
              icon="card-outline"
            />
          </View>
        </View>

        <Button
          title={isSubmitting ? "Đang xử lý..." : (paymentMethod === 'vnpay' ? "Thanh toán VNPay" : "Đặt hàng ngay")}
          onPress={handleCheckout}
          loading={isSubmitting}
          disabled={!canSubmit || total <= 0 || isSubmitting}
          fullWidth={true}
        />
      </View>
    </Screen>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sub: { marginTop: 6, fontSize: fontSize.sm, color: colors.textMuted },
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semiBold, color: colors.textMuted },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSize.md,
    backgroundColor: '#FFFFFF',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.lg },
  totalLabel: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.semiBold },
  totalValue: { fontSize: fontSize.lg, color: colors.primary, fontWeight: fontWeight.bold },
  paymentSection: { marginBottom: spacing.xl },
  paymentOptions: { marginTop: spacing.sm },
});

