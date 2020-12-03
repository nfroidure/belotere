import React, { ComponentProps } from 'react';
import Card from './card';
import type { CardItem } from './card';

const HORIZONTAL_POSITIONS = ['top', 'bottom'];
const ALL_POSITIONS = [...HORIZONTAL_POSITIONS, 'left', 'right'];

const Hand = ({
  cards,
  hidden,
  playing,
  position = 'bottom',
  size = 'small',
  onCardSelect,
}: {
  cards: CardItem[];
  hidden: boolean;
  playing: boolean;
  position: typeof ALL_POSITIONS[number];
  size: ComponentProps<typeof Card>['size'];
  onCardSelect?: (card: CardItem) => void;
}): JSX.Element => {
  return (
    <div className={`root ${position}${playing ? ' playing' : ''}`}>
      {cards.map((card) => {
        return (
          <div key={card.id} className="card">
            <Card
              suit={card.suit}
              face={card.face}
              hidden={!!hidden}
              size={size}
              onClick={onCardSelect ? () => onCardSelect(card) : undefined}
            />
          </div>
        );
      })}
      <style jsx>{`
        .root {
          display: grid;
          grid-template-rows: ${HORIZONTAL_POSITIONS.includes(position)
            ? `var(${size === 'small' ? '--smallCardHeight' : '--cardHeight'})`
            : `repeat(${cards.length - 1}, var(--vRythm)) var(${
                size === 'small' ? '--smallCardHeight' : '--cardHeight'
              })`};
          grid-template-columns: ${HORIZONTAL_POSITIONS.includes(position)
            ? `repeat(${cards.length - 1}, var(--gutter)) var(${
                size === 'small' ? '--smallCardWidth' : '--cardWidth'
              })`
            : `var(${size === 'small' ? '--smallCardWidth' : '--cardWidth'})`};
        }
        .root.playing {
          background: var(--lightBlur);
          box-shadow: var(--shadowX) var(--shadowY) var(--shadowBlur)
            var(--light);
        }
        .card {
          transition: all 0.2s;
          transform: rotate(0deg) translatex(0) translatey(0);
        }
        .bottom .card:hover {
          transform: rotate(-5deg) translatex(0) translatey(-1em);
        }
        .top .card:hover {
          transform: rotate(5deg) translatex(0) translatey(1em);
        }
        .left .card:hover {
          transform: rotate(0deg) translatex(1em) translatey(0);
        }
        .right .card:hover {
          transform: rotate(0deg) translatex(-1em) translatey(0);
        }
      `}</style>
    </div>
  );
};

export default Hand;
