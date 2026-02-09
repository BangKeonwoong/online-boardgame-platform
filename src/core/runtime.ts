import type {
  GameAction,
  GameState,
  Reducer,
  ReducerResult,
  RuleValidator,
  ValidationError,
  WinEvaluator
} from "../contracts/types.js";

export interface GameRuntime {
  gameId: GameState["gameId"];
  validate: RuleValidator;
  reduce: Reducer;
  evaluateWin: WinEvaluator;
}

export interface RuntimeApplyResult {
  ok: boolean;
  result?: ReducerResult;
  errors?: ValidationError[];
}

export function applyAction(runtime: GameRuntime, state: GameState, action: GameAction): RuntimeApplyResult {
  const validation = runtime.validate(state, action);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  const reduced = runtime.reduce(state, action);
  const evaluation = runtime.evaluateWin(reduced.nextState);
  if (evaluation.isFinished) {
    reduced.nextState.status = "finished";
    reduced.nextState.winnerIds = evaluation.winnerIds;
    if (evaluation.reason) {
      reduced.emittedEvents.push(`finish:${evaluation.reason}`);
    }
  }

  return { ok: true, result: reduced };
}
