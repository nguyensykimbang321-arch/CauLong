import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Screen from '../../shared/components/Screen';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../theme';
import Button from '../../shared/components/Button';

export default function QRCheckinScreen() {
  const [code, setCode] = useState('');

  const normalized = useMemo(() => code.trim(), [code]);
  const canSubmit = normalized.length >= 6;

  return (
    <Screen>
      <Text style={styles.title}>QR Check-in</Text>
      <Text style={styles.sub}>
        Demo mock: nhập mã QR (ví dụ <Text style={styles.mono}>BK-A1-20260422-1800</Text>)
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Mã QR</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Nhập mã..."
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
        <Button
          title="Xác nhận"
          onPress={() => {}}
          disabled={!canSubmit}
          fullWidth={true}
        />
        <Text style={styles.hint}>
          Lưu ý: boolean props luôn truyền dạng <Text style={styles.mono}>{'{true}'}</Text> /{' '}
          <Text style={styles.mono}>{'{false}'}</Text>, không dùng <Text style={styles.mono}>"true"</Text>.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sub: { marginTop: 6, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18 },
  mono: { fontFamily: 'monospace' },
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semiBold, color: colors.textMuted },
  input: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSize.md,
    backgroundColor: '#FFFFFF',
  },
  hint: { marginTop: spacing.md, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 18 },
});

