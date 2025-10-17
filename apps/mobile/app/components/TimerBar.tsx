import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useMatchStore } from '../state/matchStore';
import { palette, spacing, typography } from '../theme/tokens';

const TimerBar: React.FC = () => {
  const timer = useMatchStore((state) => state.timer);
  const percent = useMemo(() => {
    if (!timer || timer.durationSec === 0) {
      return 0;
    }
    return Math.max(0, Math.min(1, timer.remainingSec / timer.durationSec));
  }, [timer]);

  if (!timer) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { flex: percent }]} />
        <View style={{ flex: 1 - percent }} />
      </View>
      <Text style={styles.label}>{timer.remainingSec}s remaining</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    padding: spacing.sm,
    borderRadius: 12
  },
  progressTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: palette.surfaceMuted
  },
  progressFill: {
    backgroundColor: palette.success,
    borderRadius: 4
  },
  label: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: palette.textPrimary,
    textAlign: 'center'
  }
});

export default TimerBar;
