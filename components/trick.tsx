import React from 'react';
import Card from './card';
import type { CardItem } from './card';

export const NUM_TEAMS = 2;
export const PLAYERS_PER_TEAM = 2;
export const NUM_PLAYERS = NUM_TEAMS * PLAYERS_PER_TEAM;

export const PLAY_ORDER = [
  'playerHand',
  'rightOpponentHand',
  'partnerHand',
  'leftOpponentHand',
] as const;
export type Hand = typeof PLAY_ORDER[number];

export type Trick = [CardItem?, CardItem?, CardItem?, CardItem?];

export function getRelativeHand(hand: Hand, steps: number): Hand {
  return PLAY_ORDER[
    (PLAY_ORDER.indexOf(hand) + NUM_PLAYERS + steps) % NUM_PLAYERS
  ];
}

const Trick = ({
  cards,
  leader,
}: {
  cards: Trick;
  leader: Hand;
}): JSX.Element => {
  return (
    <div className="root">
      {cards.map((card, index) => {
        return (
          <div
            key={card.id}
            className={`card${index} ${getRelativeHand(leader, index)}`}
          >
            <Card
              face={card.face}
              suit={card.suit}
              hidden={false}
              size="medium"
            />
          </div>
        );
      })}
      <style jsx>{`
        .root {
          display: grid;
          grid-template-rows: repeat(3, var(--vRythm)) var(--cardHeight);
          grid-template-columns: repeat(3, var(--gutter)) var(--cardWidth);
        }
        .partnerHand {
          grid-column: 3;
          grid-row: 1;
        }
        .rightOpponentHand {
          grid-column: 4;
          grid-row: 2;
        }
        .leftOpponentHand {
          grid-column: 1;
          grid-row: 3;
        }
        .playerHand {
          grid-column: 2;
          grid-row: 4;
        }
        .card0 {
          z-index: 1;
        }
        .card1 {
          z-index: 2;
        }
        .card2 {
          z-index: 3;
        }
        .card3 {
          z-index: 4;
        }
      `}</style>
    </div>
  );
};

export default Trick;
