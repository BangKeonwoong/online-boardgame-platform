import { readFile } from "node:fs/promises";
import path from "node:path";
import { GAME_CATALOG } from "../games/catalog.js";
import { TestVectorSchema, type TestVector } from "../contracts/test-vectors.js";
import type { GameId } from "../contracts/types.js";

export async function loadTestVector(gameId: GameId): Promise<TestVector> {
  const game = GAME_CATALOG.find((entry) => entry.gameId === gameId);
  if (!game) {
    throw new Error(`Unsupported gameId: ${gameId}`);
  }

  const filePath = path.resolve(process.cwd(), game.testVectorPath);
  const raw = await readFile(filePath, "utf8");
  return TestVectorSchema.parse(JSON.parse(raw));
}
