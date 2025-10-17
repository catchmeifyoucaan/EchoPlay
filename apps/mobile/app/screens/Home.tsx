import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ModeCard from '../components/Cards/ModeCard';
import { useMatchStore } from '../state/matchStore';
import { palette, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../App';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const createMatch = useMatchStore((state) => state.createMatch);
  const [loading, setLoading] = useState(false);

  const handlePlay = async (mode: 'SOLO' | 'FAMILY' | 'COUPLE' | 'GLOBAL') => {
    if (loading) {
      return;
    }
    try {
      setLoading(true);
      const match = await createMatch({ mode });
      navigation.navigate('Lobby', { matchId: match.id });
    } catch (error) {
      console.error('Failed to create match', error);
      Alert.alert('Could not create match', 'Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Tonight&apos;s Matches</Text>
        <ModeCard title="Couple Duel" description="Challenge your partner to a playful debate." onPress={() => handlePlay('COUPLE')} />
        <ModeCard title="Family Night" description="Team up with the whole family." onPress={() => handlePlay('FAMILY')} />
        <ModeCard title="Global Challenge" description="Compete with the EchoPlay community worldwide." onPress={() => handlePlay('GLOBAL')} />
        <ModeCard title="Solo Practice" description="Sharpen your skills with AI prompts." onPress={() => handlePlay('SOLO')} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background
  },
  scrollContent: {
    padding: spacing.lg
  },
  title: {
    ...typography.title,
    color: palette.textPrimary,
    marginBottom: spacing.md
  }
});

export default HomeScreen;
