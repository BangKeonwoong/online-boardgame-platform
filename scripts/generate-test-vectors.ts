import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ScenarioKind, TestVector } from "../src/contracts/test-vectors.js";

type ScenarioTemplate = {
  title: string;
  description: string;
  initialStateRef: string;
  actorId: string;
  type: string;
  payload: Record<string, unknown>;
  accepted: boolean;
  reasonCode?: string;
  terminalPhase: string;
  winners: string[];
  assertions: string[];
};

type GameVectorConfig = {
  gameId: TestVector["gameId"];
  rulesetVersion: string;
  sources: string[];
  initialStates: TestVector["initialStates"];
  normal: ScenarioTemplate[];
  illegal: ScenarioTemplate[];
  edge: ScenarioTemplate[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.resolve(rootDir, "research_online_boardgames", "test_vectors");

const gameConfigs: GameVectorConfig[] = [
  splendorConfig(),
  gomokuConfig(),
  gostopConfig(),
  catanConfig(),
  azulConfig()
];

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });

  for (const config of gameConfigs) {
    const vector = buildVector(config);
    const outPath = path.resolve(outputDir, `${config.gameId}.json`);
    await writeFile(outPath, `${JSON.stringify(vector, null, 2)}\n`, "utf8");
  }

  // eslint-disable-next-line no-console
  console.log(`Generated ${gameConfigs.length} vector files in ${outputDir}`);
}

function buildVector(config: GameVectorConfig): TestVector {
  const scenarios = [
    ...materializeScenarios(config.normal, "normal"),
    ...materializeScenarios(config.illegal, "illegal"),
    ...materializeScenarios(config.edge, "edge")
  ];

  return {
    gameId: config.gameId,
    rulesetVersion: config.rulesetVersion,
    scenarioCounts: {
      normal: config.normal.length,
      illegal: config.illegal.length,
      edge: config.edge.length
    },
    initialStates: config.initialStates,
    scenarios,
    sources: config.sources
  };
}

function materializeScenarios(templates: ScenarioTemplate[], kind: ScenarioKind): TestVector["scenarios"] {
  return templates.map((scenario, index) => {
    const sequenceNumber = String(index + 1).padStart(2, "0");
    return {
      id: `${kind}-${sequenceNumber}`,
      kind,
      title: scenario.title,
      description: scenario.description,
      initialStateRef: scenario.initialStateRef,
      steps: [
        {
          seq: 1,
          actorId: scenario.actorId,
          type: scenario.type,
          payload: scenario.payload,
          expect: {
            accepted: scenario.accepted,
            ...(scenario.reasonCode ? { reasonCode: scenario.reasonCode } : {})
          }
        }
      ],
      expected: {
        terminalPhase: scenario.terminalPhase,
        winners: scenario.winners,
        stateAssertions: scenario.assertions
      }
    };
  });
}

function splendorConfig(): GameVectorConfig {
  return {
    gameId: "splendor",
    rulesetVersion: "2024-space-cowboys-base-en",
    sources: [
      "https://cdn.svc.asmodee.net/production-spacecowboys/uploads/2024/09/SPLENDOR-RULES-EN.pdf",
      "https://www.spacecowboys.fr/splendor",
      "https://www.rulespal.com/splendor/rulebook"
    ],
    initialStates: {
      base_3p: {
        phase: "main_turn",
        currentPlayerId: "p1",
        tokenLimit: 10
      },
      reserve_limit: {
        phase: "main_turn",
        currentPlayerId: "p1",
        reservedCountP1: 3
      },
      tie_break: {
        phase: "end_of_turn_checks",
        currentPlayerId: "p3",
        triggeredLastRound: true
      }
    },
    normal: [
      {
        title: "Take three different tokens",
        description: "Player takes 3 different gems when available.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "TAKE_TOKENS_DIFFERENT",
        payload: { colors: ["emerald", "ruby", "diamond"] },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["p1 token count increases by 3"]
      },
      {
        title: "Take two same color with bank >= 4",
        description: "Legal same-color take rule.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "TAKE_TOKENS_SAME",
        payload: { color: "onyx" },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["bank onyx decreases by 2"]
      },
      {
        title: "Reserve visible card",
        description: "Reserve from tableau and receive gold if available.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "RESERVE_VISIBLE_CARD",
        payload: { tier: 1, cardId: "t1-c3" },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["reserved cards for p1 increments"]
      },
      {
        title: "Reserve top deck card",
        description: "Blind reserve from deck.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "RESERVE_TOP_DECK_CARD",
        payload: { tier: 2 },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["tier2 deck remaining decremented"]
      },
      {
        title: "Purchase visible card with discounts",
        description: "Cost reduced by bonuses.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "PURCHASE_VISIBLE_CARD",
        payload: { tier: 1, cardId: "t1-c1", payment: { ruby: 1, gold: 1 } },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["p1 prestige increases"]
      },
      {
        title: "Purchase reserved card",
        description: "Reserved card can be purchased directly.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "PURCHASE_RESERVED_CARD",
        payload: { cardId: "rsv-7", payment: { sapphire: 2, diamond: 1 } },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["reserved card removed after purchase"]
      },
      {
        title: "Claim noble after purchase",
        description: "Automatic noble award when requirements met.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "PURCHASE_VISIBLE_CARD",
        payload: { tier: 2, cardId: "t2-c5", payment: { emerald: 2 } },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["noble assigned to p1"]
      },
      {
        title: "Trigger last round at 15 points",
        description: "Player reaches 15 prestige.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "PURCHASE_VISIBLE_CARD",
        payload: { tier: 3, cardId: "t3-c2", payment: { gold: 2, ruby: 3 } },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["last round flag set"]
      },
      {
        title: "Forced token return after overflow",
        description: "Overflow follow-up action resolves to 10 tokens.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "RETURN_TOKENS_AFTER_OVERFLOW",
        payload: { returns: { ruby: 1 } },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["p1 token total equals 10"]
      },
      {
        title: "Resolve tie-breaker at end of final round",
        description: "Winner selected by purchased card count tie-break.",
        initialStateRef: "tie_break",
        actorId: "p3",
        type: "END_ROUND_EVALUATION",
        payload: {},
        accepted: true,
        terminalPhase: "finished",
        winners: ["p2"],
        assertions: ["winner chosen deterministically"]
      }
    ],
    illegal: [
      {
        title: "Take two same color when bank has < 4",
        description: "Rule violation for same-color token action.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "TAKE_TOKENS_SAME",
        payload: { color: "emerald" },
        accepted: false,
        reasonCode: "TOKEN_POOL_TOO_LOW",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Take duplicate colors in different-token action",
        description: "Different-token action requires distinct colors.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "TAKE_TOKENS_DIFFERENT",
        payload: { colors: ["ruby", "ruby", "onyx"] },
        accepted: false,
        reasonCode: "COLORS_NOT_DISTINCT",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Reserve a fourth card",
        description: "Reserve limit is 3 cards.",
        initialStateRef: "reserve_limit",
        actorId: "p1",
        type: "RESERVE_VISIBLE_CARD",
        payload: { tier: 1, cardId: "t1-c8" },
        accepted: false,
        reasonCode: "RESERVE_LIMIT_REACHED",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["reserved card count unchanged"]
      },
      {
        title: "Purchase without enough payment",
        description: "Cannot underpay development card cost.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "PURCHASE_VISIBLE_CARD",
        payload: { tier: 2, cardId: "t2-c4", payment: { ruby: 1 } },
        accepted: false,
        reasonCode: "INSUFFICIENT_PAYMENT",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["tableau unchanged"]
      },
      {
        title: "Return tokens when not overflowing",
        description: "Forced return only valid in overflow state.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "RETURN_TOKENS_AFTER_OVERFLOW",
        payload: { returns: { emerald: 1 } },
        accepted: false,
        reasonCode: "NOT_IN_OVERFLOW",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["token counts unchanged"]
      },
      {
        title: "Reserve from empty deck",
        description: "Cannot draw hidden reserve when deck empty.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "RESERVE_TOP_DECK_CARD",
        payload: { tier: 3, forcedDeckRemaining: 0 },
        accepted: false,
        reasonCode: "DECK_EMPTY",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["deck remains empty"]
      },
      {
        title: "Act out of turn",
        description: "Non-current player action rejected.",
        initialStateRef: "base_3p",
        actorId: "p2",
        type: "TAKE_TOKENS_DIFFERENT",
        payload: { colors: ["emerald", "ruby", "diamond"] },
        accepted: false,
        reasonCode: "NOT_PLAYER_TURN",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["current player remains p1"]
      },
      {
        title: "Reserve non-existing card id",
        description: "Card must exist in current tableau row.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "RESERVE_VISIBLE_CARD",
        payload: { tier: 1, cardId: "missing-card" },
        accepted: false,
        reasonCode: "CARD_NOT_FOUND",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Purchase reserved card not owned",
        description: "Player cannot buy another player's reserve.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "PURCHASE_RESERVED_CARD",
        payload: { cardId: "p2-rsv-1", payment: { ruby: 2 } },
        accepted: false,
        reasonCode: "RESERVED_CARD_NOT_OWNED",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Action after match finished",
        description: "No actions accepted in terminal state.",
        initialStateRef: "tie_break",
        actorId: "p1",
        type: "TAKE_TOKENS_DIFFERENT",
        payload: { colors: ["emerald", "ruby", "diamond"] },
        accepted: false,
        reasonCode: "MATCH_FINISHED",
        terminalPhase: "finished",
        winners: ["p2"],
        assertions: ["no additional events emitted"]
      }
    ],
    edge: [
      {
        title: "Take three tokens when only three colors left",
        description: "Edge of bank depletion still legal.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "TAKE_TOKENS_DIFFERENT",
        payload: { colors: ["emerald", "sapphire", "onyx"], forcedPoolSparse: true },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["bank can reach zero for selected colors"]
      },
      {
        title: "Reserve without gold in bank",
        description: "Reserve still valid when gold unavailable.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "RESERVE_VISIBLE_CARD",
        payload: { tier: 2, cardId: "t2-c3", forcedGoldInBank: 0 },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["reserve succeeds without gold gain"]
      },
      {
        title: "Multiple nobles eligible",
        description: "Deterministic noble selection path.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "PURCHASE_VISIBLE_CARD",
        payload: { tier: 2, cardId: "t2-c2", payment: { diamond: 2 }, multiNobleEligible: true },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["lowest noble id selected"]
      },
      {
        title: "Purchase with all-gold payment",
        description: "Gold can cover any shortfall.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "PURCHASE_RESERVED_CARD",
        payload: { cardId: "rsv-9", payment: { gold: 4 } },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["gold spent correctly"]
      },
      {
        title: "Exact token limit after take",
        description: "Take action ending at exactly 10 tokens is valid.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "TAKE_TOKENS_DIFFERENT",
        payload: { colors: ["ruby", "diamond", "onyx"], tokenCountBefore: 7 },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["no forced return action required"]
      },
      {
        title: "Tableau slot not refilled when deck empty",
        description: "Empty slot remains empty if tier deck exhausted.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "PURCHASE_VISIBLE_CARD",
        payload: { tier: 3, cardId: "t3-last", payment: { emerald: 3 }, forcedDeckRemaining: 0 },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["tier3 tableau can show <4 cards"]
      },
      {
        title: "Late-round tie resolved by card count",
        description: "Same prestige winner has fewer purchased cards.",
        initialStateRef: "tie_break",
        actorId: "p3",
        type: "END_ROUND_EVALUATION",
        payload: { tieMode: "card_count" },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p2"],
        assertions: ["tie-breaker applied"]
      },
      {
        title: "Late-round full tie by card count",
        description: "Fallback to turn-order deterministic winner.",
        initialStateRef: "tie_break",
        actorId: "p3",
        type: "END_ROUND_EVALUATION",
        payload: { tieMode: "turn_order" },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["turn-order rule applied"]
      },
      {
        title: "Attempt same-color take with exactly 3 in bank",
        description: "Boundary rejects at 3.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "TAKE_TOKENS_SAME",
        payload: { color: "diamond", forcedBankCount: 3 },
        accepted: false,
        reasonCode: "TOKEN_POOL_TOO_LOW",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Last round trigger does not end immediately",
        description: "Round must complete to end game.",
        initialStateRef: "base_3p",
        actorId: "p1",
        type: "PURCHASE_VISIBLE_CARD",
        payload: { tier: 3, cardId: "t3-c9", payment: { onyx: 5 }, forcePrestigeTo15: true },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["status remains active until round completion"]
      }
    ]
  };
}

function gomokuConfig(): GameVectorConfig {
  return {
    gameId: "gomoku",
    rulesetVersion: "freestyle-15x15-v1",
    sources: [
      "https://brainking.com/en/GameRules?tp=9",
      "https://www.renju.se/rif/rifrules.htm",
      "https://en.wikipedia.org/wiki/Gomoku"
    ],
    initialStates: {
      empty: {
        phase: "placing",
        currentPlayerId: "p1",
        nextColor: "B"
      },
      midgame: {
        phase: "placing",
        currentPlayerId: "p1",
        nextColor: "B",
        stonesPlaced: 24
      },
      almost_full: {
        phase: "placing",
        currentPlayerId: "p2",
        nextColor: "W",
        emptyCells: 1
      }
    },
    normal: [
      {
        title: "Black opens at center",
        description: "First move on empty board.",
        initialStateRef: "empty",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 7, y: 7 },
        accepted: true,
        terminalPhase: "placing",
        winners: [],
        assertions: ["board[7][7] == B"]
      },
      {
        title: "White responds adjacent",
        description: "Second player legal move.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 8, y: 7 },
        accepted: true,
        terminalPhase: "placing",
        winners: [],
        assertions: ["turn passes to white"]
      },
      {
        title: "Horizontal five-in-row win",
        description: "Black completes a horizontal line.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 10, y: 7, createLine: "horizontal" },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["winnerColor == B"]
      },
      {
        title: "Vertical five-in-row win",
        description: "Black completes a vertical line.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 5, y: 10, createLine: "vertical" },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["winnerColor == B"]
      },
      {
        title: "Descending diagonal win",
        description: "Black wins on main diagonal direction.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 9, y: 9, createLine: "diag_down" },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["diagonal win detected"]
      },
      {
        title: "Ascending diagonal win",
        description: "Black wins on anti-diagonal direction.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 9, y: 5, createLine: "diag_up" },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["anti-diagonal win detected"]
      },
      {
        title: "No-win move passes turn",
        description: "A legal move without terminal line.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 4, y: 6 },
        accepted: true,
        terminalPhase: "placing",
        winners: [],
        assertions: ["nextColor toggles"]
      },
      {
        title: "Resign action ends game",
        description: "Player resignation handled as terminal.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "RESIGN",
        payload: {},
        accepted: true,
        terminalPhase: "finished",
        winners: ["p2"],
        assertions: ["status finished on resign"]
      },
      {
        title: "Draw accepted proposal",
        description: "Optional draw path for tournament handling.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "REQUEST_DRAW",
        payload: { acceptedByOpponent: true },
        accepted: true,
        terminalPhase: "finished",
        winners: [],
        assertions: ["game result draw"]
      },
      {
        title: "Last move fills board and wins",
        description: "Final empty cell forms winning line.",
        initialStateRef: "almost_full",
        actorId: "p2",
        type: "PLACE_STONE",
        payload: { x: 14, y: 14, createLine: "horizontal" },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p2"],
        assertions: ["win takes precedence over draw"]
      }
    ],
    illegal: [
      {
        title: "Place on occupied point",
        description: "Cannot place on non-empty intersection.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 7, y: 7, occupied: true },
        accepted: false,
        reasonCode: "CELL_OCCUPIED",
        terminalPhase: "placing",
        winners: [],
        assertions: ["board unchanged"]
      },
      {
        title: "X out of range negative",
        description: "Coordinates must be >= 0.",
        initialStateRef: "empty",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: -1, y: 4 },
        accepted: false,
        reasonCode: "OUT_OF_BOUNDS",
        terminalPhase: "placing",
        winners: [],
        assertions: ["board unchanged"]
      },
      {
        title: "Y out of range above max",
        description: "Coordinates must be <= 14.",
        initialStateRef: "empty",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 4, y: 15 },
        accepted: false,
        reasonCode: "OUT_OF_BOUNDS",
        terminalPhase: "placing",
        winners: [],
        assertions: ["board unchanged"]
      },
      {
        title: "Out-of-turn move",
        description: "Only current player can place stone.",
        initialStateRef: "empty",
        actorId: "p2",
        type: "PLACE_STONE",
        payload: { x: 7, y: 7 },
        accepted: false,
        reasonCode: "NOT_PLAYER_TURN",
        terminalPhase: "placing",
        winners: [],
        assertions: ["current player remains p1"]
      },
      {
        title: "Move after finished game",
        description: "Terminal game disallows placement.",
        initialStateRef: "almost_full",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 0, y: 0, forceFinished: true },
        accepted: false,
        reasonCode: "MATCH_FINISHED",
        terminalPhase: "finished",
        winners: ["p2"],
        assertions: ["no additional move history"]
      },
      {
        title: "Draw request by non-turn player",
        description: "Protocol requires active player request.",
        initialStateRef: "midgame",
        actorId: "p2",
        type: "REQUEST_DRAW",
        payload: {},
        accepted: false,
        reasonCode: "NOT_PLAYER_TURN",
        terminalPhase: "placing",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Duplicate sequence number",
        description: "Server rejects replayed seq in live match.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 1, y: 1, duplicateSeq: true },
        accepted: false,
        reasonCode: "SEQ_CONFLICT",
        terminalPhase: "placing",
        winners: [],
        assertions: ["version unchanged"]
      },
      {
        title: "Invalid payload type",
        description: "Coordinates must be integers.",
        initialStateRef: "empty",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: "7", y: 7 },
        accepted: false,
        reasonCode: "INVALID_PAYLOAD",
        terminalPhase: "placing",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Resign after game already finished",
        description: "Terminal action should be rejected.",
        initialStateRef: "almost_full",
        actorId: "p2",
        type: "RESIGN",
        payload: { forceFinished: true },
        accepted: false,
        reasonCode: "MATCH_FINISHED",
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["result unchanged"]
      },
      {
        title: "Place stone with mismatched color assignment",
        description: "Actor color must match nextColor.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 3, y: 3, forceColor: "W" },
        accepted: false,
        reasonCode: "COLOR_MISMATCH",
        terminalPhase: "placing",
        winners: [],
        assertions: ["state unchanged"]
      }
    ],
    edge: [
      {
        title: "Overline counts as win in freestyle",
        description: "Line of 6 still valid win.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 11, y: 7, createLine: "overline" },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["overline accepted"]
      },
      {
        title: "Single move creates two lines",
        description: "Double threat line still one immediate win.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 8, y: 8, createLine: "double" },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["win once regardless of line count"]
      },
      {
        title: "Final cell without five is draw",
        description: "Board full and no line results draw.",
        initialStateRef: "almost_full",
        actorId: "p2",
        type: "PLACE_STONE",
        payload: { x: 14, y: 14, createLine: "none" },
        accepted: true,
        terminalPhase: "finished",
        winners: [],
        assertions: ["draw state emitted"]
      },
      {
        title: "Corner placement starts line",
        description: "Edge coordinates are valid intersections.",
        initialStateRef: "empty",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 0, y: 0 },
        accepted: true,
        terminalPhase: "placing",
        winners: [],
        assertions: ["corner accepted"]
      },
      {
        title: "Boundary overline at edge",
        description: "Long line touching border detected.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 14, y: 10, createLine: "edge_overline" },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["scan handles boundaries"]
      },
      {
        title: "Attempt move with very high seq gap",
        description: "Seq gaps are accepted if monotonic in offline replay.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 6, y: 6, seqGap: 100 },
        accepted: true,
        terminalPhase: "placing",
        winners: [],
        assertions: ["monotonic seq accepted"]
      },
      {
        title: "Reject stale idempotency key replay",
        description: "Duplicate action idempotency in same match rejected.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 6, y: 7, duplicateIdempotency: true },
        accepted: false,
        reasonCode: "IDEMPOTENCY_REPLAY",
        terminalPhase: "placing",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Resign before any move",
        description: "Immediate resignation legal in opening.",
        initialStateRef: "empty",
        actorId: "p1",
        type: "RESIGN",
        payload: {},
        accepted: true,
        terminalPhase: "finished",
        winners: ["p2"],
        assertions: ["winner assigned to opponent"]
      },
      {
        title: "Draw request declined",
        description: "Declined draw keeps game active.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "REQUEST_DRAW",
        payload: { acceptedByOpponent: false },
        accepted: true,
        terminalPhase: "placing",
        winners: [],
        assertions: ["phase remains placing"]
      },
      {
        title: "Attempt placement on synthetic invalid board shape",
        description: "Validator rejects malformed board dimensions.",
        initialStateRef: "midgame",
        actorId: "p1",
        type: "PLACE_STONE",
        payload: { x: 4, y: 4, malformedBoard: true },
        accepted: false,
        reasonCode: "INVALID_STATE",
        terminalPhase: "placing",
        winners: [],
        assertions: ["error emitted for invalid state"]
      }
    ]
  };
}

function gostopConfig(): GameVectorConfig {
  return {
    gameId: "gostop",
    rulesetVersion: "kr-gostop-core-v1",
    sources: [
      "https://en.wikipedia.org/wiki/Go-Stop",
      "https://ko.wikipedia.org/wiki/%EA%B3%A0%EC%8A%A4%ED%86%B1",
      "https://www.pagat.com/fishing/gostop.html"
    ],
    initialStates: {
      mode_3p_opening: {
        phase: "main_turn",
        mode: "gostop_3p",
        currentPlayerId: "p1",
        turnStage: "play_hand"
      },
      mode_2p_mid: {
        phase: "main_turn",
        mode: "matgo_2p",
        currentPlayerId: "p2",
        turnStage: "play_hand"
      },
      scoring_decision: {
        phase: "score_decision",
        mode: "gostop_3p",
        currentPlayerId: "p1",
        scoreP1: 7
      }
    },
    normal: [
      {
        title: "Play matching month and capture",
        description: "Single-match capture from table.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "PLAY_HAND_CARD",
        payload: { cardId: "jan-ribbon", matchingTableCardId: "jan-junk" },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["captured cards count for p1 increases"]
      },
      {
        title: "Play non-matching card to table",
        description: "No match places card on table.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "PLAY_HAND_CARD",
        payload: { cardId: "apr-animal", noMatch: true },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["table card count increases by 1"]
      },
      {
        title: "Choose capture target among two matches",
        description: "Player chooses one when multiple same-month options exist.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "CHOOSE_CAPTURE_TARGET",
        payload: { fromTableCardId: "aug-junk-2" },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["selected table card removed"]
      },
      {
        title: "Draw card and resolve immediate capture",
        description: "Post-play draw path captures matching month.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "DRAW_FROM_PILE",
        payload: { forcedCardId: "nov-bright", matchingTableCardId: "nov-junk" },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["draw pile decremented"]
      },
      {
        title: "Enter score decision at threshold",
        description: "Score reaches go/stop threshold.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "PLAY_HAND_CARD",
        payload: { cardId: "bird-ribbon", scoreAfter: 7 },
        accepted: true,
        terminalPhase: "score_decision",
        winners: [],
        assertions: ["turnStage transitions to score_decision"]
      },
      {
        title: "Declare GO and continue",
        description: "Player chooses go after threshold.",
        initialStateRef: "scoring_decision",
        actorId: "p1",
        type: "DECLARE_GO",
        payload: {},
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["goCount for p1 increments"]
      },
      {
        title: "Declare STOP and finish",
        description: "Player ends match and receives payout.",
        initialStateRef: "scoring_decision",
        actorId: "p1",
        type: "DECLARE_STOP",
        payload: {},
        accepted: true,
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["status finished"]
      },
      {
        title: "Matgo two-player alternating turn",
        description: "Turn passes correctly in two-player mode.",
        initialStateRef: "mode_2p_mid",
        actorId: "p2",
        type: "PLAY_HAND_CARD",
        payload: { cardId: "sep-animal" },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["current player rotates to p1"]
      },
      {
        title: "Resign action",
        description: "Resignation ends match immediately.",
        initialStateRef: "mode_2p_mid",
        actorId: "p2",
        type: "RESIGN",
        payload: {},
        accepted: true,
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["winner is remaining player"]
      },
      {
        title: "Pile exhaustion settlement",
        description: "Game settles when pile exhausted and stop condition met.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "DRAW_FROM_PILE",
        payload: { forcePileExhaustion: true },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p3"],
        assertions: ["final payout computed"]
      }
    ],
    illegal: [
      {
        title: "Play card not in hand",
        description: "Hand ownership violation.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "PLAY_HAND_CARD",
        payload: { cardId: "not-owned-card" },
        accepted: false,
        reasonCode: "CARD_NOT_IN_HAND",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["hand unchanged"]
      },
      {
        title: "Capture target without match",
        description: "Target must match played/drawn month.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "CHOOSE_CAPTURE_TARGET",
        payload: { fromTableCardId: "invalid-month-card" },
        accepted: false,
        reasonCode: "INVALID_CAPTURE_TARGET",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["table unchanged"]
      },
      {
        title: "Draw from pile in wrong stage",
        description: "Cannot draw before play-hand resolution.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "DRAW_FROM_PILE",
        payload: { wrongStage: true },
        accepted: false,
        reasonCode: "STAGE_VIOLATION",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["turnStage unchanged"]
      },
      {
        title: "Declare GO outside decision phase",
        description: "Go only in score decision stage.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "DECLARE_GO",
        payload: {},
        accepted: false,
        reasonCode: "NOT_IN_SCORE_DECISION",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["goCount unchanged"]
      },
      {
        title: "Declare STOP below threshold",
        description: "Stop requires threshold score.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "DECLARE_STOP",
        payload: { scoreP1: 5 },
        accepted: false,
        reasonCode: "SCORE_BELOW_THRESHOLD",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["match remains active"]
      },
      {
        title: "Act out of turn",
        description: "Only current player can play.",
        initialStateRef: "mode_2p_mid",
        actorId: "p1",
        type: "PLAY_HAND_CARD",
        payload: { cardId: "oct-junk" },
        accepted: false,
        reasonCode: "NOT_PLAYER_TURN",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["current player remains p2"]
      },
      {
        title: "Choose capture before playing hand card",
        description: "No pending capture choice exists.",
        initialStateRef: "mode_2p_mid",
        actorId: "p2",
        type: "CHOOSE_CAPTURE_TARGET",
        payload: { fromTableCardId: "may-junk" },
        accepted: false,
        reasonCode: "NO_CAPTURE_PENDING",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Duplicate action sequence",
        description: "Replay of already committed action rejected.",
        initialStateRef: "mode_2p_mid",
        actorId: "p2",
        type: "PLAY_HAND_CARD",
        payload: { cardId: "jun-ribbon", duplicateSeq: true },
        accepted: false,
        reasonCode: "SEQ_CONFLICT",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["version unchanged"]
      },
      {
        title: "Resign after finish",
        description: "No action after terminal state.",
        initialStateRef: "scoring_decision",
        actorId: "p1",
        type: "RESIGN",
        payload: { forceFinished: true },
        accepted: false,
        reasonCode: "MATCH_FINISHED",
        terminalPhase: "finished",
        winners: ["p2"],
        assertions: ["state unchanged"]
      },
      {
        title: "Invalid mode-specific payload",
        description: "Matgo-only option used in 3-player mode.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "PLAY_HAND_CARD",
        payload: { cardId: "jan-junk", matgoOnlyMultiplier: true },
        accepted: false,
        reasonCode: "MODE_RULE_VIOLATION",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["invalid branch rejected"]
      }
    ],
    edge: [
      {
        title: "Multiple table matches deterministic fallback",
        description: "Auto-select lowest id when no explicit choice in bot mode.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "PLAY_HAND_CARD",
        payload: { cardId: "mar-junk", autoResolveMultiMatch: true },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["lowest table card chosen"]
      },
      {
        title: "Score jumps across threshold",
        description: "Large event can skip directly to decision stage.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "DRAW_FROM_PILE",
        payload: { forceComboScoreGain: 3, scoreBefore: 5 },
        accepted: true,
        terminalPhase: "score_decision",
        winners: [],
        assertions: ["score decision triggered immediately"]
      },
      {
        title: "Go count multiplier stacking",
        description: "Multiple GO declarations increase payout multiplier.",
        initialStateRef: "scoring_decision",
        actorId: "p1",
        type: "DECLARE_GO",
        payload: { priorGoCount: 2 },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["goCount becomes 3"]
      },
      {
        title: "Stop after multiple GO",
        description: "Final stop includes go multiplier.",
        initialStateRef: "scoring_decision",
        actorId: "p1",
        type: "DECLARE_STOP",
        payload: { priorGoCount: 2 },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["payout includes go multiplier"]
      },
      {
        title: "Draw pile empties mid-turn",
        description: "Turn gracefully resolves without additional draw.",
        initialStateRef: "mode_2p_mid",
        actorId: "p2",
        type: "DRAW_FROM_PILE",
        payload: { pileSizeBefore: 0 },
        accepted: false,
        reasonCode: "PILE_EMPTY",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["no draw event emitted"]
      },
      {
        title: "Mode switch forbidden mid-match",
        description: "Cannot swap mode between matgo and gostop during game.",
        initialStateRef: "mode_2p_mid",
        actorId: "p2",
        type: "ADMIN_SET_MODE",
        payload: { mode: "gostop_3p" },
        accepted: false,
        reasonCode: "IMMUTABLE_MATCH_MODE",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["mode remains matgo_2p"]
      },
      {
        title: "Out-of-turn go decision request",
        description: "Another player cannot decide go/stop for scorer.",
        initialStateRef: "scoring_decision",
        actorId: "p2",
        type: "DECLARE_GO",
        payload: {},
        accepted: false,
        reasonCode: "NOT_PLAYER_TURN",
        terminalPhase: "score_decision",
        winners: [],
        assertions: ["decision owner remains p1"]
      },
      {
        title: "Matgo opening deal cardinality",
        description: "Each player should start with 10 cards.",
        initialStateRef: "mode_2p_mid",
        actorId: "p2",
        type: "VALIDATE_DEAL",
        payload: {},
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["hand size per player == 10 at deal"]
      },
      {
        title: "Reject malformed card id",
        description: "Card id must map to known hwatu deck.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "PLAY_HAND_CARD",
        payload: { cardId: "unknown-card-id" },
        accepted: false,
        reasonCode: "UNKNOWN_CARD_ID",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Final tie settlement deterministic ordering",
        description: "If payout tie occurs, deterministic placement order applied.",
        initialStateRef: "mode_3p_opening",
        actorId: "p1",
        type: "FORCE_SETTLEMENT",
        payload: { tieSettlement: true },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["tie settlement deterministic"]
      }
    ]
  };
}

function catanConfig(): GameVectorConfig {
  return {
    gameId: "catan",
    rulesetVersion: "catan-base-2025-secure-rulebook",
    sources: [
      "https://www.catan.com/understand-catan/game-rules",
      "https://www.catan.com/sites/default/files/2025-03/CN3081%20CATAN%E2%80%93The%20Game%20Rulebook%20secure%20%281%29.pdf",
      "https://www.catan.com"
    ],
    initialStates: {
      setup_snake: {
        phase: "setup",
        turnStage: "setup_place_settlement_road",
        currentPlayerId: "p1"
      },
      main_turn: {
        phase: "main_turn",
        turnStage: "roll_or_play_knight",
        currentPlayerId: "p2"
      },
      robber_flow: {
        phase: "main_turn",
        turnStage: "robber_discard",
        currentPlayerId: "p3"
      }
    },
    normal: [
      {
        title: "Place first setup settlement",
        description: "Opening setup placement by p1.",
        initialStateRef: "setup_snake",
        actorId: "p1",
        type: "PLACE_SETUP_SETTLEMENT",
        payload: { intersectionId: "i-14" },
        accepted: true,
        terminalPhase: "setup",
        winners: [],
        assertions: ["settlement owner set to p1"]
      },
      {
        title: "Place setup road connected to settlement",
        description: "Road must connect new settlement.",
        initialStateRef: "setup_snake",
        actorId: "p1",
        type: "PLACE_SETUP_ROAD",
        payload: { edgeId: "e-14-15" },
        accepted: true,
        terminalPhase: "setup",
        winners: [],
        assertions: ["road owner set to p1"]
      },
      {
        title: "Roll dice at turn start",
        description: "Valid roll action in roll stage.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "ROLL_DICE",
        payload: { forcedRoll: 8 },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["resource distribution executed"]
      },
      {
        title: "Build road with resources",
        description: "Road placement in main actions stage.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "BUILD_ROAD",
        payload: { edgeId: "e-33-34" },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["brick and lumber deducted"]
      },
      {
        title: "Build settlement on valid vertex",
        description: "Distance rule and connection respected.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "BUILD_SETTLEMENT",
        payload: { intersectionId: "i-35" },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["victory points +1"]
      },
      {
        title: "Upgrade settlement to city",
        description: "City upgrade of own settlement.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "UPGRADE_TO_CITY",
        payload: { intersectionId: "i-35" },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["victory points net +1"]
      },
      {
        title: "Buy development card",
        description: "Draw top card from development deck.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "BUY_DEVELOPMENT_CARD",
        payload: {},
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["dev card count increases"]
      },
      {
        title: "Trade with bank 4:1",
        description: "Valid maritime trade.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "TRADE_WITH_BANK",
        payload: { give: { wool: 4 }, receive: { ore: 1 } },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["bank/resources adjusted"]
      },
      {
        title: "Move robber after rolling 7",
        description: "Robber relocation and steal flow.",
        initialStateRef: "robber_flow",
        actorId: "p3",
        type: "MOVE_ROBBER",
        payload: { targetHexId: "h-11" },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["robber hex updated"]
      },
      {
        title: "End turn at 10 VP wins immediately",
        description: "Victory checked at end of action sequence.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "END_TURN",
        payload: { forceVp: 10 },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p2"],
        assertions: ["match ends on vp threshold"]
      }
    ],
    illegal: [
      {
        title: "Build road not connected",
        description: "Road must connect own network.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "BUILD_ROAD",
        payload: { edgeId: "disconnected-edge" },
        accepted: false,
        reasonCode: "ROAD_NOT_CONNECTED",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Build settlement adjacent to another",
        description: "Distance rule violation.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "BUILD_SETTLEMENT",
        payload: { intersectionId: "adjacent-occupied" },
        accepted: false,
        reasonCode: "SETTLEMENT_DISTANCE_RULE",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Upgrade non-owned settlement",
        description: "Only own settlement can be upgraded.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "UPGRADE_TO_CITY",
        payload: { intersectionId: "p1-settlement" },
        accepted: false,
        reasonCode: "NOT_OWNER",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Roll dice twice",
        description: "Only one roll per turn.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "ROLL_DICE",
        payload: { alreadyRolled: true },
        accepted: false,
        reasonCode: "ALREADY_ROLLED",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["no second distribution"]
      },
      {
        title: "Play dev card bought same turn",
        description: "Cannot play newly bought non-VP card immediately.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "PLAY_DEVELOPMENT_CARD",
        payload: { cardType: "KNIGHT", boughtThisTurn: true },
        accepted: false,
        reasonCode: "DEV_CARD_COOLDOWN",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["card remains unplayed"]
      },
      {
        title: "Trade with bank without ratio",
        description: "Missing required ratio/port benefit.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "TRADE_WITH_BANK",
        payload: { give: { grain: 3 }, receive: { ore: 1 } },
        accepted: false,
        reasonCode: "INVALID_TRADE_RATIO",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["resources unchanged"]
      },
      {
        title: "Move robber to same hex",
        description: "Robber must change location.",
        initialStateRef: "robber_flow",
        actorId: "p3",
        type: "MOVE_ROBBER",
        payload: { targetHexId: "current-robber-hex" },
        accepted: false,
        reasonCode: "ROBBER_SAME_HEX",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["robber position unchanged"]
      },
      {
        title: "Skip mandatory discard on 7",
        description: "Cannot bypass discard stage.",
        initialStateRef: "robber_flow",
        actorId: "p3",
        type: "MOVE_ROBBER",
        payload: { pendingDiscardPlayers: ["p1"] },
        accepted: false,
        reasonCode: "DISCARD_PENDING",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["stage remains robber_discard"]
      },
      {
        title: "End turn before roll",
        description: "Main turn must start with roll or knight.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "END_TURN",
        payload: { rolled: false },
        accepted: false,
        reasonCode: "ROLL_REQUIRED",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["turn not advanced"]
      },
      {
        title: "Action by non-current player",
        description: "Turn ownership violation.",
        initialStateRef: "main_turn",
        actorId: "p1",
        type: "BUILD_ROAD",
        payload: { edgeId: "e-12-13" },
        accepted: false,
        reasonCode: "NOT_PLAYER_TURN",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      }
    ],
    edge: [
      {
        title: "Longest road tie keeps current owner",
        description: "Tie length does not transfer card.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "BUILD_ROAD",
        payload: { edgeId: "tie-edge", resultingLongest: 7, challengerAlso7: true },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["longest road owner unchanged"]
      },
      {
        title: "Largest army overtakes at 3+",
        description: "Knight play updates largest army owner.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "PLAY_DEVELOPMENT_CARD",
        payload: { cardType: "KNIGHT", knightsPlayed: 3 },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["largest army owner set to p2"]
      },
      {
        title: "Bank resource depletion partial payout",
        description: "No one receives resource if bank lacks total needed.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "ROLL_DICE",
        payload: { forcedRoll: 6, bankInsufficientResource: "brick" },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["insufficient resource not distributed"]
      },
      {
        title: "Robber steal from single victim card",
        description: "Random steal deterministic with one card only.",
        initialStateRef: "robber_flow",
        actorId: "p3",
        type: "STEAL_RANDOM_CARD",
        payload: { victimId: "p1", victimHandSize: 1 },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["steal transfers the only card"]
      },
      {
        title: "Development deck empty on buy",
        description: "Buying dev card fails when deck exhausted.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "BUY_DEVELOPMENT_CARD",
        payload: { devDeckRemaining: 0 },
        accepted: false,
        reasonCode: "DEV_DECK_EMPTY",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["resources not consumed"]
      },
      {
        title: "Setup snake order reverse pass",
        description: "Second placement order reverses correctly.",
        initialStateRef: "setup_snake",
        actorId: "p4",
        type: "PLACE_SETUP_SETTLEMENT",
        payload: { secondPlacementRound: true },
        accepted: true,
        terminalPhase: "setup",
        winners: [],
        assertions: ["turn order reversed in second round"]
      },
      {
        title: "Port trade 2:1 specialization",
        description: "Player with correct port uses 2:1 ratio.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "TRADE_WITH_BANK",
        payload: { give: { ore: 2 }, receive: { wool: 1 }, portType: "ore_2_1" },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["2:1 port ratio applied"]
      },
      {
        title: "Reject port trade without ownership",
        description: "Cannot use port ratio without settlement/city at port.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "TRADE_WITH_BANK",
        payload: { give: { ore: 2 }, receive: { wool: 1 }, portType: "ore_2_1", ownsPort: false },
        accepted: false,
        reasonCode: "PORT_NOT_OWNED",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["trade rejected"]
      },
      {
        title: "Exact 10 VP mid-turn immediate win",
        description: "Win should trigger without requiring end_turn action.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "BUILD_SETTLEMENT",
        payload: { intersectionId: "vp-win-node", forceVpAfterBuild: 10 },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p2"],
        assertions: ["game ends immediately on reaching 10"]
      },
      {
        title: "Reject stale idempotency action replay",
        description: "Duplicate idempotency key should not mutate state twice.",
        initialStateRef: "main_turn",
        actorId: "p2",
        type: "BUILD_ROAD",
        payload: { edgeId: "e-39-40", duplicateIdempotency: true },
        accepted: false,
        reasonCode: "IDEMPOTENCY_REPLAY",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged on replay"]
      }
    ]
  };
}

function azulConfig(): GameVectorConfig {
  return {
    gameId: "azul",
    rulesetVersion: "azul-base-2024-next-move",
    sources: [
      "https://cdn.svc.asmodee.net/production-nextmove/uploads/2024/07/NM6010_azul-rules.pdf",
      "https://www.planbgames.com/en/boardgames/azul/",
      "https://www.rulespal.com/azul/rulebook"
    ],
    initialStates: {
      round_draft: {
        phase: "main_turn",
        turnStage: "draft",
        currentPlayerId: "p1"
      },
      wall_tiling: {
        phase: "main_turn",
        turnStage: "wall_tiling",
        currentPlayerId: "p2"
      },
      end_check: {
        phase: "main_turn",
        turnStage: "round_end",
        currentPlayerId: "p3"
      }
    },
    normal: [
      {
        title: "Take color from factory",
        description: "Selected color moved to pattern line/floor; leftovers to center.",
        initialStateRef: "round_draft",
        actorId: "p1",
        type: "TAKE_FROM_FACTORY",
        payload: { factoryIndex: 0, color: "blue", targetLine: 2 },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["factory emptied for selected color"]
      },
      {
        title: "Take color from center",
        description: "Center draft without factory source.",
        initialStateRef: "round_draft",
        actorId: "p2",
        type: "TAKE_FROM_CENTER",
        payload: { color: "red", targetLine: 1 },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["center tiles reduced for red"]
      },
      {
        title: "First center taker gets token",
        description: "First player token assigned on first center draft.",
        initialStateRef: "round_draft",
        actorId: "p3",
        type: "TAKE_FROM_CENTER",
        payload: { color: "yellow", targetLine: 0, firstTakeFromCenter: true },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["first-player token assigned to p3"]
      },
      {
        title: "Overflow to floor line",
        description: "Excess drafted tiles move to floor.",
        initialStateRef: "round_draft",
        actorId: "p1",
        type: "TAKE_FROM_FACTORY",
        payload: { factoryIndex: 2, color: "black", targetLine: 1, overflow: true },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["overflow tiles placed on floor line"]
      },
      {
        title: "Draft depletion transitions to wall tiling",
        description: "When no selectable tiles remain, phase switches.",
        initialStateRef: "round_draft",
        actorId: "p4",
        type: "TAKE_FROM_CENTER",
        payload: { color: "white", targetLine: 4, finalDraftPick: true },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["turnStage becomes wall_tiling"]
      },
      {
        title: "Apply wall tiling scoring",
        description: "One tile placed from each full pattern line and scored.",
        initialStateRef: "wall_tiling",
        actorId: "p2",
        type: "APPLY_WALL_TILING",
        payload: {},
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["score updated by adjacency"]
      },
      {
        title: "Floor penalties applied and score clamped",
        description: "Negative floor penalties reduce score but not below 0.",
        initialStateRef: "wall_tiling",
        actorId: "p2",
        type: "APPLY_WALL_TILING",
        payload: { floorTiles: 5, scoreBefore: 2 },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["score clamped to minimum 0"]
      },
      {
        title: "End round refills factories",
        description: "Factories filled from bag/discard at round end.",
        initialStateRef: "end_check",
        actorId: "p3",
        type: "END_ROUND",
        payload: {},
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["factories repopulated"]
      },
      {
        title: "Game end trigger on completed row",
        description: "A complete horizontal row triggers final scoring.",
        initialStateRef: "end_check",
        actorId: "p3",
        type: "END_ROUND",
        payload: { rowCompleted: true },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p3"],
        assertions: ["final bonuses applied"]
      },
      {
        title: "Resign action",
        description: "Player resignation ends game.",
        initialStateRef: "round_draft",
        actorId: "p1",
        type: "RESIGN",
        payload: {},
        accepted: true,
        terminalPhase: "finished",
        winners: ["p2"],
        assertions: ["resignation handled"]
      }
    ],
    illegal: [
      {
        title: "Take color not present in factory",
        description: "Selected color must exist in source factory.",
        initialStateRef: "round_draft",
        actorId: "p1",
        type: "TAKE_FROM_FACTORY",
        payload: { factoryIndex: 1, color: "blue", factoryHasBlue: false, targetLine: 2 },
        accepted: false,
        reasonCode: "COLOR_NOT_IN_SOURCE",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Take color not present in center",
        description: "Selected color missing in center pool.",
        initialStateRef: "round_draft",
        actorId: "p1",
        type: "TAKE_FROM_CENTER",
        payload: { color: "red", centerHasRed: false, targetLine: 2 },
        accepted: false,
        reasonCode: "COLOR_NOT_IN_SOURCE",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Target line with conflicting color",
        description: "Pattern line color must match existing line color.",
        initialStateRef: "round_draft",
        actorId: "p1",
        type: "TAKE_FROM_FACTORY",
        payload: { factoryIndex: 0, color: "yellow", targetLine: 3, lineColor: "blue" },
        accepted: false,
        reasonCode: "PATTERN_LINE_COLOR_CONFLICT",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["line unchanged"]
      },
      {
        title: "Target line already full",
        description: "Cannot place tiles into full pattern line.",
        initialStateRef: "round_draft",
        actorId: "p1",
        type: "TAKE_FROM_FACTORY",
        payload: { factoryIndex: 4, color: "black", targetLine: 2, lineFull: true },
        accepted: false,
        reasonCode: "PATTERN_LINE_FULL",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Color already in corresponding wall row slot",
        description: "Cannot stage color already placed in target row.",
        initialStateRef: "round_draft",
        actorId: "p1",
        type: "TAKE_FROM_FACTORY",
        payload: { factoryIndex: 3, color: "white", targetLine: 4, colorAlreadyOnWallRow: true },
        accepted: false,
        reasonCode: "WALL_ROW_COLOR_EXISTS",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Draft action during wall tiling",
        description: "Draft actions forbidden outside draft stage.",
        initialStateRef: "wall_tiling",
        actorId: "p2",
        type: "TAKE_FROM_CENTER",
        payload: { color: "red", targetLine: 0 },
        accepted: false,
        reasonCode: "STAGE_VIOLATION",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["stage unchanged"]
      },
      {
        title: "Wall tiling action during draft",
        description: "Wall tiling only after draft depletion.",
        initialStateRef: "round_draft",
        actorId: "p1",
        type: "APPLY_WALL_TILING",
        payload: {},
        accepted: false,
        reasonCode: "STAGE_VIOLATION",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "End round before wall tiling complete",
        description: "Cannot end round while pending wall updates.",
        initialStateRef: "wall_tiling",
        actorId: "p2",
        type: "END_ROUND",
        payload: { pendingPlayers: ["p3"] },
        accepted: false,
        reasonCode: "WALL_TILING_PENDING",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["round not advanced"]
      },
      {
        title: "Action out of turn",
        description: "Only current player can draft.",
        initialStateRef: "round_draft",
        actorId: "p3",
        type: "TAKE_FROM_FACTORY",
        payload: { factoryIndex: 2, color: "blue", targetLine: 1 },
        accepted: false,
        reasonCode: "NOT_PLAYER_TURN",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["current player unchanged"]
      },
      {
        title: "Action after game finished",
        description: "No post-terminal actions allowed.",
        initialStateRef: "end_check",
        actorId: "p3",
        type: "TAKE_FROM_CENTER",
        payload: { color: "yellow", targetLine: 0, forceFinished: true },
        accepted: false,
        reasonCode: "MATCH_FINISHED",
        terminalPhase: "finished",
        winners: ["p1"],
        assertions: ["state unchanged"]
      }
    ],
    edge: [
      {
        title: "Bag empty uses discard refill",
        description: "Factory refill shuffles discard into bag.",
        initialStateRef: "end_check",
        actorId: "p3",
        type: "END_ROUND",
        payload: { bagEmpty: true, discardCount: 23 },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["bag refilled from discard"]
      },
      {
        title: "Insufficient tiles after refill",
        description: "Factories can have fewer than 4 tiles near game end.",
        initialStateRef: "end_check",
        actorId: "p3",
        type: "END_ROUND",
        payload: { bagAndDiscardTotal: 6 },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["partial factory fill handled"]
      },
      {
        title: "Center only first-player token remains",
        description: "Draft ends when no colored tiles remain.",
        initialStateRef: "round_draft",
        actorId: "p4",
        type: "TAKE_FROM_FACTORY",
        payload: { factoryIndex: 0, color: "black", targetLine: 4, leavesOnlyToken: true },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["turnStage transitions to wall_tiling"]
      },
      {
        title: "Penalty overrun below zero score",
        description: "Score cannot drop below zero.",
        initialStateRef: "wall_tiling",
        actorId: "p2",
        type: "APPLY_WALL_TILING",
        payload: { scoreBefore: 1, floorTiles: 7, noPlacements: true },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["score equals 0"]
      },
      {
        title: "Final scoring tie",
        description: "Tie on final score results shared winners.",
        initialStateRef: "end_check",
        actorId: "p3",
        type: "END_ROUND",
        payload: { rowCompleted: true, forceTie: true },
        accepted: true,
        terminalPhase: "finished",
        winners: ["p1", "p3"],
        assertions: ["multiple winners allowed"]
      },
      {
        title: "Reject invalid factory index",
        description: "Factory index must be in configured range.",
        initialStateRef: "round_draft",
        actorId: "p1",
        type: "TAKE_FROM_FACTORY",
        payload: { factoryIndex: 99, color: "blue", targetLine: 0 },
        accepted: false,
        reasonCode: "INVALID_FACTORY_INDEX",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Take all color from center with overflow",
        description: "All same-color tiles moved from center, overflow to floor.",
        initialStateRef: "round_draft",
        actorId: "p2",
        type: "TAKE_FROM_CENTER",
        payload: { color: "blue", targetLine: 0, overflow: true },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["all blue removed from center"]
      },
      {
        title: "First-player token penalty applied",
        description: "Token moved to floor and incurs penalty.",
        initialStateRef: "wall_tiling",
        actorId: "p2",
        type: "APPLY_WALL_TILING",
        payload: { hasFirstPlayerToken: true },
        accepted: true,
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["first-player token penalty counted"]
      },
      {
        title: "Reject idempotent replay",
        description: "Duplicate idempotency key should not mutate state twice.",
        initialStateRef: "round_draft",
        actorId: "p1",
        type: "TAKE_FROM_FACTORY",
        payload: { factoryIndex: 1, color: "white", targetLine: 1, duplicateIdempotency: true },
        accepted: false,
        reasonCode: "IDEMPOTENCY_REPLAY",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["state unchanged"]
      },
      {
        title: "Malformed board row metadata",
        description: "Validator catches invalid pattern line capacities.",
        initialStateRef: "round_draft",
        actorId: "p1",
        type: "TAKE_FROM_CENTER",
        payload: { color: "black", targetLine: 3, malformedPatternLine: true },
        accepted: false,
        reasonCode: "INVALID_STATE",
        terminalPhase: "main_turn",
        winners: [],
        assertions: ["error emitted"]
      }
    ]
  };
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
