import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GAME_CATALOG } from "../src/games/catalog.js";
import { ScenarioKindSchema, TestVectorSchema, type ScenarioKind } from "../src/contracts/test-vectors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

async function main(): Promise<void> {
  for (const game of GAME_CATALOG) {
    const filePath = path.resolve(rootDir, game.testVectorPath);
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);

    const parsed = TestVectorSchema.parse(data);
    if (parsed.gameId !== game.gameId) {
      throw new Error(`${game.gameId}: vector gameId mismatch (${parsed.gameId})`);
    }

    const observedCounts = countScenarios(parsed.scenarios.map((scenario) => scenario.kind));
    for (const kind of Object.keys(observedCounts) as ScenarioKind[]) {
      if (observedCounts[kind] !== parsed.scenarioCounts[kind]) {
        throw new Error(
          `${game.gameId}: scenarioCounts.${kind}=${parsed.scenarioCounts[kind]}, observed=${observedCounts[kind]}`
        );
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Validated ${GAME_CATALOG.length} test vector files.`);
}

function countScenarios(scenarios: ScenarioKind[]): Record<ScenarioKind, number> {
  const counts: Record<ScenarioKind, number> = {
    normal: 0,
    illegal: 0,
    edge: 0
  };

  for (const scenario of scenarios) {
    ScenarioKindSchema.parse(scenario);
    counts[scenario] += 1;
  }

  return counts;
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
