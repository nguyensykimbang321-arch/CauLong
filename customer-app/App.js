import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/shared/navigation/AppNavigator';
import { AppStoreProvider } from './src/data/AppStore';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppStoreProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}

