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

        <Button
          title="Đặt hàng (mock)"
          onPress={() => {
            clearCart();
            navigation.navigate('Shop');
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
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.md },
  totalLabel: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.semiBold },
  totalValue: { fontSize: fontSize.lg, color: colors.primary, fontWeight: fontWeight.bold },
});

