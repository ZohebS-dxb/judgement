import { randomInt } from "node:crypto";
import { cardId, createDeck, legalCards, shuffle } from "./cards";
import { DEFAULT_BIDDING_SECONDS, PRESENCE_WINDOW_SECONDS, SCORECARD_SECONDS, roundSizes, trumpForRound } from "./config";
import { roundResults, trickWinner } from "./rules";
import type { Card, ClientGameState, Direction, GameAction, GameState, PlayerState, RoundMode } from "./types";

export function traverse(index: number, count: number, direction: Direction): number {
  return (index + (direction === "clockwise" ? 1 : count - 1)) % count;
}

export function directionForRound(mode: RoundMode, sizes: number[], roundNumber: number): Direction {
  if (mode !== "full") return "clockwise";
  return roundNumber <= sizes.indexOf(1) + 1 ? "clockwise" : "counter_clockwise";
}

function rememberAction(state: GameState, actionId: string) {
  return [...state.processedActionIds.slice(-199), actionId];
}

function deal(state: GameState, biddingSeconds: number, now: Date): GameState {
  const cardsDealt = state.roundSizes[state.roundNumber - 1];
  const deck = shuffle(createDeck());
  const hands: Record<string, Card[]> = Object.fromEntries(state.players.map((player) => [player.id, []]));
  const direction = directionForRound(state.mode, state.roundSizes, state.roundNumber);
  for (let n = 0; n < cardsDealt; n++) {
    for (let offset = 1; offset <= state.players.length; offset++) {
      const delta = direction === "clockwise" ? offset : -offset;
      const player = state.players[(state.dealerIndex + delta + state.players.length * 2) % state.players.length];
      hands[player.id].push(deck.pop()!);
    }
  }
  return { ...state, phase: "bidding", direction, activePlayerIndex: traverse(state.dealerIndex, state.players.length, direction), cardsDealt,
    trump: trumpForRound(state.roundNumber), biddingEndsAt: biddingSeconds > 0 ? new Date(now.getTime() + biddingSeconds * 1000).toISOString() : null,
    scorecardEndsAt: null, readyPlayerIds: [], autoBidPlayerIds: [], hands, currentTrick: [], completedTricks: [], lastRoundResults: [],
    players: state.players.map((player) => ({ ...player, bid: null, tricksWon: 0 })) };
}

export function createGameState(
  gameId: string,
  participants: Array<{ id: string; profileId?: string | null; name: string; seat: number }>,
  mode: RoundMode,
  customRounds = 10,
  biddingSeconds = DEFAULT_BIDDING_SECONDS,
  now = new Date(),
  dealerIndex?: number,
): GameState {
  if (![3, 4].includes(participants.length)) throw new Error("Judgement requires three or four players");
  const chosenDealer = dealerIndex ?? randomInt(participants.length);
  const sizes = roundSizes(mode, participants.length, customRounds);
  const players: PlayerState[] = participants.map((p) => ({ ...p, profileId: p.profileId ?? null, bid: null, tricksWon: 0, totalScore: 0 }));
  return deal({ version: 1, gameId, mode, roundSizes: sizes, roundNumber: 1, phase: "bidding", direction: "clockwise", dealerIndex: chosenDealer,
    activePlayerIndex: 0, cardsDealt: 0, trump: "spades", biddingEndsAt: null, scorecardEndsAt: null, readyPlayerIds: [], autoBidPlayerIds: [],
    presence: Object.fromEntries(players.map((player) => [player.id, now.toISOString()])), players, hands: {}, currentTrick: [], completedTricks: [],
    lastRoundResults: [], processedActionIds: [] }, biddingSeconds, now);
}

function revealBids(state: GameState): GameState {
  return { ...state, phase: "playing", biddingEndsAt: null, activePlayerIndex: traverse(state.dealerIndex, state.players.length, state.direction) };
}

function advanceRound(state: GameState, biddingSeconds: number, now: Date): GameState {
  if (state.roundNumber >= state.roundSizes.length) return { ...state, version: state.version + 1, phase: "game_complete", scorecardEndsAt: null, hands: {}, completedTricks: [] };
  const roundNumber = state.roundNumber + 1;
  const direction = directionForRound(state.mode, state.roundSizes, roundNumber);
  const dealerIndex = traverse(state.dealerIndex, state.players.length, direction);
  return deal({ ...state, version: state.version + 1, roundNumber, dealerIndex, direction }, biddingSeconds, now);
}

export function applyTimedTransitions(state: GameState, biddingSeconds: number, now = new Date()): GameState {
  if (state.phase === "bidding" && state.biddingEndsAt && now >= new Date(state.biddingEndsAt)) {
    const autoBidPlayerIds = state.players.filter((player) => player.bid === null).map((player) => player.id);
    return revealBids({ ...state, version: state.version + 1, autoBidPlayerIds, players: state.players.map((player) => player.bid === null ? { ...player, bid: 0 } : player) });
  }
  if (state.phase === "round_complete" && state.scorecardEndsAt && now >= new Date(state.scorecardEndsAt)) return advanceRound(state, biddingSeconds, now);
  return state;
}

export function applyAction(state: GameState, actorId: string, action: GameAction, biddingSeconds = DEFAULT_BIDDING_SECONDS, now = new Date()): GameState {
  if (!state.players.some((player) => player.id === actorId)) throw new Error("Player is not in this game");
  if (state.processedActionIds.includes(action.actionId)) return state;
  state = applyTimedTransitions(state, biddingSeconds, now);
  const actorIndex = state.players.findIndex((player) => player.id === actorId);
  const common = { version: state.version + 1, processedActionIds: rememberAction(state, action.actionId), presence: { ...state.presence, [actorId]: now.toISOString() } };
  if (action.type === "heartbeat") return { ...state, ...common };

  if (action.type === "place_bid") {
    if (state.phase !== "bidding") throw new Error("Bidding is closed");
    if (state.players[actorIndex].bid !== null) throw new Error("Your bid is already locked");
    if (!Number.isInteger(action.bid) || action.bid < 0 || action.bid > state.cardsDealt) throw new Error("That bid is not allowed");
    const players = state.players.map((player, index) => index === actorIndex ? { ...player, bid: action.bid } : player);
    const next = { ...state, ...common, players };
    return players.every((player) => player.bid !== null) ? revealBids(next) : next;
  }

  if (action.type === "scorecard_ready") {
    if (state.phase !== "round_complete") throw new Error("The scorecard is not open");
    const readyPlayerIds = [...new Set([...state.readyPlayerIds, actorId])];
    const cutoff = now.getTime() - PRESENCE_WINDOW_SECONDS * 1000;
    const connected = state.players.filter((player) => new Date(state.presence[player.id] ?? 0).getTime() >= cutoff);
    const next = { ...state, ...common, readyPlayerIds };
    return connected.length > 0 && connected.every((player) => readyPlayerIds.includes(player.id)) ? advanceRound(next, biddingSeconds, now) : next;
  }

  if (state.phase !== "playing") throw new Error("Cards cannot be played now");
  if (actorIndex !== state.activePlayerIndex) throw new Error("It is not your turn");
  const hand = state.hands[actorId] ?? [];
  const matching = hand.find((card) => cardId(card) === cardId(action.card));
  if (!matching) throw new Error("That card is not in your hand");
  const ledSuit = state.currentTrick[0]?.card.suit ?? null;
  if (!legalCards(hand, ledSuit).some((card) => cardId(card) === cardId(action.card))) throw new Error("You must follow suit");
  const currentTrick = [...state.currentTrick, { playerId: actorId, card: matching }];
  const hands = { ...state.hands, [actorId]: hand.filter((card) => cardId(card) !== cardId(matching)) };
  if (currentTrick.length < state.players.length) return { ...state, ...common, hands, currentTrick, activePlayerIndex: traverse(actorIndex, state.players.length, state.direction) };
  const winnerId = trickWinner(currentTrick, state.trump);
  const winnerIndex = state.players.findIndex((player) => player.id === winnerId);
  const completedTricks = [...state.completedTricks, { number: state.completedTricks.length + 1, leaderId: currentTrick[0].playerId, cards: currentTrick, winnerId }];
  const players = state.players.map((player) => player.id === winnerId ? { ...player, tricksWon: player.tricksWon + 1 } : player);
  if (completedTricks.length < state.cardsDealt) return { ...state, ...common, hands, currentTrick: [], completedTricks, players, activePlayerIndex: winnerIndex };
  const results = roundResults(players);
  const scoredPlayers = players.map((player) => ({ ...player, totalScore: results.find((result) => result.playerId === player.id)!.totalScore }));
  return { ...state, ...common, hands, currentTrick: [], completedTricks, players: scoredPlayers, phase: "round_complete",
    lastRoundResults: results, scorecardEndsAt: new Date(now.getTime() + SCORECARD_SECONDS * 1000).toISOString(), readyPlayerIds: [] };
}

export function toClientState(state: GameState, playerId: string): ClientGameState {
  const hand = state.hands[playerId] ?? [];
  const ledSuit = state.currentTrick[0]?.card.suit ?? null;
  const { hands, processedActionIds: _, ...publicState } = state;
  const biddingPlayers = state.phase === "bidding" ? state.players.map((player) => ({ ...player, bid: player.id === playerId ? player.bid : null })) : state.players;
  return { ...publicState, players: biddingPlayers, hand,
    opponentCardCounts: Object.fromEntries(state.players.filter((p) => p.id !== playerId).map((p) => [p.id, hands[p.id]?.length ?? 0])),
    legalCardIds: state.phase === "playing" && state.players[state.activePlayerIndex]?.id === playerId ? legalCards(hand, ledSuit).map(cardId) : [] };
}
