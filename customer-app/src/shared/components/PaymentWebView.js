import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import Screen from './Screen';
import { colors } from '../../theme';

export default function PaymentWebView({ route, navigation }) {
  const { url, onPaymentSuccess, onPaymentCancel } = route.params;

  const handleNavigationStateChange = (navState) => {
    // Replace this with your actual return URL from VNPay redirect
    const returnUrl = 'caulong://payment-return'; 

    if (navState.url.includes(returnUrl)) {
      if (navState.url.includes('vnp_ResponseCode=00')) {
        onPaymentSuccess && onPaymentSuccess(navState.url);
      } else {
        onPaymentCancel && onPaymentCancel(navState.url);
      }
      navigation.goBack();
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
