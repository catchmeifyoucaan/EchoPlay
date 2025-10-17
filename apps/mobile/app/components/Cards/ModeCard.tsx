import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '../../theme/tokens';

type ModeCardProps = {
  title: string;
  description: string;
  onPress: () => void;
};

const ModeCard: React.FC<ModeCardProps> = ({ title, description, onPress }) => (
  <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed]} onPress={onPress}>
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
    <Text style={styles.cta}>Play</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    padding: spacing.lg,
    borderRadius: 20,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pressed: {
    opacity: 0.8
  },
  title: {
    ...typography.title,
    color: palette.textPrimary
  },
  description: {
    ...typography.body,
    color: palette.textSecondary,
    marginTop: spacing.xs,
    maxWidth: '80%'
  },
  cta: {
    ...typography.button,
    color: palette.primary
  }
});

export default ModeCard;
