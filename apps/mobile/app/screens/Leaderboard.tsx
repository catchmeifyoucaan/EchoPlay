import React, { useCallback, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { apiClient } from '../lib/api';
import { palette, spacing, typography } from '../theme/tokens';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
}

const LeaderboardScreen: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<{ entries: LeaderboardEntry[] }>('/v1/leaderboard?scope=GLOBAL&period=WEEKLY');
      setEntries(data.entries ?? []);
    } catch (error) {
      console.error('Failed to load leaderboard', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchLeaderboard();
    }, [fetchLeaderboard])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchLeaderboard} />}
      >
        <Text style={styles.title}>Weekly Leaders</Text>
        {entries.map((entry, index) => (
          <View key={entry.userId} style={styles.row}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <View style={styles.rowInfo}>
              <Text style={styles.name}>{entry.displayName}</Text>
              <Text style={styles.score}>{entry.score} pts</Text>
            </View>
          </View>
        ))}
        {!entries.length && !loading && <Text style={styles.placeholder}>No entries yet. Play a match to get on the board!</Text>}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background
  },
  content: {
    padding: spacing.lg,
    rowGap: spacing.md
  },
  title: {
    ...typography.title,
    color: palette.textPrimary
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    padding: spacing.md,
    borderRadius: 16,
    columnGap: spacing.md
  },
  rank: {
    ...typography.title,
    color: palette.primary
  },
  rowInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  name: {
    ...typography.subtitle,
    color: palette.textPrimary
  },
  score: {
    ...typography.subtitle,
    color: palette.textSecondary
  },
  placeholder: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center'
  }
});

export default LeaderboardScreen;
