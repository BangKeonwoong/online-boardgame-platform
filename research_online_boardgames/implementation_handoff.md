# Implementation Handoff

## Scope Implemented in This Repository
- Game-agnostic TypeScript contracts for:
  - state/action/reducer interfaces
  - websocket message interfaces
  - persistence record types
  - replay hashing and deterministic playback helper
- Research specs for 5 MVP games:
  - splendor, gomoku, gostop/matgo, catan, azul
- Machine-readable test-vector schema + validation pipeline.

## Build Order for Engineering
1. Implement one runtime per game using `GameRuntime` contract.
2. Build authoritative match service:
   - action sequencing
   - idempotency handling
   - event publication
3. Plug persistence port implementation (DB layer).
4. Add replay API by reading action logs and using `replayActions`.
5. Implement websocket gateway using `ClientMessage`/`ServerEvent`.

## Non-Negotiable Determinism Rules
- Every random outcome must come from server and be logged as part of accepted action effects.
- Reducers must be pure and replay-safe.
- Tie-breakers must be deterministic and documented in game spec.

## Suggested Package Layout (next step)
- `src/server/`
- `src/runtimes/splendor/`
- `src/runtimes/gomoku/`
- `src/runtimes/gostop/`
- `src/runtimes/catan/`
- `src/runtimes/azul/`
- `src/store/postgres/`

## Acceptance Criteria Before Beta
- All vector files pass schema/count validation.
- Replay of golden matches produces stable state hash at each frame.
- Server rejects all illegal vectors with exact reason code.
- Cross-client sync test passes under packet reorder + duplication simulation.
