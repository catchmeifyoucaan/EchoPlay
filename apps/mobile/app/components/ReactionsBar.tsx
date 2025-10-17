import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ReactionKind, useMatchStore } from '../state/matchStore';
import PrimaryButton from './Buttons/PrimaryButton';
import { palette, spacing } from '../theme/tokens';

type ReactionButtonProps = {
  type: ReactionKind;
  emoji: string;
};

const ReactionButton: React.FC<ReactionButtonProps> = ({ type, emoji }) => {
  const submitReaction = useMatchStore((state) => state.submitReaction);
  const count = useMatchStore((state) => state.reactions[type]);

  return (
    <PrimaryButton
      label={`${emoji} ${count}`}
      onPress={() => submitReaction(type)}
    />
  );
};

const ReactionsBar: React.FC = () => (
  <View style={styles.container}>
    <ReactionButton type="heart" emoji="❤️" />
    <ReactionButton type="thumbs" emoji="👍" />
    <ReactionButton type="laugh" emoji="😂" />
    <ReactionButton type="flame" emoji="🔥" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    justifyContent: 'space-evenly',
    backgroundColor: palette.surface,
    padding: spacing.sm,
    borderRadius: 16
  }
});

export default ReactionsBar;
