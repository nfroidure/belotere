import React from 'react';
import { CARDS } from './card';
import Hand, { ALL_POSITIONS } from './hand';
import { withKnobs, select, boolean } from '@storybook/addon-knobs';

export default {
  title: 'Game/Hand',
  decorators: [withKnobs],
};

export const baseCard = (): JSX.Element => {
  const cardsLength = select('Cards', [0, 1, 2, 3, 4, 5, 6, 7, 8], 8);
  return (
    <Hand
      cards={CARDS.slice(0, cardsLength)}
      position={select('Position', ALL_POSITIONS, ALL_POSITIONS[0])}
      hidden={boolean('Hidden', false)}
    />
  );
};
