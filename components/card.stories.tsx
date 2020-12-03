import React from "react";
import Card, { ALL_SIZES, CARD_FACES, CARD_SUITS } from "./card";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";

export default {
  title: "Game/Card",
  decorators: [withKnobs],
};

export const baseCard = (): JSX.Element => (
  <Card
    face={select("Face", CARD_FACES, CARD_FACES[0])}
    suit={select("Suit", CARD_SUITS, CARD_SUITS[0])}
    hidden={boolean("Hidden", false)}
    size={select("Size", ALL_SIZES, ALL_SIZES[0])}
    onClick={() => alert("Clicked!")}
  />
);
