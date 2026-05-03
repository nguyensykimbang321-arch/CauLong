import React from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import Screen from './Screen';
import { colors } from '../../theme';
import { useAppStore } from '../../data/AppStore';

export default function PaymentWebView({ route, navigation }) {
  const { url, type = 'shop' } = route.params;
  const { clearCart } = useAppStore();

  const handleNavigationStateChange = (navState) => {
    // Lắng nghe cả Deep Link và Website Return URL (sử dụng IP)
    const isVnpayReturn = navState.url.includes('vnpay_return') || navState.url.includes('payment-return');

    if (isVnpayReturn) {
      const isSuccess = navState.url.includes('vnp_ResponseCode=00');
      
      if (isSuccess) {
        if (type === 'shop') {
          clearCart && clearCart();
          navigation.navigate('Shop');
          setTimeout(() => {
            Alert.alert('Thành công', 'Thanh toán đơn hàng thành công!');
          }, 500);
        } else {
          // Luồng Đặt sân
          navigation.navigate('MyBookings');
          setTimeout(() => {
            Alert.alert('Thành công', 'Đặt sân thành công!');
          }, 500);
        }
      } else {
        Alert.alert('Thông báo', 'Giao dịch đã bị hủy hoặc thất bại.');
        navigation.goBack();
      }
    }
  };


  return (
    <Screen>
      <WebView
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});
