import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import PrimaryButton from '../components/Buttons/PrimaryButton';
import { useAuthStore } from '../state/authStore';
import { palette, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'ModeSelect'>;

const ModeSelectScreen: React.FC<Props> = ({ navigation }) => {
  const updateProfileMode = useAuthStore((state) => state.updateProfileMode);

  const handleSelect = async (mode: 'SOLO' | 'FAMILY' | 'COUPLE') => {
    await updateProfileMode(mode);
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose your play style</Text>
        <Text style={styles.subtitle}>You can switch anytime from your profile.</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="Solo" onPress={() => handleSelect('SOLO')} />
        <PrimaryButton label="Family" onPress={() => handleSelect('FAMILY')} />
        <PrimaryButton label="Couple" onPress={() => handleSelect('COUPLE')} />
      </View>
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
  header: {
    rowGap: spacing.sm
  },
  title: {
    ...typography.title,
    color: palette.textPrimary
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary
  },
  actions: {
    rowGap: spacing.md
  }
});

export default ModeSelectScreen;
