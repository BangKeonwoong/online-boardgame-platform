# Gomoku Implementation Spec (Freestyle Baseline)

## 1. Ruleset Metadata
- `gameId`: `gomoku`
- `rulesetVersion`: `freestyle-15x15-v1`
- Player count: exactly 2
- Scope: Freestyle gomoku (no Renju forbidden-move rules)
- Win condition: first player to create a contiguous line of 5 or more stones

## 2. Board and Setup
- Board: 15x15 intersections.
- Player order: black first, white second.
- Initial state: empty board.

## 3. State Model (`GameState.payload`)
- `board: ("." | "B" | "W")[][]` (15x15)
- `moveHistory: { x: number; y: number; color: "B" | "W" }[]`
- `nextColor: "B" | "W"`
- `winnerColor: "B" | "W" | null`
- `ruleFlags: { allowOverlineWin: true }`

## 4. Phase Machine
- `placing` -> `finished`
- End conditions:
  - line of >= 5 found after a move
  - board full without winner (`draw`)

## 5. Legal Actions
1. `PLACE_STONE { x: number, y: number }`
2. `REQUEST_DRAW` (optional protocol action)
3. `RESIGN`

## 6. Validation Rules
1. Must be active match and player turn.
2. `x`, `y` must be in range [0, 14].
3. Target intersection must be empty.
4. Color must match `nextColor`.
5. No additional stones allowed after terminal state.

## 7. Win/Draw Evaluation
- After each valid placement, scan 4 directions through last move:
  - horizontal `(1,0)`
  - vertical `(0,1)`
  - diagonal descending `(1,1)`
  - diagonal ascending `(1,-1)`
- Count contiguous stones both directions; if total >= 5 -> win.
- If no win and board is full -> draw.

## 8. Illegal Action Set
- Place on occupied intersection.
- Place out of bounds.
- Move out of turn.
- Duplicate action id/sequence.
- Any action after game finished.

## 9. Real-Time Sync Notes
- Stateless deterministic reducer; no RNG.
- Reconnection can reconstruct exact state from action log.
- Anti-cheat: server enforces one move per valid turn sequence.

## 10. Test Coverage Targets
- 10 normal scenarios: horizontal/vertical/diagonal wins, openings.
- 10 illegal scenarios: occupied/out-of-range/out-of-turn.
- 10 edge scenarios: overline win, last-cell draw, simultaneous threat precedence.

## 11. Sources
- https://brainking.com/en/GameRules?tp=9
- https://www.renju.se/rif/rifrules.htm
- https://en.wikipedia.org/wiki/Gomoku
