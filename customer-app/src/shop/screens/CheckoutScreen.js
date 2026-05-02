import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import { getMock } from '../../data/mockStore';
import Button from '../../shared/components/Button';
import { calcCartTotal, formatPrice } from '../../utils/formatters';
import { useAppStore } from '../../data/AppStore';

export default function CheckoutScreen({ navigation }) {
  const mock = getMock();
  const { state, clearCart } = useAppStore();
  const total = useMemo(() => calcCartTotal(state.cartItems), [state.cartItems]);

  const [name, setName] = useState(mock.currentUser.full_name);
  const [phone, setPhone] = useState(mock.currentUser.phone);
  const [address, setAddress] = useState(mock.facility.address);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'vnpay'

  const canSubmit = useMemo(() => name.trim() && phone.trim() && address.trim(), [name, phone, address]);

  return (
    <Screen>
      <Text style={styles.title}>Thanh toán</Text>
      <Text style={styles.sub}>Demo mock: form tạm, chưa gọi backend.</Text>

      <View style={styles.card}>
        <Field label="Họ tên" value={name} onChangeText={setName} />
        <Field label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Địa chỉ" value={address} onChangeText={setAddress} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.label}>Phương thức thanh toán</Text>
          <View style={styles.paymentOptions}>
            <PaymentOption 
              label="Tiền mặt (COD)" 
              selected={paymentMethod === 'cod'} 
              onPress={() => setPaymentMethod('cod')} 
            />
            <PaymentOption 
              label="VNPay" 
              selected={paymentMethod === 'vnpay'} 
              onPress={() => setPaymentMethod('vnpay')} 
            />
          </View>
        </View>

        <Button
          title={paymentMethod === 'vnpay' ? "Thanh toán VNPay" : "Đặt hàng (mock)"}
          onPress={() => {
            if (paymentMethod === 'vnpay') {
              // Mock VNPay URL for demonstration with your TmnCode
              const mockVnpayUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=1000000&vnp_Command=pay&vnp_CreateDate=20210801153333&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang&vnp_OrderType=other&vnp_ReturnUrl=caulong%3A%2F%2Fpayment-return&vnp_TmnCode=M0A3F9BU&vnp_TxnRef=123456&vnp_Version=2.1.0&vnp_SecureHash=...';
              
              navigation.navigate('PaymentWebView', { 
                url: mockVnpayUrl,
                onPaymentSuccess: (url) => {
                  clearCart();
                  navigation.navigate('Shop');
                  alert('Thanh toán VNPay thành công!');
                },
                onPaymentCancel: (url) => {
                  alert('Giao dịch đã bị hủy.');
                }
              });
            } else {
              clearCart();
              navigation.navigate('Shop');
              alert('Đặt hàng thành công!');
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

function PaymentOption({ label, selected, onPress }) {
  return (
    <Pressable 
      onPress={onPress}
      style={[
        styles.paymentOption, 
        selected && styles.paymentOptionSelected
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={[styles.paymentLabel, selected && styles.paymentLabelSelected]}>{label}</Text>
    </Pressable>
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
  paymentOptions: { marginTop: spacing.sm, gap: spacing.sm },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFBFF',
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paymentLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  paymentLabelSelected: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});

import { Pressable } from 'react-native';

