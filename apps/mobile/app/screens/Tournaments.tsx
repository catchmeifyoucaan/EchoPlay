import React, { useCallback, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import PrimaryButton from '../components/Buttons/PrimaryButton';
import { apiClient } from '../lib/api';
import { useMatchStore } from '../state/matchStore';
import { palette, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../App';

interface TournamentSummary {
  id: string;
  name: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
}

const TournamentsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const createMatch = useMatchStore((state) => state.createMatch);

  const loadTournaments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<TournamentSummary[]>('/v1/tournaments');
      setTournaments(data);
    } catch (error) {
      console.error('Failed to load tournaments', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTournaments();
    }, [loadTournaments])
  );

  const handleJoin = async (tournament: TournamentSummary) => {
    try {
      const match = await createMatch({ mode: 'GLOBAL', topic: tournament.name });
      navigation.navigate('Lobby', { matchId: match.id });
    } catch (error) {
      console.error('Failed to join tournament', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTournaments} />}
      >
        <Text style={styles.title}>Tournaments</Text>
        {tournaments.map((tournament) => (
          <View key={tournament.id} style={styles.card}>
            <Text style={styles.cardTitle}>{tournament.name}</Text>
            {tournament.description && <Text style={styles.description}>{tournament.description}</Text>}
            <PrimaryButton label="Join" onPress={() => handleJoin(tournament)} />
          </View>
        ))}
        {!tournaments.length && !loading && <Text style={styles.placeholder}>No tournaments yet. Check back soon!</Text>}
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
  card: {
    backgroundColor: palette.surface,
    padding: spacing.md,
    borderRadius: 16,
    rowGap: spacing.sm
  },
  cardTitle: {
    ...typography.subtitle,
    color: palette.textPrimary
  },
  description: {
    ...typography.body,
    color: palette.textSecondary
  },
  placeholder: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center'
  }
});

export default TournamentsScreen;
