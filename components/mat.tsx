import React from 'react';
import Trick from './trick';
import HandCards from './hand';
import type { ComponentProps } from 'react';
import type { CardItem } from './card';
import type { Hand } from './trick';

const Mat = ({
  trick,
  playerHand,
  partnerHand,
  leftOpponentHand,
  rightOpponentHand,
  onCardSelect,
  leader,
  hand,
}: {
  trick: ComponentProps<typeof Trick>['cards'];
  playerHand: ComponentProps<typeof HandCards>['cards'];
  partnerHand: ComponentProps<typeof HandCards>['cards'];
  leftOpponentHand: ComponentProps<typeof HandCards>['cards'];
  rightOpponentHand: ComponentProps<typeof HandCards>['cards'];
  leader: Hand;
  hand: Hand;
  onCardSelect: (card: CardItem) => void;
}): JSX.Element => {
  return (
    <div className={'root'}>
      <div className="game_partner">
        <HandCards
          cards={partnerHand}
          hidden={true}
          playing={hand === 'partnerHand'}
          position={'top'}
          size="small"
        />
      </div>
      <div className={'game_left_hand'}>
        <HandCards
          cards={leftOpponentHand}
          hidden={true}
          playing={hand === 'leftOpponentHand'}
          position={'left'}
          size="small"
        />
      </div>
      <div className="game_trick">
        <Trick cards={trick} leader={leader} />
      </div>
      <div className="game_right_hand">
        <HandCards
          cards={rightOpponentHand}
          hidden={true}
          playing={hand === 'rightOpponentHand'}
          position={'right'}
          size="small"
        />
      </div>
      <div className="game_user">
        <HandCards
          cards={playerHand}
          hidden={false}
          playing={hand === 'playerHand'}
          position={'bottom'}
          onCardSelect={onCardSelect}
          size="medium"
        />
      </div>
      <style jsx>{`
        .root {
          height: 100vh;
          padding: calc(var(--vRythm) * 3) calc(var(--gutter) * 3);
          display: grid;
          grid-template-rows: 25% 1fr 25%;
          grid-template-columns: 25% 1fr 25%;
        }
        .game_partner {
          grid-row: 1;
          grid-column: 2 / 4;
          margin: auto;
        }
        .game_user {
          grid-row: 3;
          grid-column: 1 / 3;
          margin: auto;
        }
        .game_trick {
          grid-row: 2;
          grid-column: 2;
          margin: auto;
        }
        .game_left_hand {
          grid-row: 1 / 3;
          grid-column: 1;
          margin: auto;
        }
        .game_right_hand {
          grid-row: 2 / 4;
          grid-column: 3;
          margin: auto;
        }
        @media screen and (max-width: 479px) {
          .root {
            padding: calc(var(--vRythm) * 2) calc(var(--gutter) / 2)
              var(--vRythm) calc(var(--gutter) / 2);
          }
        }
      `}</style>
    </div>
  );
};

export default Mat;
