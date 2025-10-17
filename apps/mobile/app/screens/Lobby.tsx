import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import PrimaryButton from '../components/Buttons/PrimaryButton';
import SecondaryButton from '../components/Buttons/SecondaryButton';
import { useAuthStore } from '../state/authStore';
import { useMatchStore } from '../state/matchStore';
import { palette, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Lobby'>;

const LobbyScreen: React.FC<Props> = ({ navigation, route }) => {
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const match = useMatchStore((state) => state.match);
  const role = useMatchStore((state) => state.role);
  const participants = useMatchStore((state) => state.participants);
  const joinMatch = useMatchStore((state) => state.joinMatch);
  const startMatch = useMatchStore((state) => state.startMatch);
  const [starting, setStarting] = useState(false);

  const matchId = route.params?.matchId ?? match?.id ?? null;

  useEffect(() => {
    if (matchId && (!match || match.id !== matchId)) {
      void joinMatch(matchId).catch((error) => {
        console.error('Failed to load lobby', error);
      });
    }
  }, [matchId, match?.id, joinMatch]);

  const isHost = role === 'HOST' || (match && match.hostUserId === currentUserId);

  const handleStartMatch = async () => {
    if (!matchId || !match) {
      return;
    }
    try {
      setStarting(true);
      await startMatch(matchId, { speakerUserId: match.hostUserId, durationSec: 120 });
      navigation.replace('LiveMatch', { matchId });
    } catch (error) {
      console.error('Failed to start match', error);
      Alert.alert('Unable to start match', 'Please try again or choose another mode.');
    } finally {
      setStarting(false);
    }
  };

  const participantCount = participants.length;

  return (
    <SafeAreaView style={styles.container}>
      {match ? (
        <View style={styles.content}>
          <Text style={styles.heading}>Lobby</Text>
          <Text style={styles.topic}>{match.topic}</Text>
          <Text style={styles.meta}>Mode: {match.mode}</Text>
          <Text style={styles.meta}>Participants: {participantCount}</Text>
          {isHost ? (
            <PrimaryButton label={starting ? 'Starting...' : 'Start Match'} onPress={handleStartMatch} loading={starting} />
          ) : (
            <Text style={styles.meta}>Waiting for host to start…</Text>
          )}
          <SecondaryButton label="Invite" onPress={() => Alert.alert('Invite link copied')} />
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.meta}>Loading lobby…</Text>
        </View>
      )}
      <SecondaryButton label="Back to Home" onPress={() => navigation.navigate('Main')} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: spacing.lg,
    justifyContent: 'space-between'
  },
  content: {
    rowGap: spacing.md
  },
  heading: {
    ...typography.title,
    color: palette.textPrimary
  },
  topic: {
    ...typography.subtitle,
    color: palette.textPrimary
  },
  meta: {
    ...typography.body,
    color: palette.textSecondary
  }
});

export default LobbyScreen;
