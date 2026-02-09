import type { GameId } from "../contracts/types.js";

export interface GameCatalogEntry {
  gameId: GameId;
  displayName: string;
  minPlayers: number;
  maxPlayers: number;
  expectedDurationMinutes: number;
  testVectorPath: string;
  specPath: string;
}

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    gameId: "splendor",
    displayName: "Splendor",
    minPlayers: 2,
    maxPlayers: 4,
    expectedDurationMinutes: 30,
    testVectorPath: "research_online_boardgames/test_vectors/splendor.json",
    specPath: "research_online_boardgames/game_specs/splendor.md"
  },
  {
    gameId: "gomoku",
    displayName: "Gomoku",
    minPlayers: 2,
    maxPlayers: 2,
    expectedDurationMinutes: 20,
    testVectorPath: "research_online_boardgames/test_vectors/gomoku.json",
    specPath: "research_online_boardgames/game_specs/gomoku.md"
  },
  {
    gameId: "gostop",
    displayName: "Go-Stop / Matgo",
    minPlayers: 2,
    maxPlayers: 3,
    expectedDurationMinutes: 40,
    testVectorPath: "research_online_boardgames/test_vectors/gostop.json",
    specPath: "research_online_boardgames/game_specs/gostop.md"
  },
  {
    gameId: "catan",
    displayName: "Catan",
    minPlayers: 3,
    maxPlayers: 4,
    expectedDurationMinutes: 90,
    testVectorPath: "research_online_boardgames/test_vectors/catan.json",
    specPath: "research_online_boardgames/game_specs/catan.md"
  },
  {
    gameId: "azul",
    displayName: "Azul",
    minPlayers: 2,
    maxPlayers: 4,
    expectedDurationMinutes: 45,
    testVectorPath: "research_online_boardgames/test_vectors/azul.json",
    specPath: "research_online_boardgames/game_specs/azul.md"
  }
];
