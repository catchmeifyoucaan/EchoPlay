import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useMatchStore } from '../state/matchStore';
import PrimaryButton from './Buttons/PrimaryButton';
import { palette, spacing, typography } from '../theme/tokens';

const AiCoachPanel: React.FC = () => {
  const requestAiScore = useMatchStore((state) => state.requestAiScore);
  const aiScore = useMatchStore((state) => state.aiScore);
  const match = useMatchStore((state) => state.match);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Coach</Text>
        <PrimaryButton label="Get Feedback" onPress={requestAiScore} />
      </View>
      {aiScore ? (
        <View style={styles.content}>
          <Text style={styles.score}>Score: {aiScore.score}</Text>
          {aiScore.winnerUserId && <Text style={styles.subtitle}>Winner: {aiScore.winnerUserId}</Text>}
          {aiScore.feedbackSummary && <Text style={styles.summary}>{aiScore.feedbackSummary}</Text>}
        </View>
      ) : (
        <Text style={styles.summary}>
          Request feedback at the end of the round to see how the AI coach scored your performance.
        </Text>
      )}
      {match?.winnerUserId && (
        <Text style={styles.footer}>Match winner: {match.winnerUserId}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    padding: spacing.md,
    borderRadius: 16,
    rowGap: spacing.sm
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    ...typography.subtitle,
    color: palette.textPrimary
  },
  content: {
    rowGap: spacing.xs
  },
  score: {
    ...typography.title,
    color: palette.primary
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary
  },
  summary: {
    ...typography.body,
    color: palette.textPrimary
  },
  footer: {
    ...typography.caption,
    color: palette.textSecondary
  }
});

export default AiCoachPanel;
