import type { GameAction, GameState, Reducer } from "../contracts/types.js";

export interface ReplayFrame {
  seq: number;
  actionId: string;
  actorId: string;
  type: string;
  stateVersion: number;
  stateHash: string;
}

export interface ReplayResult {
  finalState: GameState;
  frames: ReplayFrame[];
}

export function replayActions(initialState: GameState, actions: GameAction[], reducer: Reducer): ReplayResult {
  let state = initialState;
  const frames: ReplayFrame[] = [];

  for (const action of actions) {
    const result = reducer(state, action);
    state = result.nextState;
    frames.push({
      seq: action.seq,
      actionId: action.actionId,
      actorId: action.actorId,
      type: action.type,
      stateVersion: state.version,
      stateHash: stableHash(state)
    });
  }

  return { finalState: state, frames };
}

export function stableHash(input: unknown): string {
  const serialized = JSON.stringify(sortKeysDeep(input));
  let hash = 2166136261;
  for (let i = 0; i < serialized.length; i += 1) {
    hash ^= serialized.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function sortKeysDeep(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(sortKeysDeep);
  }
  if (input && typeof input === "object") {
    const objectInput = input as Record<string, unknown>;
    return Object.keys(objectInput)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeysDeep(objectInput[key]);
        return acc;
      }, {});
  }
  return input;
}
