import type { GameId, MatchStatus } from "../../contracts/types.js";

export interface MatchEntity {
  matchId: string;
  gameId: GameId;
  playerIds: string[];
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMatchInput {
  matchId: string;
  gameId: GameId;
  playerIds: string[];
  createdAt: string;
}

export class MemoryMatchStore {
  private readonly matches = new Map<string, MatchEntity>();

  createMatch(input: CreateMatchInput): MatchEntity {
    const entity: MatchEntity = {
      ...input,
      status: "pending",
      updatedAt: input.createdAt
    };
    this.matches.set(entity.matchId, entity);
    return entity;
  }

  getMatchById(matchId: string): MatchEntity | null {
    return this.matches.get(matchId) ?? null;
  }

  listMatches(): MatchEntity[] {
    return [...this.matches.values()];
  }
}
