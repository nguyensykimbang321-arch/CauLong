import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

export default function Screen({ children, style }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.bg}>
        <View
          style={[
            styles.container,
            style,
          ]}
        >
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  bg: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
});

