import React from 'react';
import { CARDS } from './card';
import Mat from './mat';
import { withKnobs, select } from '@storybook/addon-knobs';
import { PLAY_ORDER } from './trick';

export default {
  title: 'Game/Mat',
  decorators: [withKnobs],
};

export const baseCard = (): JSX.Element => {
  const handElements = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <Mat
      playerHand={CARDS.slice(0, select('Main hand', handElements, 8))}
      partnerHand={CARDS.slice(0, select('Hand 1', handElements, 8))}
      leftOpponentHand={CARDS.slice(0, select('Hand 2', handElements, 8))}
      rightOpponentHand={CARDS.slice(0, select('Hand 3', handElements, 8))}
      trick={CARDS.slice(0, select('Trick', [0, 1, 2, 3, 4], 4)) as any}
      leader={select('Leader', PLAY_ORDER, PLAY_ORDER[0])}
      hand={select('Hand', PLAY_ORDER, PLAY_ORDER[0])}
      onCardSelect={() => undefined}
    />
  );
};
