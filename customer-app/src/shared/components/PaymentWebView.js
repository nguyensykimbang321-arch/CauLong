import React from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import Screen from './Screen';
import { colors } from '../../theme';
import { useAppStore } from '../../data/AppStore';

export default function PaymentWebView({ route, navigation }) {
  const { url, type = 'shop' } = route.params || {};
  const { clearCart } = useAppStore();

  const handleNavigationStateChange = (navState) => {
    // Lắng nghe cả Deep Link và Website Return URL (sử dụng IP)
    const isVnpayReturn = navState.url.includes('vnpay_return') || navState.url.includes('vnpay-return') || navState.url.includes('payment-return');

    if (isVnpayReturn) {
      const isSuccess = navState.url.includes('vnp_ResponseCode=00');

      if (isSuccess) {
        if (type === 'shop') {
          clearCart && clearCart();
          setTimeout(() => {
            navigation.reset({
              index: 1,
              routes: [
                { name: 'Shop' },
                { name: 'MyOrders' }
              ]
            });
          }, 2500);
        } else {
          setTimeout(() => {
            navigation.reset({
              index: 1,
              routes: [
                { name: 'Booking' },
                { name: 'MyBookings' }
              ]
            });
          }, 2500);
        }
      } else {
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
