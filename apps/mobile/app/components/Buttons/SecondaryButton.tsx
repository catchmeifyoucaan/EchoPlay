import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { palette, spacing, typography } from '../../theme/tokens';

type SecondaryButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
};

const SecondaryButton: React.FC<SecondaryButtonProps> = ({ label, onPress, disabled }) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [styles.base, pressed && styles.pressed, disabled && styles.disabled]}
    disabled={disabled}
  >
    <Text style={styles.label}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: palette.primary,
    alignItems: 'center'
  },
  pressed: {
    backgroundColor: palette.primarySoft
  },
  disabled: {
    opacity: 0.5
  },
  label: {
    ...typography.button,
    color: palette.primary
  }
});

export default SecondaryButton;
