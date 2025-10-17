import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import PrimaryButton from '../components/Buttons/PrimaryButton';
import { palette, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Image source={{ uri: 'https://placehold.co/200x200' }} style={styles.logo} />
      <Text style={styles.title}>Welcome to EchoPlay</Text>
      <Text style={styles.subtitle}>Debate with friends, family, or the world in a safe, AI-powered arena.</Text>
    </View>
    <PrimaryButton label="Get Started" onPress={() => navigation.navigate('Login')} />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: spacing.lg,
    justifyContent: 'space-between'
  },
  content: {
    alignItems: 'center',
    rowGap: spacing.md
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.surface
  },
  title: {
    ...typography.title,
    color: palette.textPrimary,
    textAlign: 'center'
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center'
  }
});

export default WelcomeScreen;
