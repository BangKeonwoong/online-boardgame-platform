# Go-Stop / Matgo Implementation Spec (Korean Hwatu)

## 1. Ruleset Metadata
- `gameId`: `gostop`
- `rulesetVersion`: `kr-gostop-core-v1`
- Modes:
  - `gostop_3p` (3 players)
  - `matgo_2p` (2 players)
- Scope:
  - Base capture and scoring categories
  - Go/Stop decision loop
  - Matgo-specific two-player pacing

## 2. Components and Setup
- Deck: 48 hwatu cards (12 months x 4 cards).
- Card categories used for scoring:
  - Bright (`gwang`)
  - Animal (`yeol`)
  - Ribbon (`tti`)
  - Junk (`pi`)
  - Bonus/special cards as configured

### Dealing
- `gostop_3p` default:
  - 7 cards each to players
  - 6 cards to table
  - remainder in draw stack
- `matgo_2p` default:
  - 10 cards each to players
  - 8 cards to table
  - remainder in draw stack

## 3. State Model (`GameState.payload`)
- `mode: "gostop_3p" | "matgo_2p"`
- `tableCards: Card[]`
- `drawPile: Card[]`
- `hands: Record<PlayerId, Card[]>`
- `captured: Record<PlayerId, Card[]>`
- `scores: Record<PlayerId, number>`
- `goCount: Record<PlayerId, number>`
- `turnStage: "play_hand" | "resolve_capture" | "draw_and_resolve" | "score_decision"`
- `lastCapturerId: string | null`
- `stackEvents: StackEvent[]` (bomb/shake/steal tracking)

## 4. Phase Machine
- `deal` -> `main_turn` -> `score_decision` (conditional) -> `main_turn` / `finished`
- `finished` when:
  - player selects STOP at eligible score
  - mode-specific immediate finish triggers
  - draw pile exhausted with no new scoring condition (fallback settlement)

## 5. Legal Actions
1. `PLAY_HAND_CARD { cardId }`
2. `CHOOSE_CAPTURE_TARGET { fromTableCardId }` (when multiple month matches)
3. `DRAW_FROM_PILE`
4. `DECLARE_GO`
5. `DECLARE_STOP`
6. `RESIGN`

## 6. Validation Rules
1. Turn ownership and stage ownership check.
2. Played card must exist in actor hand.
3. Capture choices restricted to matching month logic.
4. Score decision actions only allowed when player score reaches threshold.
5. `DECLARE_STOP` forbidden before minimum stop threshold.

## 7. Core Resolution Algorithm
1. Actor plays 1 card from hand.
2. Resolve table match:
   - 0 match: place played card on table
   - 1 match: capture pair
   - 2+ matches: actor selects capture target (or deterministic default for auto mode)
3. Draw top card from pile and resolve with same match rules.
4. Apply event effects (stacking, stealing, shake/bomb flags when enabled).
5. Recompute score categories from captured cards.
6. If score >= decision threshold, branch to `score_decision`.
7. If `GO`, increment go counter and continue.
8. If `STOP`, end match and compute payout multiplier.

## 8. Scoring Baseline (Configurable Table)
- Bright: 3+ set points by table.
- Animal: 5+ gives base points, each extra adds 1.
- Ribbon: 5+ gives base points, each extra adds 1.
- Junk: 10+ gives base points, each extra adds 1.
- Named ribbon combos (e.g., hongdan/chungdan/chodan) enabled by rule config.
- Multipliers:
  - go-count multiplier
  - opponent low-junk penalty multiplier
  - mode-specific doubling rules

## 9. Matgo Divergences
- Two-player deal distribution.
- Aggressive score threshold and payout multipliers.
- Turn order alternates strictly between two players.

## 10. Illegal Action Set
- Playing card not in hand.
- Choosing non-matching capture target.
- Declaring GO/STOP outside score-decision phase.
- Reusing resolved action sequence.

## 11. Real-Time Sync Notes
- Shuffle and deal must be server-seeded.
- Because of many conditional sub-choices, server emits explicit `requiredFollowUpAction`.
- Replay must include all branch decisions (capture target, go/stop declarations).

## 12. Test Coverage Targets
- 10 normal scenarios: basic captures, scoring escalation, go->stop flow.
- 10 illegal scenarios: invalid capture, premature stop/go, illegal play.
- 10 edge scenarios: pile exhaustion, multi-match ambiguity, multiplier stacking.

## 13. Sources
- https://en.wikipedia.org/wiki/Go-Stop
- https://ko.wikipedia.org/wiki/%EA%B3%A0%EC%8A%A4%ED%86%B1
- https://www.pagat.com/fishing/gostop.html
