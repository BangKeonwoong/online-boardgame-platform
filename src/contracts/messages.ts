import type { GameAction, GameId, GameState, MatchStatus } from "./types.js";

export type ClientMessage =
  | JoinRoomMessage
  | StartGameMessage
  | SubmitActionMessage
  | SyncRequestMessage
  | ResignMessage
  | HeartbeatMessage;

export interface JoinRoomMessage {
  kind: "join_room";
  roomCode: string;
  nickname: string;
  preferredGameId: GameId;
}

export interface StartGameMessage {
  kind: "start_game";
  roomCode: string;
}

export interface SubmitActionMessage {
  kind: "submit_action";
  roomCode: string;
  action: GameAction;
}

export interface SyncRequestMessage {
  kind: "sync_state";
  roomCode: string;
  fromVersion: number;
}

export interface ResignMessage {
  kind: "resign";
  roomCode: string;
  playerId: string;
}

export interface HeartbeatMessage {
  kind: "heartbeat";
  roomCode: string;
  playerId: string;
  sentAt: string;
}

export type ServerEvent =
  | RoomJoinedEvent
  | StateSyncedEvent
  | ActionAcceptedEvent
  | ActionRejectedEvent
  | MatchStatusChangedEvent
  | PlayerPresenceChangedEvent;

export interface RoomJoinedEvent {
  kind: "room_joined";
  roomCode: string;
  playerId: string;
  state: GameState;
}

export interface StateSyncedEvent {
  kind: "state_synced";
  roomCode: string;
  state: GameState;
  lastAppliedSeq: number;
}

export interface ActionAcceptedEvent {
  kind: "action_accepted";
  roomCode: string;
  actionId: string;
  seq: number;
  stateVersion: number;
}

export interface ActionRejectedEvent {
  kind: "action_rejected";
  roomCode: string;
  actionId: string;
  reasonCode: string;
  reasonMessage: string;
}

export interface MatchStatusChangedEvent {
  kind: "match_status_changed";
  roomCode: string;
  status: MatchStatus;
  winnerIds: string[];
  reason?: string;
}

export interface PlayerPresenceChangedEvent {
  kind: "player_presence_changed";
  roomCode: string;
  playerId: string;
  connected: boolean;
}
