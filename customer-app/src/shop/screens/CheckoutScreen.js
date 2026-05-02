import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, Alert, Pressable } from 'react-native';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { getFacilities, getCurrentUser } from '../../data/mockStore';
import Button from '../../shared/components/Button';
import { calcCartTotal, formatPrice } from '../../utils/formatters';
import { useAppStore } from '../../data/AppStore';
import PaymentOption from '../../shared/components/PaymentOption';

export default function CheckoutScreen({ navigation }) {
  const { state, clearCart } = useAppStore();
  const total = useMemo(() => calcCartTotal(state.cartItems), [state.cartItems]);

  const [loading, setLoading] = useState(true);
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
            if (facilities.length > 0) {
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
      <Text style={styles.sub}>Vui lòng điền thông tin giao hàng.</Text>

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
          title={paymentMethod === 'vnpay' ? "Thanh toán VNPay" : "Đặt hàng ngay"}
          onPress={() => {
            if (paymentMethod === 'vnpay') {
              const mockVnpayUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=1000000&vnp_Command=pay&vnp_CreateDate=20210801153333&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang&vnp_OrderType=other&vnp_ReturnUrl=caulong%3A%2F%2Fpayment-return&vnp_TmnCode=M0A3F9BU&vnp_TxnRef=123456&vnp_Version=2.1.0&vnp_SecureHash=...';
              
              navigation.navigate('PaymentWebView', { 
                url: mockVnpayUrl,
                onPaymentSuccess: (url) => {
                  clearCart();
                  navigation.navigate('Shop');
                  Alert.alert('Thành công', 'Thanh toán VNPay thành công!');
                },
                onPaymentCancel: (url) => {
                  Alert.alert('Thông báo', 'Giao dịch đã bị hủy.');
                }
              });
            } else {
              clearCart();
              navigation.navigate('Shop');
              Alert.alert('Thành công', 'Đặt hàng thành công!');
            }
          }}
          disabled={!canSubmit || total <= 0}
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

