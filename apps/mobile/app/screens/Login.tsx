import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import auth from '@react-native-firebase/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import PrimaryButton from '../components/Buttons/PrimaryButton';
import SecondaryButton from '../components/Buttons/SecondaryButton';
import { useAuthStore } from '../state/authStore';
import { palette, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type Provider = 'apple' | 'google' | 'email';

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const signIn = useAuthStore((state) => state.signInWithFirebaseIdToken);
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

  const handleSignIn = async (provider: Provider) => {
    try {
      setLoadingProvider(provider);
      const credential = await auth().signInAnonymously();
      const token = await credential.user.getIdToken();
      await signIn(token);
      navigation.replace('ModeSelect');
    } catch (error) {
      console.error('Failed to sign in', error);
      Alert.alert('Sign-in failed', 'We could not complete your sign in. Please try again.');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log in to EchoPlay</Text>
        <Text style={styles.subtitle}>Choose your preferred sign-in provider.</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          label="Continue with Apple"
          onPress={() => handleSignIn('apple')}
          loading={loadingProvider === 'apple'}
        />
        <PrimaryButton
          label="Continue with Google"
          onPress={() => handleSignIn('google')}
          loading={loadingProvider === 'google'}
        />
        <PrimaryButton
          label="Continue with Email"
          onPress={() => handleSignIn('email')}
          loading={loadingProvider === 'email'}
        />
        <SecondaryButton label="Back" onPress={() => navigation.goBack()} />
      </View>
      <Text style={styles.footer}>
        By continuing you agree to our community guidelines and parental consent requirements.
      </Text>
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
  },
  footer: {
    ...typography.caption,
    color: palette.textSecondary,
    textAlign: 'center'
  }
});

export default LoginScreen;
