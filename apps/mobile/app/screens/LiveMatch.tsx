import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RemoteParticipant, Room } from 'livekit-client';

import AiCoachPanel from '../components/AiCoachPanel';
import PrimaryButton from '../components/Buttons/PrimaryButton';
import SecondaryButton from '../components/Buttons/SecondaryButton';
import ReactionsBar from '../components/ReactionsBar';
import TimerBar from '../components/TimerBar';
import { joinLiveKitRoom } from '../lib/livekit';
import { useAuthStore } from '../state/authStore';
import { useMatchStore } from '../state/matchStore';
import { palette, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveMatch'>;

const LiveMatchScreen: React.FC<Props> = ({ navigation, route }) => {
  const match = useMatchStore((state) => state.match);
  const participants = useMatchStore((state) => state.participants);
  const livekit = useMatchStore((state) => state.livekit);
  const joinMatch = useMatchStore((state) => state.joinMatch);
  const startRound = useMatchStore((state) => state.startRound);
  const endRound = useMatchStore((state) => state.endRound);
  const submitVote = useMatchStore((state) => state.submitVote);
  const resetMatch = useMatchStore((state) => state.resetMatch);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const role = useMatchStore((state) => state.role);
  const [room, setRoom] = useState<Room | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);

  const matchId = route.params?.matchId ?? match?.id;

  useEffect(() => {
    if (matchId && (!match || match.id !== matchId)) {
      void joinMatch(matchId).catch((error) => {
        console.error('Failed to refresh match state', error);
      });
    }
  }, [matchId, match?.id, joinMatch]);

  useEffect(() => {
    if (!livekit?.token) {
      return;
    }
    let cancelled = false;
    let roomInstance: Room | null = null;

    const connect = async () => {
      try {
        roomInstance = await joinLiveKitRoom(
          {
            url: process.env.EXPO_PUBLIC_LIVEKIT_URL ?? '',
            token: livekit.token
          },
          (participantsUpdate) => {
            if (!cancelled) {
              setRemoteParticipants(participantsUpdate);
            }
          }
        );
        if (!cancelled) {
          setRoom(roomInstance);
        } else {
          roomInstance.disconnect();
        }
      } catch (error) {
        console.error('Failed to join LiveKit room', error);
        Alert.alert('Audio connection issue', 'We could not connect to the voice room.');
      }
    };

    void connect();

    return () => {
      cancelled = true;
      roomInstance?.disconnect();
      setRemoteParticipants([]);
      setRoom(null);
    };
  }, [livekit?.token]);

  const handleStartRound = () => {
    if (!match || !participants.length) {
      return;
    }
    const speaker = participants[0];
    startRound({ speakerUserId: speaker.userId, durationSec: 120 });
  };

  const handleVote = (participantId: string) => {
    submitVote(participantId);
    Alert.alert('Vote sent', 'Thanks for voting!');
  };

  const handleLeave = () => {
    room?.disconnect();
    resetMatch();
    navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{match?.topic ?? 'Live Match'}</Text>
        <TimerBar />
        <ReactionsBar />
        <View style={styles.participants}>
          <Text style={styles.sectionTitle}>Participants</Text>
          {participants.map((participant) => (
            <View key={participant.id} style={styles.participantRow}>
              <Text style={styles.participantName}>{participant.userId}</Text>
              {participant.userId !== userId && (
                <SecondaryButton label="Vote" onPress={() => handleVote(participant.userId)} />
              )}
            </View>
          ))}
          {remoteParticipants.map((participant) => (
            <View key={participant.sid} style={styles.participantRow}>
              <Text style={styles.participantName}>{participant.identity}</Text>
            </View>
          ))}
        </View>
        <AiCoachPanel />
      </ScrollView>
      <View style={styles.controls}>
        {role === 'HOST' && (
          <PrimaryButton label="Start Round" onPress={handleStartRound} />
        )}
        <SecondaryButton label="End Round" onPress={endRound} />
        <SecondaryButton label="Leave" onPress={handleLeave} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background
  },
  scrollContent: {
    padding: spacing.lg,
    rowGap: spacing.lg
  },
  title: {
    ...typography.title,
    color: palette.textPrimary
  },
  participants: {
    rowGap: spacing.sm,
    backgroundColor: palette.surface,
    padding: spacing.md,
    borderRadius: 16
  },
  sectionTitle: {
    ...typography.subtitle,
    color: palette.textPrimary
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  participantName: {
    ...typography.body,
    color: palette.textSecondary
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    backgroundColor: palette.surface
  }
});

export default LiveMatchScreen;
