import React, { useRef, useState } from 'react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import {
  NUM_PLAYERS,
  PLAYERS_PER_TEAM,
  PLAY_ORDER,
  getRelativeHand,
} from '../components/trick';
import Mat from '../components/mat';
import {
  CARDS,
  CARD_FACES_HASH,
  CARD_SUITS,
  CARD_SUITS_HASH,
} from '../components/card';
import type { CardItem, CardSuit } from '../components/card';
import type { Trick, Hand } from '../components/trick';

const APP_NAME = 'BeloteRE';
const BOT_SCORING_CEIL = 7;
const DEAL_DELAY = 200;
const BOT_DELAY = 1000;
const AWARENESS_DELAY = 2000;
const SECOND_DEAL_LENGTH = 3;
const NUM_TRICKS = 8;

type InitGame = {
  type: 'init';
  playersName: Record<Hand, string>;
  dealer: Hand;
  stack: CardItem[];
};
type Deal1 = {
  type: 'deal1';
  dealer: Hand;
  stack: CardItem[];
  playerHand: CardItem[];
  partnerHand: CardItem[];
  leftOpponentHand: CardItem[];
  rightOpponentHand: CardItem[];
} & Omit<InitGame, 'type' | 'stack'>;
type Bid1 = {
  type: 'bid1';
  bids: number;
  card: CardItem;
} & Omit<Deal1, 'type'>;
type Bid2 = {
  type: 'bid2';
} & Omit<Bid1, 'type'>;

type Deal2 = {
  type: 'deal2';
  taker: Hand;
  trump: CardSuit;
  card?: CardItem;
} & Omit<Deal1, 'type'>;

type RunningGame = {
  type: 'running';
  trick: Trick;
  taker: Hand;
  leader: Hand;
  endedTricks: {
    cards: Trick;
    leader: Hand;
    winner: Hand;
  }[];
} & Omit<Deal2, 'type'>;

type Score = {
  type: 'score';
  scores: Record<Hand | 'playerTeam' | 'opponentsTeam', number> & {
    beloteHand: Hand;
  };
} & Omit<RunningGame, 'type' | 'trick'>;

type GameState = InitGame | Deal1 | Bid1 | Bid2 | Deal2 | RunningGame | Score;

const otherPlayersName: Record<Exclude<Hand, 'playerHand'>, string> = {
  partnerHand: 'Partenaire',
  rightOpponentHand: 'Adversaire de droite',
  leftOpponentHand: 'Adversaire de gauche',
};

export default function Home(): JSX.Element {
  const nextTimeout = useRef(null);
  const [game, setGame] = useState<GameState>({
    type: 'init',
    playersName: {
      ...otherPlayersName,
      playerHand: '',
    },
    dealer: PLAY_ORDER[Math.floor(Math.random() * 4)],
    stack: nestCards(CARDS),
  });
  const [message, setMessage] = useState<string>('');
  const [waitingNextStep, setWaitingNextStep] = useState<boolean>(false);
  type FormData = {
    name: string;
  };
  const { register, handleSubmit, errors } = useForm<FormData>();

  return (
    <div className="root">
      <Head>
        <title></title>
        <link rel="icon" href="/favicon.ico" />
        {/* Primary Meta Tags */}
        <title>{APP_NAME}: 5mn pour une belote en solo</title>
        <meta name="title" content="BeloteRE: 5mn pour une belote en solo" />
        <meta
          name="description"
          content="Jouez partout à la belote sans connexion et sans autre distraction que le plaisir de jouer."
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://metatags.io/" />
        <meta
          property="og:title"
          content="BeloteRE: 5mn pour une belote en solo"
        />
        <meta
          property="og:description"
          content="Jouez partout à la belote sans connexion et sans autre distraction que le plaisir de jouer."
        />
        <meta property="og:image" content="/images/capture.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://metatags.io/" />
        <meta
          property="twitter:title"
          content="BeloteRE: 5mn pour une belote en solo"
        />
        <meta
          property="twitter:description"
          content="Jouez partout à la belote sans connexion et sans autre distraction que le plaisir de jouer."
        />
        <meta property="twitter:image" content="/images/capture.png" />
      </Head>
      <header>
        <h1>{APP_NAME}</h1>
        {game.type === 'deal1' ||
        game.type === 'deal2' ||
        game.type === 'bid1' ||
        game.type === 'bid2' ||
        game.type === 'score' ? (
          <p key="dealer" className="metric">
            Donneur
            <br />
            <span>{game.playersName[game.dealer]}</span>
          </p>
        ) : null}
        {game.type === 'running' ||
        game.type === 'deal2' ||
        game.type === 'score' ? (
          <p key="trump" className="metric">
            Atout
            <br />
            <span className="suit">{game.trump}</span>
          </p>
        ) : null}
        {game.type === 'running' ||
        game.type === 'deal2' ||
        game.type === 'score' ? (
          <p key="taker" className="metric">
            Preneur
            <br />
            <span>{game.playersName[game.taker]}</span>
          </p>
        ) : null}
        {game.type === 'running' ? (
          <p key="leader" className="metric">
            Meneur
            <br />
            <span>{game.playersName[game.leader]}</span>
          </p>
        ) : null}
      </header>
      <div className={`notice${message ? ' active' : ''}`}>{message}</div>
      <div className={`popup${waitingNextStep ? ' active' : ''}`}>
        En pause
        <br />{' '}
        <button
          onClick={() => waitingNextStep && runNextStep()}
          autoFocus={true}
        >
          Continuer
        </button>
      </div>
      <main>
        {game.type === 'init' && !game.playersName.playerHand ? (
          <div className="popup active">
            <h2>Bienvenue</h2>
            <p>
              Pour commencer une nouvelle partie, entrez votre prenom ou surnom.
            </p>
            <form
              onSubmit={handleSubmit((data) => {
                setGame((game) => {
                  if (game.type === 'init') {
                    return {
                      ...game,
                      type: 'init',
                      playersName: {
                        ...game.playersName,
                        playerHand: data.name,
                      },
                    };
                  }
                  return game;
                });
                setMessage(`${data.name} démarre une partie !`);
                setGame(runGame);
              })}
            >
              <p>
                <label>
                  Nom{errors?.name ? ' (requis)' : ''} :<br />
                  <input
                    type="text"
                    name="name"
                    id="win'+w.id-name"
                    placeholder="John"
                    defaultValue={game.playersName['playerHand']}
                    ref={register({ required: true })}
                  />
                </label>
              </p>
              <p>
                <input type="submit" value="Commencer une partie" />
              </p>
            </form>
          </div>
        ) : null}
        {game.type !== 'init' ? (
          <Mat
            trick={
              game.type === 'running'
                ? game.trick
                : game.type === 'bid1' || game.type === 'bid2'
                ? [game.card]
                : game.type === 'deal2'
                ? game.card
                  ? [game.card]
                  : []
                : []
            }
            playerHand={game.playerHand}
            partnerHand={game.partnerHand}
            leftOpponentHand={game.leftOpponentHand}
            rightOpponentHand={game.rightOpponentHand}
            leader={game.type === 'running' ? game.leader : game.dealer}
            hand={
              game.type === 'running'
                ? getRelativeHand(game.leader, game.trick.length)
                : game.dealer
            }
            onCardSelect={(card) => {
              // TODO: Debounce this event
              setGame(
                (game): GameState => {
                  if (
                    game.type === 'running' &&
                    game.trick.length < NUM_PLAYERS &&
                    getRelativeHand(game.leader, game.trick.length) ===
                      'playerHand'
                  ) {
                    const errorMessage = cardPlayErrorMessage(
                      game,
                      'playerHand',
                      card,
                    );

                    if (errorMessage) {
                      setMessage(errorMessage);
                      return game;
                    }

                    waitNextStep(BOT_DELAY);
                    return {
                      ...game,
                      trick: game.trick.concat(card) as Trick,
                      playerHand: sortCards(
                        game.playerHand.filter((aCard) => aCard !== card),
                        [game.trump],
                      ),
                    };
                  }
                  return game;
                },
              );
            }}
          />
        ) : null}
        {game.type === 'bid1' &&
        game.bids < 4 &&
        getRelativeHand(game.dealer, game.bids + 1) === 'playerHand' ? (
          <div className="popup active">
            <h2>1er tour</h2>
            <p>Souhaitez-vous prendre en {game.card.suit} ?</p>
            <p>
              <button
                onClick={() => {
                  setGame(
                    (game): GameState => {
                      if (game.type === 'bid1') {
                        waitNextStep(AWARENESS_DELAY);
                        setMessage(`Vous prenez en ${game.card.suit} !`);
                        return {
                          ...game,
                          type: 'deal2',
                          taker: 'playerHand',
                          trump: game.card.suit,
                        };
                      }
                      return game;
                    },
                  );
                }}
              >
                Oui
              </button>{' '}
              <button
                onClick={() => {
                  setGame(
                    (game): GameState => {
                      if (game.type === 'bid1') {
                        waitNextStep(BOT_DELAY);
                        setMessage(`Vous passez votre tour.`);
                        return {
                          ...game,
                          type: 'bid1',
                          bids: game.bids + 1,
                        };
                      }
                      return game;
                    },
                  );
                }}
              >
                Non
              </button>
            </p>
          </div>
        ) : null}

        {game.type === 'bid2' &&
        game.bids < 4 &&
        getRelativeHand(game.dealer, game.bids + 1) === 'playerHand' ? (
          <div className="popup active">
            <h2>2nd tour</h2>
            <p>Souhaitez-vous prendre ?</p>
            <p>
              {CARD_SUITS.filter((suit) => suit !== game.card.suit).map(
                (suit) => [
                  <button
                    key={suit}
                    onClick={() => {
                      setGame(
                        (game): GameState => {
                          if (game.type === 'bid2') {
                            waitNextStep(AWARENESS_DELAY);
                            setMessage(`Vous prenez en ${suit} !`);
                            return {
                              ...game,
                              type: 'deal2',
                              taker: 'playerHand',
                              trump: suit,
                            };
                          }
                          return game;
                        },
                      );
                    }}
                  >
                    {suit}
                  </button>,
                  ' ',
                ],
              )}
              <button
                onClick={() => {
                  setGame(
                    (game): GameState => {
                      if (game.type === 'bid2') {
                        waitNextStep(BOT_DELAY);
                        setMessage(`Vous passez votre tour.`);
                        return {
                          ...game,
                          type: 'bid2',
                          bids: game.bids + 1,
                        };
                      }
                      return game;
                    },
                  );
                }}
              >
                Non
              </button>
            </p>
          </div>
        ) : null}
        {game.type === 'score' ? (
          <div className="popup active">
            <h2>Score</h2>
            <h3>Votre équipe - {game.scores.playerTeam} points</h3>
            <p>
              {game.playersName.playerHand} : {game.scores.playerHand}
              {game.scores.beloteHand === 'playerHand' ? ' + 20' : ''} points
              <br />
              {game.playersName.partnerHand} : {game.scores.partnerHand}
              {game.scores.beloteHand === 'partnerHand' ? ' + 20' : ''} points
            </p>
            <h3>Adversaires - {game.scores.opponentsTeam} points</h3>
            <p>
              {game.playersName.leftOpponentHand} :{' '}
              {game.scores.leftOpponentHand}
              {game.scores.beloteHand === 'leftOpponentHand'
                ? ' + 20'
                : ''}{' '}
              points
              <br />
              {game.playersName.rightOpponentHand} :{' '}
              {game.scores.rightOpponentHand}
              {game.scores.beloteHand === 'rightOpponentHand'
                ? ' + 20'
                : ''}{' '}
              points
            </p>
            <p>
              <button
                onClick={() => {
                  setGame(
                    (game): GameState => {
                      if (game.type === 'score') {
                        waitNextStep(BOT_DELAY);
                        return {
                          type: 'init',
                          playersName: game.playersName,
                          dealer: getRelativeHand(game.dealer, 1),
                          stack: game.endedTricks.reduce(
                            (newStack, trick) => [...newStack, ...trick.cards],
                            [],
                          ),
                        };
                      }
                      return game;
                    },
                  );
                }}
              >
                Rejouer
              </button>
            </p>
          </div>
        ) : null}
      </main>
      <footer>
        Fait avec amour par{' '}
        <a
          href="https://insertafter.com?utm_source=belote&utm_medium=footer&utm_campaign=pocs"
          target="_blank"
          rel="noopener noreferrer"
        >
          Nicolas Froidure
        </a>{' '}
        -{' '}
        <a
          href="https://github.com/nfroidure/belotere"
          target="_blank"
          rel="noopener noreferrer"
        >
          Code source
        </a>
      </footer>
      <style jsx>{`
        .root {
          height: 100vh;
          background-color: green;
          background-image: linear-gradient(
            bottom,
            rgb(73, 118, 41) 29%,
            rgb(103, 154, 70) 65%,
            rgb(134, 185, 98) 83%
          );
        }
        header {
          position: absolute;
          top: 0;
          width: 100vw;
          display: flex;
          background: var(--dark);
          font-size: var(--greatFontSize);
          line-height: var(--greatLineHeight);
        }
        header h1 {
          font-size: var(--greatFontSize);
          line-height: var(--greatLineHeight);
          padding: 0 var(--gutter);
          flex-grow: 1;
          font-weight: bold;
        }
        header .metric {
          padding: 0 var(--gutter);
          border-left: var(--border) solid var(--grey);
          text-align: center;
        }
        header .metric span {
          padding: 0 var(--gutter);
          text-align: center;
          color: var(--light);
          font-size: var(--smallFontSize);
        }
        header .metric span.suit {
          font-size: var(--greatFontSize);
        }
        header,
        footer {
          color: #ffcc00;
          text-shadow: 2px 2px 8px #000, 1px 1px 0 #ff3300, -1px -1px 0 #ffff00;
          font-family: Arial black, sans-serif;
          text-shadow: 2px 2px 8px #000;
        }
        footer {
          position: absolute;
          bottom: 0;
          width: 100vw;
          padding: var(--vRythm) var(--gutter);
          text-align: right;
          font-size: var(--smallFontSize);
        }
        footer a,
        footer a:visited,
        footer a:hover {
          color: var(--light);
          font-size: var(--smallFontSize);
        }
        .popup,
        .notice {
          position: absolute;
          width: calc(var(--block) * 2 + var(--gutter));
          background: rgba(0, 0, 0, 0.5);
          display: none;
          padding: var(--vRythm) var(--gutter);
          color: #ddd;
          text-shadow: 2px 2px 8px #000, 1px 1px 0 #000, -1px -1px 0 #ccc;
          font-weight: bold;
          border-radius: var(--borderRadius);
          text-align: center;
          z-index: 10;
        }
        .popup.active {
          display: block;
          position: absolute;
          margin-left: auto;
          margin-right: auto;
          left: 0;
          right: 0;
          text-align: center;
          top: calc(var(--vRythm) * 4);
          max-width: calc(100vw - calc(var(--gutter) * 2));
        }
        .notice.active {
          display: block;
          display: block;
          position: absolute;
          margin-left: auto;
          margin-right: auto;
          left: 0;
          right: 0;
          text-align: center;
          bottom: var(--vRythm);
          max-width: calc(100vw - calc(var(--gutter) * 2));
        }
        .popup.active h2 {
          line-height: calc(var(--vRythm) * 2);
          font-size: var(--bigFontSize);
          text-shadow: 2px 2px 8px #000;
          color: #ffcc00;
          text-shadow: 2px 2px 8px #000, 1px 1px 0 #ff3300, -1px -1px 0 #ffff00;
          text-align: center;
          margin: 0 0 var(--vRythm) 0;
          font-weight: bold;
          font-family: Arial black, sans-serif;
        }
        .popup.active h3 {
          line-height: calc(var(--vRythm) * 2);
          font-size: var(--bigFontSize);
        }
        .popup.active p,
        .popup.active ul {
          margin: 0 0 var(--vRythm) 0;
        }
        .popup.active label {
          color: #ffcc00;
          text-shadow: 2px 2px 8px #000, 1px 1px 0 #ff3300, -1px -1px 0 #ffff00;
          line-height: var(--vRythm);
          font-size: var(--bigFontSize);
        }
        .popup.active input[type='text'] {
          padding: 0 var(--gutter);
          margin: 0;
          line-height: var(--vRythm);
          border: 0;
          border-radius: var(--borderRadius);
          box-shadow: 1px 1px 1px #000;
          max-width: 100%;
        }
        .popup.active input[type='submit'],
        .popup.active button {
          padding: 0 var(--gutter);
          line-height: var(--vRythm);
          height: var(--vRythm);
          border: 0;
          border-radius: var(--borderRadius);
          box-shadow: 1px 1px 1px #000, 1px 1px 0 #ff3300, -1px -1px 0 #ffff00;
          font-weight: bold;
          color: #ffcc00;
          text-shadow: 2px 2px 15px #ff3300, 1px 1px 0 #ff3300,
            -1px -1px 0 #ffff00;
          background: #ffdd00;
          max-width: 100%;
        }
        @media screen and (max-width: 479px) {
          header h1 {
            font-size: var(--bigFontSize);
            padding: 0 calc(var(--gutter) / 2);
          }
          header .metric {
            padding: 0 calc(var(--gutter) / 2);
            font-size: var(--smallFontSize);
          }
          header .metric span {
            padding: 0 calc(var(--gutter) / 2);
            font-size: calc(var(--smallFontSize) * 0.8);
          }
          footer {
            padding: calc(var(--vRytm) / 2) calc(var(--gutter) / 2);
          }
        }
      `}</style>
    </div>
  );

  function waitNextStep(delay: number) {
    setWaitingNextStep(true);
    if (nextTimeout.current) {
      clearInterval(nextTimeout.current);
    }
    nextTimeout.current = setTimeout(() => {
      nextTimeout.current = null;
      runNextStep();
    }, delay);
  }
  function runNextStep() {
    setWaitingNextStep((state: boolean) => {
      if (state) {
        setMessage('');
        setGame(runGame);
      }
      return false;
    });
  }

  function runGame(game: GameState): GameState {
    if (game.type === 'init') {
      waitNextStep(BOT_DELAY);

      setMessage(`${game.playersName[game.dealer]} distribue !`);

      return {
        ...game,
        type: 'deal1',
        stack: game.stack,
        playerHand: [],
        partnerHand: [],
        leftOpponentHand: [],
        rightOpponentHand: [],
      };
    }

    if (game.type === 'deal1') {
      const firstDealEnded =
        game.stack.length <= NUM_PLAYERS * SECOND_DEAL_LENGTH;
      if (firstDealEnded) {
        waitNextStep(AWARENESS_DELAY);
        const card = game.stack.pop();

        setMessage(
          `${game.playersName[game.dealer]} retourne ${
            card.name
          }. Premier tour d'enchères !`,
        );

        return {
          ...game,
          type: 'bid1',
          bids: 0,
          card,
          stack: [...game.stack],
          playerHand: sortCards(game.playerHand, [card.suit]),
          partnerHand: sortCards(game.partnerHand, [card.suit]),
          leftOpponentHand: sortCards(game.leftOpponentHand, [card.suit]),
          rightOpponentHand: sortCards(game.rightOpponentHand, [card.suit]),
        };
      }
      waitNextStep(DEAL_DELAY);

      const destinationHand = getDestinationHand(
        game.dealer,
        game.stack.length,
      );
      const card = game.stack.pop();

      return {
        ...game,
        stack: [...game.stack],
        [destinationHand]: sortCards(
          [...game[destinationHand], card],
          CARD_SUITS,
        ),
      };
    }
    if (game.type === 'bid1') {
      if (game.bids >= NUM_PLAYERS) {
        waitNextStep(BOT_DELAY);
        return {
          ...game,
          type: 'bid2',
          bids: 0,
          playerHand: sortCards(game.playerHand, CARD_SUITS),
          partnerHand: sortCards(game.partnerHand, CARD_SUITS),
          leftOpponentHand: sortCards(game.leftOpponentHand, CARD_SUITS),
          rightOpponentHand: sortCards(game.rightOpponentHand, CARD_SUITS),
        };
      }
      const nextBidder = getRelativeHand(game.dealer, game.bids + 1);
      const cardReceiver = getRelativeHand(game.dealer, 1);
      const nextBidderIsHuman = 'playerHand' === nextBidder;
      if (nextBidderIsHuman) {
        console.log(nextBidder, {
          handScoring: getHandScoring(
            [
              ...game[nextBidder],
              ...(nextBidder === cardReceiver ? [game.card] : []),
            ],
            game.card.suit,
          ),
        });
        setMessage(`${game.playersName[nextBidder]} parie !`);
        return game;
      }

      const handScoring = getHandScoring(
        [
          ...game[nextBidder],
          ...(nextBidder === cardReceiver ? [game.card] : []),
        ],
        game.card.suit,
      );
      const riskLevel = Math.floor(Math.random() * 3) + 1;
      const totalScore = handScoring.reduce(
        (total, { score }) => total + score,
        0,
      );

      console.log(nextBidder, { handScoring, riskLevel });

      if (totalScore > BOT_SCORING_CEIL - riskLevel) {
        waitNextStep(AWARENESS_DELAY);

        setMessage(
          `${game.playersName[nextBidder]} prend en ${game.card.suit} !`,
        );
        return {
          ...game,
          type: 'deal2',
          taker: nextBidder,
          trump: game.card.suit,
        };
      }

      waitNextStep(BOT_DELAY);
      setMessage(`${game.playersName[nextBidder]} passe !`);
      return { ...game, bids: game.bids + 1 };
    }
    if (game.type === 'bid2') {
      if (game.bids === NUM_PLAYERS) {
        waitNextStep(BOT_DELAY);
        return {
          type: 'init',
          playersName: game.playersName,
          dealer: getRelativeHand(game.dealer, 1),
          stack: nestCards(CARDS),
        };
      }

      const nextBidder = getRelativeHand(game.dealer, game.bids + 1);
      const cardReceiver = getRelativeHand(game.dealer, 1);
      const nextBidderIsHuman = 'playerHand' === nextBidder;
      if (nextBidderIsHuman) {
        console.log(nextBidder, {
          handScoring: getHandScoring(
            [
              ...game[nextBidder],
              ...(nextBidder === cardReceiver ? [game.card] : []),
            ],
            game.card.suit,
          ),
        });
        setMessage(`${game.playersName[nextBidder]} parie !`);
        return game;
      }

      const handScorings = CARD_SUITS.filter(
        (suit) => suit !== game.card.suit,
      ).map((suit) => {
        const handScoring = getHandScoring(
          [...game[nextBidder], game.card],
          suit,
        );

        const totalScore = handScoring.reduce(
          (total, { score }) => total + score,
          0,
        );

        return {
          suit,
          handScoring,
          totalScore,
        };
      });
      const bestHandScoring = handScorings.find((handScoring) => {
        return handScorings.every(
          (aHandScoring) =>
            handScoring === aHandScoring ||
            handScoring.totalScore >= aHandScoring.totalScore,
        );
      });
      const riskLevel = Math.floor(Math.random() * 3);

      console.log(nextBidder, { handScorings, riskLevel, bestHandScoring });

      if (bestHandScoring.totalScore > BOT_SCORING_CEIL - riskLevel) {
        waitNextStep(AWARENESS_DELAY);
        setMessage(
          `${game.playersName[nextBidder]} prend en ${bestHandScoring.suit} !`,
        );
        return {
          ...game,
          type: 'deal2',
          taker: nextBidder,
          trump: bestHandScoring.suit,
          playerHand: sortCards(game.playerHand, [bestHandScoring.suit]),
          partnerHand: sortCards(game.partnerHand, [bestHandScoring.suit]),
          leftOpponentHand: sortCards(game.leftOpponentHand, [
            bestHandScoring.suit,
          ]),
          rightOpponentHand: sortCards(game.rightOpponentHand, [
            bestHandScoring.suit,
          ]),
        };
      }
      waitNextStep(BOT_DELAY);

      setMessage(`${game.playersName[nextBidder]} passe !`);
      return { ...game, bids: game.bids + 1 };
    }
    if (game.type === 'deal2') {
      const stackIsEmpty = !game.stack.length;

      if (stackIsEmpty) {
        waitNextStep(BOT_DELAY);

        return {
          ...game,
          type: 'running',
          leader: getRelativeHand(game.dealer, 1),
          trick: [],
          endedTricks: [],
        };
      }

      waitNextStep(DEAL_DELAY);

      const destinationHand = getDestinationHand(
        game.dealer,
        game.stack.length + (game.card ? 1 : 0),
      );
      let card;

      if (destinationHand === game.taker && game.card) {
        card = game.card;
        delete game.card;
      } else {
        card = game.stack.pop();
      }

      return {
        ...game,
        card: game.card,
        stack: [...game.stack],
        [destinationHand]: sortCards(
          [...game[destinationHand], card],
          CARD_SUITS,
        ),
      };
    }
    if (game.type === 'running') {
      if (game.endedTricks.length === NUM_TRICKS) {
        const newGame = {
          ...game,
          type: 'score' as const,
          scores: {
            playerHand: computeHandScore(game, 'playerHand'),
            partnerHand: computeHandScore(game, 'partnerHand'),
            leftOpponentHand: computeHandScore(game, 'leftOpponentHand'),
            rightOpponentHand: computeHandScore(game, 'rightOpponentHand'),
            playerTeam: 0,
            opponentsTeam: 0,
            beloteHand: PLAY_ORDER.find((hand) =>
              game.endedTricks.every((trick) =>
                trick.cards
                  .filter(
                    (trickCard) =>
                      trickCard.suit === game.trump &&
                      ['K', 'Q'].includes(trickCard.face),
                  )
                  .every(
                    (trickCard) =>
                      getRelativeHand(
                        trick.leader,
                        trick.cards.indexOf(trickCard),
                      ) === hand,
                  ),
              ),
            ),
          },
        };

        if (newGame.scores.playerHand + newGame.scores.partnerHand === 162) {
          newGame.scores.playerTeam = 252;
          newGame.scores.opponentsTeam = 0;
        } else if (
          newGame.scores.leftOpponentHand + newGame.scores.rightOpponentHand ===
          162
        ) {
          newGame.scores.opponentsTeam = 252;
          newGame.scores.playerTeam = 0;
        } else {
          newGame.scores.playerTeam =
            newGame.scores.playerHand + newGame.scores.partnerHand;
          newGame.scores.opponentsTeam =
            newGame.scores.leftOpponentHand + newGame.scores.rightOpponentHand;

          if (['playerHand', 'partnerHand'].includes(game.taker)) {
            if (newGame.scores.playerTeam < 81) {
              newGame.scores.playerTeam = 0;
              newGame.scores.opponentsTeam = 162;
            }
          } else {
            if (newGame.scores.opponentsTeam < 81) {
              newGame.scores.opponentsTeam = 0;
              newGame.scores.playerTeam = 162;
            }
          }
        }

        if (newGame.scores.beloteHand) {
          if (
            ['playerHand', 'partnerHand'].includes(newGame.scores.beloteHand)
          ) {
            newGame.scores.playerTeam += 20;
          } else {
            newGame.scores.opponentsTeam += 20;
          }
        }
        console.log('scores', { newGame });
        return newGame;
      }

      if (game.trick.length === NUM_PLAYERS) {
        const highestCard = getHighestTrickCard(game.trick, game.trump);
        const winner = getRelativeHand(
          game.leader,
          game.trick.indexOf(highestCard),
        );

        waitNextStep(AWARENESS_DELAY);

        setMessage(`${game.playersName[winner]} remporte le pli !`);

        return {
          ...game,
          trick: [],
          leader: winner,
          endedTricks: [
            ...game.endedTricks,
            { leader: game.leader, winner, cards: game.trick },
          ],
        };
      }

      const playingHand = getRelativeHand(game.leader, game.trick.length);
      const playOptions = getPlayOptions(game, playingHand);
      const bestPlayOption = playOptions
        .filter(
          (playOption) =>
            !cardPlayErrorMessage(game, playingHand, playOption.card),
        )
        .find((playOption) =>
          playOptions.every(
            (anotherPlayOption) =>
              anotherPlayOption === playOption ||
              playOption.score >= anotherPlayOption.score,
          ),
        );
      const card =
        bestPlayOption?.card ||
        game[playingHand].find(
          (handCard) => !cardPlayErrorMessage(game, playingHand, handCard),
        );
      if (!card) {
        console.error(
          playingHand,
          game[playingHand].map((handCard) =>
            cardPlayErrorMessage(game, playingHand, handCard),
          ),
        );
      }
      const errorMessage = cardPlayErrorMessage(game, playingHand, card);

      console.log(playingHand, { playOptions, card, bestPlayOption });
      if (errorMessage) {
        console.error(playingHand, errorMessage);
      }
      if (!bestPlayOption?.card) {
        console.error(playingHand, 'No play option.');
      }
      if (playingHand === 'playerHand') {
        return game;
      }

      waitNextStep(game.trick.length == 3 ? AWARENESS_DELAY : BOT_DELAY);

      return {
        ...game,
        trick: game.trick.concat(card) as Trick,
        [playingHand]: game[playingHand].filter((aCard) => aCard !== card),
      };
    }
    return game;
  }

  type HandScoringLine = { message: string; score: number; cards: CardItem[] };

  function getHandScoring(
    handCards: CardItem[],
    trumpSuit: CardSuit,
  ): HandScoringLine[] {
    const handScoring: HandScoringLine[] = [];
    const beloteCards: CardItem[] = [];
    const trumpCards: CardItem[] = [];

    for (const card of handCards) {
      if (card.suit === trumpSuit) {
        if (card.face === 'J') {
          handScoring.push({
            message: `Si je prend en ${trumpSuit}, j'ai le valet en atout`,
            score: 4,
            cards: [card],
          });
        } else if (card.face === '9') {
          handScoring.push({
            message: `Si je prend en ${trumpSuit}, j'ai le 9 en atout`,
            score: 3,
            cards: [card],
          });
        } else if (card.face === 'A') {
          handScoring.push({
            message: `Si je prend en ${trumpSuit}, j'ai le ${card.face} en atout`,
            score: trumpCards.length > 2 ? 3 : 2,
            cards: [card],
          });
        } else if (card.face === 'K' || card.face === 'Q') {
          beloteCards.push(card);
          trumpCards.push(card);
        } else {
          trumpCards.push(card);
        }
      } else if (card.face === 'A') {
        handScoring.push({
          message: `J'ai un as de ${card.suit}.`,
          score: 2,
          cards: beloteCards,
        });
      } else if (card.face === '10') {
        const otherCards: CardItem[] = [];
        for (const otherCard of handCards) {
          if (card !== otherCard && card.suit === otherCard.suit) {
            otherCards.push(card);
            continue;
          }
        }
        if (!otherCards.length) {
          continue;
        }
        handScoring.push({
          message: `J'ai un 10 de ${card.suit} avec ${otherCards.length} de sécurité.`,
          score: 1,
          cards: [card, ...otherCards],
        });
      }
    }
    if (trumpCards.length) {
      handScoring.push({
        message: `Si je prend en ${trumpSuit}, j'ai ${trumpCards.length} atouts complémentaires.`,
        score: trumpCards.length,
        cards: beloteCards,
      });
    }
    if (beloteCards.length === 2) {
      handScoring.push({
        message: `Si je prend en ${trumpSuit}, j'ai la belote et re.`,
        score: 1,
        cards: beloteCards,
      });
    }
    return handScoring;
  }
  function getDestinationHand(dealer: Hand, stackLength): Hand {
    return PLAY_ORDER[
      (PLAY_ORDER.indexOf(dealer) + 1 - (stackLength % 4) + NUM_PLAYERS) %
        NUM_PLAYERS
    ];
  }
}

function sortCards(cards: CardItem[], trumps: readonly CardSuit[]): CardItem[] {
  const sortedSuits = sortSuits(
    cards.reduce((allSuits, card) => {
      if (allSuits.includes(card.suit)) {
        return allSuits;
      }
      return allSuits.concat(card.suit);
    }, []),
  );

  return cards.sort(cardSorter);

  function cardSorter(cardA: CardItem, cardB: CardItem): number {
    const cardASuitIndex = sortedSuits.indexOf(cardA.suit);
    const cardBSuitIndex = sortedSuits.indexOf(cardB.suit);

    if (cardASuitIndex < cardBSuitIndex) {
      return -1;
    }
    if (cardASuitIndex > cardBSuitIndex) {
      return 1;
    }

    if (trumps.includes(cardA.suit)) {
      if (
        CARD_FACES_HASH[cardA.face].trumpRank <
        CARD_FACES_HASH[cardB.face].trumpRank
      ) {
        return -1;
      }
      return 1;
    }
    if (
      CARD_FACES_HASH[cardA.face].suitRank <
      CARD_FACES_HASH[cardB.face].suitRank
    ) {
      return -1;
    }

    return 1;
  }
}

function getPartnerHand(hand: Hand): Hand {
  return PLAY_ORDER[
    (PLAY_ORDER.indexOf(hand) + PLAYERS_PER_TEAM) % NUM_PLAYERS
  ];
}

type ThinkItem = { sentence: string; card?: CardItem; score?: number };

function getPlayThoughts(game: RunningGame, hand: Hand): ThinkItem[] {
  const partnerHand = getPartnerHand(hand);
  const thinkLog: ThinkItem[] = [];
  const trickTrumps = sortCards(
    game.trick.filter((card) => card.suit === game.trump),
    [game.trump],
  );
  const trickHasTrump = !!trickTrumps.length;
  const lowestValueCard = game[hand].reduce(
    (lowestCard, card) =>
      CARD_FACES_HASH[lowestCard.face].suitValue <
      CARD_FACES_HASH[card.face].suitValue
        ? lowestCard
        : card,
    game[hand][0],
  );
  const otherHandsLeft = CARD_SUITS.reduce(
    (allHands, suit) => ({
      ...allHands,
      [suit]: sortCards(
        PLAY_ORDER.filter((aHand) => aHand !== hand).reduce(
          (cards, hand) => [
            ...cards,
            ...game[hand].filter((card) => card.suit === suit),
          ],
          [],
        ),
        [game.trump],
      ),
    }),
    {},
  ) as Record<CardSuit, CardItem[]>;
  const allHandsLeft = CARD_SUITS.reduce(
    (allHands, suit) => ({
      ...allHands,
      [suit]: sortCards(
        PLAY_ORDER.reduce(
          (cards, hand) => [
            ...cards,
            ...game[hand].filter((card) => card.suit === suit),
          ],
          [],
        ),
        [game.trump],
      ),
    }),
    {},
  ) as Record<CardSuit, CardItem[]>;
  const handLeftTrumps = sortCards(
    game[hand].filter((card) => card.suit === game.trump),
    [game.trump],
  );
  const handLowerTrumps = trickHasTrump
    ? handLeftTrumps.filter(
        (card) =>
          CARD_FACES_HASH[card.face].trumpRank <
          CARD_FACES_HASH[trickTrumps[trickTrumps.length - 1].face].trumpRank,
      )
    : [];
  const handHigherTrumps = trickHasTrump
    ? handLeftTrumps.filter(
        (card) =>
          CARD_FACES_HASH[card.face].trumpRank >
          CARD_FACES_HASH[trickTrumps[trickTrumps.length - 1].face].trumpRank,
      )
    : handLeftTrumps;

  thinkLog.push({
    sentence: `I have ${handLeftTrumps.length} trumps on ${
      allHandsLeft[game.trump].length
    } left trumps`,
  });

  if (!game.trick.length) {
    thinkLog.push({
      sentence:
        "No cards in the trick, I'm the leader. Let's review all my cards.",
    });

    for (const card of game[hand]) {
      if (card.suit === game.trump) {
        thinkLog.push({
          sentence: 'The card is a trump.',
          card,
          score: 0,
        });

        if (otherHandsLeft[game.trump].length === 0) {
          thinkLog.push({
            sentence: "I'm the last to have trumps.",
            card,
            score: -1,
          });
          continue;
        }

        const cardIsHigherThanOthersTrumps = otherHandsLeft[game.trump].length
          ? CARD_FACES_HASH[card.face].trumpRank >
            CARD_FACES_HASH[
              otherHandsLeft[game.trump][otherHandsLeft[game.trump].length - 1]
                .face
            ].trumpRank
          : true;

        if (cardIsHigherThanOthersTrumps) {
          thinkLog.push({
            sentence: 'The card is higher than others trumps.',
            card,
            score: 5,
          });

          if (
            (partnerHand === game.taker || game.taker === hand) &&
            allHandsLeft[game.trump].length >= 6
          ) {
            thinkLog.push({
              sentence:
                "I'm in the taker team and there is a lot of trumps left in the game.",
              card,
              score: 3,
            });
          }

          if (allHandsLeft[game.trump].length / 2 < handLeftTrumps.length) {
            thinkLog.push({
              sentence:
                'I probably have enought trumps to be the last to have some.',
              card,
              score: 2,
            });
          }
          continue;
        }

        const haveTheNextHigherTrump =
          allHandsLeft[game.trump].length > 2 &&
          game[hand].includes(
            allHandsLeft[game.trump][allHandsLeft[game.trump].length - 2],
          );

        if (partnerHand === game.taker) {
          thinkLog.push({
            sentence: "I'm in the taker team.",
            card,
            score: 0,
          });

          if (haveTheNextHigherTrump) {
            thinkLog.push({
              sentence: 'I have the next higher trump.',
              card,
              score: 2,
            });
          }

          if (CARD_FACES_HASH[card.face].trumpRank === 0) {
            thinkLog.push({
              sentence: 'The card is a null trump.',
              card,
              score: 2,
            });
          } else if (CARD_FACES_HASH[card.face].trumpRank <= 3) {
            thinkLog.push({
              sentence: 'The card is a low trump.',
              card,
              score: 1,
            });
          }

          if (allHandsLeft[game.trump].length >= 6) {
            thinkLog.push({
              sentence: 'There are lot of trumps left.',
              card,
              score: 4,
            });
          }
          continue;
        }

        if (haveTheNextHigherTrump) {
          thinkLog.push({
            sentence: 'I have the next higher trump.',
            card,
            score: 1,
          });
        }

        if (CARD_FACES_HASH[card.face].trumpRank <= 3) {
          thinkLog.push({
            sentence:
              "I've a low trump, I can try to know what my partner want me to play.",
            card,
            score: 1,
          });
        }
        continue;
      } else {
        thinkLog.push({
          sentence: 'The card is not a trump.',
          card,
          score: 0,
        });

        const highest =
          otherHandsLeft[card.suit].every(
            (aSuitCard) =>
              CARD_FACES_HASH[card.face].suitRank >
              CARD_FACES_HASH[aSuitCard.face].suitRank,
          ) &&
          game[hand].every(
            (aSuitCard) =>
              aSuitCard === card ||
              aSuitCard.suit !== card.suit ||
              CARD_FACES_HASH[card.face].suitRank >
                CARD_FACES_HASH[aSuitCard.face].suitRank,
          );

        if (highest) {
          thinkLog.push({
            sentence: 'The card is the highest left of his suit.',
            card,
            score: 5,
          });
          if (otherHandsLeft[game.trump].length === 0) {
            thinkLog.push({
              sentence: 'There are no more trumps.',
              card,
              score: 4,
            });
          } else {
            if (otherHandsLeft[game.trump].length < 3) {
              thinkLog.push({
                sentence: 'Only a few trumps left.',
                card,
                score: 3 - otherHandsLeft[game.trump].length,
              });
            }
            if (game.stack.length < 4 * NUM_PLAYERS) {
              thinkLog.push({
                sentence: 'There are still a half of the tricks to play.',
                card,
                score: 1,
              });
            }
            if (otherHandsLeft[card.suit].length > 5) {
              thinkLog.push({
                sentence: 'There are a lot of cards of the same suit left.',
                card,
                score: 1,
              });
            }
          }
          if (otherHandsLeft[card.suit].length === 7) {
            thinkLog.push({
              sentence: 'The suit has not been played yet.',
              card,
              score: 1,
            });
          }
        } else if (
          allHandsLeft[card.suit].length >= 6 &&
          CARD_FACES_HASH[card.face].suitValue <= 3
        ) {
          thinkLog.push({
            sentence:
              'The suit of this card has not been played so much yet and the card is low.',
            card,
            score: 0,
          });
          if (allHandsLeft[card.suit].length === 8) {
            thinkLog.push({
              sentence: 'The suit of this card has not been played at all.',
              card,
              score: 1,
            });
          }
          if (CARD_FACES_HASH[card.face].suitValue === 0) {
            thinkLog.push({
              sentence: 'The card has no value.',
              card,
              score: 1,
            });
          }

          const handHighest = sortCards(
            game[hand].filter(
              (aCard) => aCard !== card && aCard.suit === card.suit,
            ),
            [game.trump],
          ).pop();
          const othersSecondHighest =
            otherHandsLeft[card.suit].length >= 2
              ? otherHandsLeft[card.suit][otherHandsLeft[card.suit].length - 2]
              : undefined;
          const isGameNextHighest =
            handHighest &&
            othersSecondHighest &&
            CARD_FACES_HASH[handHighest.face].suitValue >
              CARD_FACES_HASH[othersSecondHighest.face].suitValue;

          if (isGameNextHighest) {
            thinkLog.push({
              sentence:
                'I have the next highest card, I can try to let fall the highest.',
              card,
              score: 2,
            });
          }
        }
      }
    }
    return thinkLog;
  }

  const askedSuitCards = game[hand].filter(
    (card) => card.suit === game.trick[0].suit,
  );

  if (askedSuitCards.length === 1) {
    thinkLog.push({
      sentence: 'I have only one card of the asked suit, I have to play her.',
      card: askedSuitCards[0],
      score: 9,
    });

    return thinkLog;
  }

  if (game.trick[0].suit === game.trump) {
    thinkLog.push({
      sentence: 'The leader played a trump.',
    });

    if (askedSuitCards.length) {
      thinkLog.push({
        sentence: "I've some trumps.",
      });

      if (handHigherTrumps.length === 1) {
        thinkLog.push({
          sentence: 'Only 1 highter trump, I play him.',
          card: handHigherTrumps[0],
          score: 9,
        });
        return thinkLog;
      }

      if (handHigherTrumps.length) {
        if (game.trick.length === 3) {
          thinkLog.push({
            sentence:
              "I have some highter trumps, I'm the last to play, I play the lowest of the highest.",
            card: handHigherTrumps[0],
            score: 9,
          });
          return thinkLog;
        }

        // TODO: Implement more choices : here otherwise play lowest of highest
        thinkLog.push({
          sentence:
            'I have some highter trumps, I play the highest if it is the highest left in the game.',
          card: handHigherTrumps[handHigherTrumps.length - 1],
          score: 9,
        });
        return thinkLog;
      }

      thinkLog.push({
        sentence:
          'I just have lower trumps and my partner is not leader, I play the lowest.',
        card: handLowerTrumps[0],
        score: 9,
      });

      return thinkLog;
    }
    thinkLog.push({
      sentence: `I've no trumps`,
    });
    if (
      game.trick.indexOf(trickTrumps[trickTrumps.length - 1]) ===
      game.trick.length - 2
    ) {
      thinkLog.push({
        sentence: `My partner wins, I'm playing a non best high value card.`,
        card: game[hand][0], // TODO: fully implement the lowest card
        score: 9,
      });
    } else {
      thinkLog.push({
        sentence: `My partner does not win, I'm playing a low value card.`,
        card: lowestValueCard,
        score: 9,
      });
    }
  } else if (askedSuitCards.length) {
    thinkLog.push({
      sentence: `The leader asked a suit i can serve`,
    });

    if (trickTrumps.length === 0) {
      thinkLog.push({
        sentence: `No cut for now`,
      });

      const lowestSuitCard = askedSuitCards.find((suitCard) =>
        askedSuitCards.every(
          (anotherSuitCard) =>
            suitCard === anotherSuitCard ||
            CARD_FACES_HASH[suitCard.face].suitRank <
              CARD_FACES_HASH[anotherSuitCard.face].suitRank,
        ),
      );
      const highestSuitCard = askedSuitCards.find((suitCard) =>
        askedSuitCards.every(
          (anotherSuitCard) =>
            suitCard === anotherSuitCard ||
            CARD_FACES_HASH[suitCard.face].suitRank >
              CARD_FACES_HASH[anotherSuitCard.face].suitRank,
        ),
      );
      const isHighestCardLeft =
        highestSuitCard &&
        otherHandsLeft[game.trick[0].suit]
          .concat(game.trick.filter((card) => card.suit === game.trick[0].suit))
          .every(
            (aOtherCard) =>
              CARD_FACES_HASH[aOtherCard.face].suitRank <
              CARD_FACES_HASH[highestSuitCard.face].suitRank,
          );

      if (isHighestCardLeft && game.trick.length === 3) {
        thinkLog.push({
          sentence: `The card is the highest of his suit and I'm the last to play.`,
          card: highestSuitCard,
          score: 5,
        });
      } else if (isHighestCardLeft) {
        thinkLog.push({
          sentence: `The card is the highest of his suit.`,
          card: highestSuitCard,
          score: 4,
        });
      } // Could also give points to the partner if he is the winner
      else {
        thinkLog.push({
          sentence: `I've some cards of the asked suit, I play the lowest.`,
          card: lowestSuitCard,
          score: 2,
        });
      }
    } else {
      thinkLog.push({
        sentence: `A player throwed a trump.`,
      });
      if (
        game.trick.indexOf(trickTrumps[trickTrumps.length - 1]) ===
          game.trick.length - 2 &&
        game.trick.length === 3
      ) {
        // TODO: Implement that logic
        thinkLog.push({
          sentence: `My partner wins, I'm the last to play, putting the non-master card with the best value.`,
          card: lowestValueCard,
          score: 9,
        });
      } else {
        thinkLog.push({
          sentence: `My partner does not win, i'm playing a low value card.`,
          card: askedSuitCards[0],
          score: 9,
        });
      }
    }
  } else if (handLeftTrumps.length == 1) {
    // NONON, vérifier si partenaire est maitre,
    // laisser traiter par la suite
    thinkLog.push({
      sentence: `I can't play cards of the asked suit, and I've only one trump, I play him.`,
      card: handLeftTrumps[0],
      score: 9,
    });
  } else if (handLeftTrumps.length) {
    if (!trickHasTrump) {
      thinkLog.push({
        sentence: `No trumps in the trick.`,
      });
      const masterCard = game.trick.find(
        (card) =>
          card.suit === game.trick[0].suit &&
          game.trick.every(
            (aCard) =>
              card !== aCard &&
              CARD_FACES_HASH[card.face].suitRank >
                CARD_FACES_HASH[aCard.face].suitRank,
          ),
      );
      if (game.trick.indexOf(masterCard) === game.trick.length - 2) {
        thinkLog.push({
          sentence: `My partner wins, I don't have to trump, I play the lowest card.`,
          card: lowestValueCard,
          score: 9,
        });
      } else if (game.trick.length === 3) {
        thinkLog.push({
          sentence: `I can't play cards of the asked suit, I've some trumps and I'm the last to play, I play my lowest trump.`,
          card: handLowerTrumps.length ? handLowerTrumps[0] : handLeftTrumps[0],
          score: 9,
        });
      } else {
        thinkLog.push({
          sentence: `I can't play cards of the asked suit, and i've some trumps, i play one of the highest.`,
          card: handHigherTrumps.length
            ? handHigherTrumps[0]
            : handLeftTrumps[0],
          score: 9,
        });
      }
    } // Suit has been trumped
    else {
      if (
        game.trick.indexOf(trickTrumps[trickTrumps.length - 1]) ===
          game.trick.length - 2 &&
        game.trick.length === 3
      ) {
        thinkLog.push({
          sentence: `A player throwed a trump, my partner wins, i'm the last to play, i've trumps, but i dont have to serve them, i put the non-master card with the best value (not implemented).`,
          card: lowestValueCard,
          score: 9,
        });
      } else {
        if (handLeftTrumps.length === 1) {
          thinkLog.push({
            sentence: `A player throwed a trump, my partner does not win, I have only one trump, I play him.`,
            card: handLeftTrumps[0],
            score: 9,
          });
        } else if (handLeftTrumps.length) {
          if (handHigherTrumps.length) {
            thinkLog.push({
              sentence: `A player throwed a trump, my partner does not win, I have a highter trump, I play him.`,
              card: handHigherTrumps[0],
              score: 9,
            });
          } else {
            thinkLog.push({
              sentence: `A player throwed a trump, my partner does not win, I have a lowest trump, I have to play him.`,
              card: handLeftTrumps[0],
              score: 9,
            });
          }
        } else {
          thinkLog.push({
            sentence: `A player throwed a trump, my partner does not win, I have no trump, I'm playing a low value trump card.`,
            card: lowestValueCard,
            score: 9,
          });
        }
      }
    }
  } else {
    thinkLog.push({
      sentence: `I can't play cards of the asked suit, I have no trump, I'm playing a low value card.`,
      card: lowestValueCard,
      score: 9,
    });
  }

  return thinkLog;
}

export type PlayOption = {
  card: CardItem;
  score: number;
  thinkLog: ThinkItem[];
};

function getPlayOptions(game: RunningGame, hand: Hand): PlayOption[] {
  const thinkLog = getPlayThoughts(game, hand);

  return game[hand].map((card) => {
    const cardThinkLog = thinkLog.filter(
      (thinkItem) => thinkItem.card === card || !thinkItem.card,
    );

    return {
      card,
      score: cardThinkLog.reduce(
        (totalScore, { score = 0 }) => totalScore + score,
        0,
      ),
      thinkLog: cardThinkLog,
    };
  }, {});
}

function computeHandScore(game: RunningGame, hand: Hand): number {
  return game.endedTricks.reduce(
    (total, trick, i) =>
      total +
      (trick.winner === hand
        ? (i === NUM_TRICKS - 1 ? 10 : 0) +
          trick.cards.reduce(
            (cardTotal, card) =>
              cardTotal +
              (card.suit === game.trump
                ? CARD_FACES_HASH[card.face].trumpValue
                : CARD_FACES_HASH[card.face].suitValue),
            0,
          )
        : 0),
    0,
  );
}

function nestCards(stack: CardItem[]): CardItem[] {
  const cards = [...stack];
  const newStack = [];

  while (cards.length) {
    const cardIndex = Math.round(Math.random() * (cards.length - 1));

    newStack.push(cards[cardIndex]);
    cards.splice(cardIndex, 1);
  }

  return newStack;
}

function cardPlayErrorMessage(
  game: RunningGame,
  hand: Hand,
  card: CardItem,
): string {
  if (game.trick.length === 0) {
    return '';
  }

  if (game.trick[0].suit === game.trump) {
    if (card.suit !== game.trump) {
      if (game[hand].every((handCard) => handCard.suit !== game.trump)) {
        return '';
      }
      return "Il est obligatoire de fournir de l'atout";
    }

    const trickHighestTrump = game.trick.find((trickCard) =>
      game.trick.every(
        (anotherTrickCard) =>
          trickCard === anotherTrickCard ||
          anotherTrickCard.suit !== game.trump ||
          CARD_FACES_HASH[trickCard.face].trumpRank >
            CARD_FACES_HASH[anotherTrickCard.face].trumpRank,
      ),
    );

    if (
      CARD_FACES_HASH[card.face].trumpRank >
        CARD_FACES_HASH[trickHighestTrump.face].trumpRank ||
      game[hand]
        .filter((handCard) => handCard.suit === game.trump)
        .every(
          (handCard) =>
            handCard === card ||
            CARD_FACES_HASH[handCard.face].trumpRank <
              CARD_FACES_HASH[trickHighestTrump.face].trumpRank,
        )
    ) {
      return '';
    }
    return 'Il faut toujours monter en atout';
  }

  if (card.suit !== game.trick[0].suit) {
    if (game[hand].every((handCard) => handCard.suit !== game.trick[0].suit)) {
      if (
        card.suit === game.trump ||
        game[hand].every((handCard) => handCard.suit !== game.trump)
      ) {
        if (
          game.trick
            .filter((trickCard) => trickCard.suit === game.trump)
            .every(
              (trickCard) =>
                CARD_FACES_HASH[card.face].trumpRank >
                CARD_FACES_HASH[trickCard.face].trumpRank,
            )
        ) {
          return '';
        }

        const trickHighestTrump = game.trick.find((trickCard) =>
          game.trick.every(
            (anotherTrickCard) =>
              trickCard === anotherTrickCard ||
              CARD_FACES_HASH[trickCard.face].trumpRank >
                CARD_FACES_HASH[anotherTrickCard.face].trumpRank,
          ),
        );

        if (
          !trickHighestTrump ||
          game[hand]
            .filter((handCard) => handCard.suit === game.trump)
            .every(
              (handCard) =>
                CARD_FACES_HASH[handCard.face].trumpRank <
                CARD_FACES_HASH[trickHighestTrump.face].trumpRank,
            )
        ) {
          return '';
        }
        return 'Il faut toujours monter en atout sur une coupe';
      }
      const highestTrickCard = getHighestTrickCard(game.trick, game.trump);
      const partnerHand = getPartnerHand(hand);

      if (
        partnerHand ===
        getRelativeHand(game.leader, game.trick.indexOf(highestTrickCard))
      ) {
        return '';
      }

      return "Il est obligatoire de couper tant qu'on a de l'atout";
    }
    if (card.suit === game.trump) {
      return "Impossible de couper tant qu'il vous reste des cartes de cette suite";
    }
    return 'Il est obligatoire de jouer dans la suite demandée';
  }

  return '';
}

function getHighestTrickCard(cards: CardItem[], trump: CardSuit): CardItem {
  return cards.find((card) => {
    return cards.every(
      (aCard: CardItem) =>
        card === aCard ||
        (card.suit === trump && card.suit !== aCard.suit) ||
        (card.suit === trump &&
          CARD_FACES_HASH[card.face].trumpRank >
            CARD_FACES_HASH[aCard.face].trumpRank) ||
        (card.suit !== trump &&
          aCard.suit !== trump &&
          card.suit === cards[0].suit &&
          (card.suit !== aCard.suit ||
            CARD_FACES_HASH[card.face].suitRank >
              CARD_FACES_HASH[aCard.face].suitRank)),
    );
  });
}

function sortSuits(suits: CardSuit[]): CardSuit[] {
  const sortedSuits = [];

  // Ensure reproductible sorting
  suits = suits.sort((suitA, suitB) =>
    CARD_SUITS.indexOf(suitA) < CARD_SUITS.indexOf(suitB) ? -1 : 1,
  );

  while (suits.length) {
    if (sortedSuits.length === 0) {
      sortedSuits.push(suits.pop());
      continue;
    }
    let selectedSuit: CardSuit;

    for (const candidateSuit of suits) {
      if (
        CARD_SUITS_HASH[candidateSuit].color !==
        CARD_SUITS_HASH[sortedSuits[sortedSuits.length - 1]].color
      ) {
        selectedSuit = candidateSuit;
        break;
      }
    }
    if (selectedSuit) {
      suits.splice(suits.indexOf(selectedSuit), 1);
      sortedSuits.push(selectedSuit);
      continue;
    }
    sortedSuits.unshift(suits.pop());
  }
  return sortedSuits;
}
