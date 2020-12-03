import React from 'react';
import { CARDS } from './card';
import Trick, { PLAY_ORDER } from './trick';
import { withKnobs, select } from '@storybook/addon-knobs';

export default {
  title: 'Game/Trick',
  decorators: [withKnobs],
};

export const baseCard = (): JSX.Element => {
  const cardsLength = select('Cards', [0, 1, 2, 3, 4], 4);
  return (
    <Trick
      cards={CARDS.slice(0, cardsLength) as any}
      leader={select('Leader', PLAY_ORDER, PLAY_ORDER[0])}
    />
  );
};
