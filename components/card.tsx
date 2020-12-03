import React, { ButtonHTMLAttributes } from 'react';

export const CARD_SUITS = ['♠', '♥', '♣', '♦'] as const;
export type CardSuit = typeof CARD_SUITS[number];
export const CARD_COLORS = ['red', 'black'];
export type CardColor = typeof CARD_COLORS[number];
export type CardSuitDetails = {
  name: string;
  color: CardColor;
  symbol: CardSuit;
  line: number;
};

export const CARD_SUITS_HASH: Record<CardSuit, CardSuitDetails> = {
  '♠': {
    name: 'spade',
    color: 'black',
    symbol: '♠',
    line: 3,
  },
  '♥': {
    name: 'heart',
    color: 'red',
    symbol: '♥',
    line: 2,
  },
  '♣': {
    name: 'club',
    color: 'black',
    symbol: '♣',
    line: 0,
  },
  '♦': {
    name: 'diamond',
    color: 'red',
    symbol: '♦',
    line: 1,
  },
};

export const CARD_FACES = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export type CardFace = typeof CARD_FACES[number];
export type CardFaceDetails = {
  name: string;
  symbol: CardFace;
  suitRank: number;
  suitValue: number;
  trumpRank: number;
  trumpValue: number;
  row: number;
};

export const CARD_FACES_HASH: Record<CardFace, CardFaceDetails> = {
  '7': {
    name: '7',
    symbol: '7',
    suitRank: 1,
    suitValue: 0,
    trumpRank: 1,
    trumpValue: 0,
    row: 6,
  },
  '8': {
    name: '8',
    symbol: '8',
    suitRank: 2,
    suitValue: 0,
    trumpRank: 2,
    trumpValue: 0,
    row: 7,
  },
  '9': {
    name: '9',
    symbol: '9',
    suitRank: 3,
    suitValue: 0,
    trumpRank: 7,
    trumpValue: 14,
    row: 8,
  },
  '10': {
    name: '10',
    symbol: '10',
    suitRank: 7,
    suitValue: 10,
    trumpRank: 5,
    trumpValue: 10,
    row: 9,
  },
  J: {
    name: 'jack',
    symbol: 'J',
    suitRank: 4,
    suitValue: 2,
    trumpRank: 8,
    trumpValue: 20,
    row: 10,
  },
  Q: {
    name: 'queen',
    symbol: 'Q',
    suitRank: 5,
    suitValue: 3,
    trumpRank: 3,
    trumpValue: 3,
    row: 11,
  },
  K: {
    name: 'king',
    symbol: 'K',
    suitRank: 6,
    suitValue: 4,
    trumpRank: 4,
    trumpValue: 4,
    row: 12,
  },
  A: {
    name: '1',
    symbol: 'A',
    suitRank: 8,
    suitValue: 11,
    trumpRank: 6,
    trumpValue: 11,
    row: 0,
  },
};

export const CARDS_PER_SUIT = 8;

export type CardItem = {
  id: number;
  name: string;
  suit: CardSuit;
  face: CardFace;
};
export const CARDS: CardItem[] = Object.keys(CARD_SUITS_HASH).reduce<
  CardItem[]
>((cards, suitName, i) => {
  return cards.concat(
    Object.keys(CARD_FACES_HASH).map((faceName, j) => {
      return {
        id: i * CARDS_PER_SUIT + j,
        name: ((CARD_FACES_HASH[faceName].symbol as string) +
          CARD_SUITS_HASH[suitName].symbol) as string,
        suit: CARD_SUITS_HASH[suitName].symbol,
        face: CARD_FACES_HASH[faceName].symbol,
      };
    }),
  );
}, []);

export const CARDS_INDEX = CARDS.reduce((hash, card) => {
  hash[card.name] = card;
  return hash;
}, {});

const ALL_SIZES = ['small', 'medium'] as const;

// Requires all card images
// https://webpack.js.org/guides/dependency-management/#context-module-api
// const cardImages = {};
// function importAllImages(r) {
//   r.keys().forEach((key) => {
//     cardImages[
//       key.substr("./".length, key.length - "./".length - ".svg".length)
//     ] = r(key);
//   });
// }
// importAllImages(require.context("../images/cards", true, /\.svg$/));

const Card = ({
  suit,
  face,
  hidden,
  onClick,
  size = 'small',
}: {
  suit: CardSuit;
  face: CardFace;
  hidden: boolean;
  size: typeof ALL_SIZES[number];
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}): JSX.Element => {
  return (
    <div className={`root${hidden ? ' hidden' : ''}`}>
      <button onClick={onClick}>
        <span style={{ display: 'none' }}>{hidden ? 'hidden card' : name}</span>
      </button>
      <style jsx>{`
        .root {
        }
        .root button {
          display: block;
          appearance: none;
          height: var(
            ${size === 'small' ? '--smallCardHeight' : '--cardHeight'}
          );
          width: var(${size === 'small' ? '--smallCardWidth' : '--cardWidth'});
          border-radius: calc(
            var(${size === 'small' ? '--smallCardHeight' : '--cardHeight'}) *
              0.048
          );
          box-shadow: 1px 1px 2px #999;
          border-radius: var(--borderRadius);
          cursor: pointer;
          background-color: #000;
          background-size: contain;
          background-image: url('images/cards/${hidden
            ? 'back'
            : CARD_FACES_HASH[face].name +
              '_' +
              CARD_SUITS_HASH[suit].name}.svg');
        }
        .root span {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Card;
