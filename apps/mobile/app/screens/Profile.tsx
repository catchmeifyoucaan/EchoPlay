import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import PrimaryButton from '../components/Buttons/PrimaryButton';
import SecondaryButton from '../components/Buttons/SecondaryButton';
import { useAuthStore } from '../state/authStore';
import { palette, spacing, typography } from '../theme/tokens';

const ProfileScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.profiles[0]?.bio ?? '');
  const [interests, setInterests] = useState((user?.profiles[0]?.interests ?? []).join(', '));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({
        displayName,
        bio,
        interests: interests.split(',').map((item) => item.trim()).filter(Boolean)
      });
      Alert.alert('Profile updated', 'Your changes have been saved.');
    } catch (error) {
      console.error('Failed to update profile', error);
      Alert.alert('Update failed', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={palette.textSecondary}
        />
        <Text style={styles.label}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          style={[styles.input, styles.multiline]}
          placeholder="Tell the community about your debate style"
          placeholderTextColor={palette.textSecondary}
          multiline
        />
        <Text style={styles.label}>Interests</Text>
        <TextInput
          value={interests}
          onChangeText={setInterests}
          style={styles.input}
          placeholder="e.g. climate, gaming, philosophy"
          placeholderTextColor={palette.textSecondary}
        />
        <PrimaryButton label={saving ? 'Saving…' : 'Save changes'} onPress={handleSave} loading={saving} />
      </View>
      <SecondaryButton label="Log out" onPress={() => logout()} />
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
  section: {
    rowGap: spacing.md
  },
  label: {
    ...typography.subtitle,
    color: palette.textPrimary
  },
  input: {
    backgroundColor: palette.surface,
    padding: spacing.md,
    borderRadius: 12,
    color: palette.textPrimary
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top'
  }
});

export default ProfileScreen;
