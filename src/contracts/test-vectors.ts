import { z } from "zod";
import type { GameId } from "./types.js";

export const ScenarioKindSchema = z.enum(["normal", "illegal", "edge"]);
export type ScenarioKind = z.infer<typeof ScenarioKindSchema>;

export const ActionExpectationSchema = z.object({
  accepted: z.boolean(),
  reasonCode: z.string().optional()
});

export const ScenarioStepSchema = z.object({
  seq: z.number().int().nonnegative(),
  actorId: z.string(),
  type: z.string(),
  payload: z.record(z.unknown()),
  expect: ActionExpectationSchema
});

export const TestScenarioSchema = z.object({
  id: z.string(),
  kind: ScenarioKindSchema,
  title: z.string(),
  description: z.string(),
  initialStateRef: z.string(),
  steps: z.array(ScenarioStepSchema).min(1),
  expected: z.object({
    terminalPhase: z.string(),
    winners: z.array(z.string()),
    stateAssertions: z.array(z.string())
  })
});

export const TestVectorSchema = z.object({
  gameId: z.enum(["splendor", "gomoku", "gostop", "catan", "azul"]),
  rulesetVersion: z.string(),
  scenarioCounts: z.object({
    normal: z.number().int().nonnegative(),
    illegal: z.number().int().nonnegative(),
    edge: z.number().int().nonnegative()
  }),
  initialStates: z.record(z.record(z.unknown())),
  scenarios: z.array(TestScenarioSchema).min(1),
  sources: z.array(z.string().url()).min(1)
});

export type TestVector = z.infer<typeof TestVectorSchema>;

export function assertGameId(gameId: string): asserts gameId is GameId {
  if (!["splendor", "gomoku", "gostop", "catan", "azul"].includes(gameId)) {
    throw new Error(`Unsupported game id: ${gameId}`);
  }
}
