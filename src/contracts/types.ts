export type GameId = "splendor" | "gomoku" | "gostop" | "catan" | "azul";

export type MatchStatus = "pending" | "active" | "finished" | "aborted";

export interface PlayerState {
  playerId: string;
  nickname: string;
  connected: boolean;
  isReady: boolean;
}

export interface GameState {
  gameId: GameId;
  matchId: string;
  version: number;
  phase: string;
  turn: number;
  currentPlayerId: string;
  status: MatchStatus;
  players: PlayerState[];
  winnerIds: string[];
  payload: Record<string, unknown>;
}

export interface GameAction<TPayload = Record<string, unknown>> {
  gameId: GameId;
  matchId: string;
  actionId: string;
  seq: number;
  actorId: string;
  type: string;
  payload: TPayload;
  clientTimestamp: string;
  idempotencyKey: string;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
}

export interface ReducerResult {
  nextState: GameState;
  emittedEvents: string[];
}

export type RuleValidator = (state: GameState, action: GameAction) => ValidationResult;

export type Reducer = (state: GameState, action: GameAction) => ReducerResult;

export type WinEvaluator = (state: GameState) => {
  isFinished: boolean;
  winnerIds: string[];
  reason?: string;
};
