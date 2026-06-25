import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentStatusIcon({ paymentStatus, size = 18 }) {
  if (paymentStatus === 'paid') {
    return (
      <View style={styles.wrap} accessibilityLabel="Đã thanh toán">
        <Ionicons name="cash-outline" size={size} color="#12B981" />
      </View>
    );
  }

  if (paymentStatus === 'refunded') {
    return (
      <View style={styles.wrap} accessibilityLabel="Đã hoàn tiền">
        <Ionicons name="return-down-back-outline" size={size} color="#94A3B8" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
