import type { GameAction, GameId, GameState, MatchStatus } from "./types.js";

export interface RoomRecord {
  roomCode: string;
  gameId: GameId;
  hostPlayerId: string;
  createdAt: string;
  closedAt?: string;
}

export interface MatchRecord {
  matchId: string;
  roomCode: string;
  gameId: GameId;
  status: MatchStatus;
  startedAt: string;
  endedAt?: string;
  winnerIds: string[];
  stateVersion: number;
}

export interface ActionLogRecord {
  matchId: string;
  seq: number;
  actionId: string;
  actorId: string;
  actionType: string;
  actionPayload: Record<string, unknown>;
  idempotencyKey: string;
  serverTimestamp: string;
}

export interface StateSnapshotRecord {
  matchId: string;
  version: number;
  capturedAt: string;
  state: GameState;
}

export interface RepositoryPort {
  insertRoom(room: RoomRecord): Promise<void>;
  upsertMatch(match: MatchRecord): Promise<void>;
  appendActionLog(log: ActionLogRecord): Promise<void>;
  insertSnapshot(snapshot: StateSnapshotRecord): Promise<void>;
  getMatchById(matchId: string): Promise<MatchRecord | null>;
  getLogsForMatch(matchId: string): Promise<ActionLogRecord[]>;
}

export function toActionLog(action: GameAction, serverTimestamp: string): ActionLogRecord {
  return {
    matchId: action.matchId,
    seq: action.seq,
    actionId: action.actionId,
    actorId: action.actorId,
    actionType: action.type,
    actionPayload: action.payload,
    idempotencyKey: action.idempotencyKey,
    serverTimestamp
  };
}
