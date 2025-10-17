import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { palette, spacing, typography } from '../../theme/tokens';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ label, onPress, disabled, loading }) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [
      styles.base,
      (pressed || loading) && styles.pressed,
      disabled && styles.disabled
    ]}
    disabled={disabled || loading}
  >
    {loading ? <ActivityIndicator color={palette.textOnPrimary} /> : <Text style={styles.label}>{label}</Text>}
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: palette.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    alignItems: 'center'
  },
  pressed: {
    opacity: 0.7
  },
  disabled: {
    opacity: 0.4
  },
  label: {
    ...typography.button,
    color: palette.textOnPrimary
  }
});

export default PrimaryButton;
