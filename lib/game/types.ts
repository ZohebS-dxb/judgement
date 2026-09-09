export const SUITS = ["clubs", "diamonds", "hearts", "spades"] as const;
export type Suit = (typeof SUITS)[number];
export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;
export type Rank = (typeof RANKS)[number];
export type Card = { suit: Suit; rank: Rank };
export type Direction = "clockwise" | "counter_clockwise";
export type RoundMode = "custom" | "half" | "full";
export type Phase = "bidding" | "playing" | "trick_complete" | "round_complete" | "game_complete";

export type PlayerState = {
  id: string;
  profileId: string | null;
  name: string;
  seat: number;
  bid: number | null;
  tricksWon: number;
  totalScore: number;
};

export type PlayedCard = { playerId: string; card: Card };
export type CompletedTrick = { number: number; leaderId: string; cards: PlayedCard[]; winnerId: string };
export type RoundResult = { playerId: string; bid: number; tricksWon: number; roundScore: number; totalScore: number };
export type RoundScoreSnapshot = { roundNumber: number; trump: Suit; results: RoundResult[] };

export type GameState = {
  version: number;
  gameId: string;
  mode: RoundMode;
  roundSizes: number[];
  roundNumber: number;
  phase: Phase;
  direction: Direction;
  dealerIndex: number;
  activePlayerIndex: number;
  cardsDealt: number;
  trump: Suit;
  biddingEndsAt: string | null;
  scorecardEndsAt: string | null;
  readyPlayerIds: string[];
  autoBidPlayerIds: string[];
  presence: Record<string, string>;
  players: PlayerState[];
  hands: Record<string, Card[]>;
  currentTrick: PlayedCard[];
  trickWinnerId?: string | null;
  trickEndsAt?: string | null;
  completedTricks: CompletedTrick[];
  lastRoundResults: RoundResult[];
  scoreHistory?: RoundScoreSnapshot[];
  endedEarly?: boolean;
  endedByPlayerId?: string | null;
  processedActionIds: string[];
};

export type ClientGameState = Omit<GameState, "hands" | "processedActionIds"> & {
  hand: Card[];
  opponentCardCounts: Record<string, number>;
  legalCardIds: string[];
};

export type GameAction =
  | { type: "place_bid"; bid: number; actionId: string }
  | { type: "play_card"; card: Card; actionId: string }
  | { type: "scorecard_ready"; actionId: string }
  | { type: "end_game"; actionId: string }
  | { type: "heartbeat"; actionId: string };

export type BidCallStatus = "UNDER CALL" | "OVER CALL" | "EXACT";
