import { describe, expect, it } from "vitest";
import { GAME_CATALOG } from "../src/games/catalog.js";
import { TestVectorSchema } from "../src/contracts/test-vectors.js";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("game catalog", () => {
  it("contains unique game ids", () => {
    const unique = new Set(GAME_CATALOG.map((game) => game.gameId));
    expect(unique.size).toBe(GAME_CATALOG.length);
  });

  it("references existing test vectors that satisfy schema", () => {
    for (const game of GAME_CATALOG) {
      const raw = readFileSync(path.resolve(game.testVectorPath), "utf8");
      const parsed = TestVectorSchema.parse(JSON.parse(raw));
      expect(parsed.gameId).toBe(game.gameId);
    }
  });
});
