# Azul Implementation Spec (Base Game)

## 1. Ruleset Metadata
- `gameId`: `azul`
- `rulesetVersion`: `azul-base-2024-next-move`
- Player count: 2-4
- Scope: Base game only (no variants from expansions/other Azul titles)
- End condition: after wall-tiling round where at least one player completes a horizontal row

## 2. Components and Setup
- 100 tiles in bag: 20 each of 5 colors.
- Factories:
  - 2 players: 5 factories
  - 3 players: 7 factories
  - 4 players: 9 factories
- Each factory receives 4 random tiles.
- Center pool starts with first-player token.

## 3. State Model (`GameState.payload`)
- `bag: TileColor[]`
- `discard: TileColor[]`
- `factories: TileColor[][]`
- `center: (TileColor | "FIRST_PLAYER_TOKEN")[]`
- `boards: Record<PlayerId, AzulBoard>`
- `round: number`
- `turnStage: "draft" | "wall_tiling" | "round_end" | "game_end"`

### AzulBoard
- `patternLines: { color: TileColor | null; tiles: TileColor[]; capacity: number }[]`
- `wall: (TileColor | null)[][]`
- `floorLine: (TileColor | "FIRST_PLAYER_TOKEN")[]`
- `score: number`
- `hasFirstPlayerToken: boolean`

## 4. Legal Actions
1. `TAKE_FROM_FACTORY { factoryIndex, color, targetLine }`
2. `TAKE_FROM_CENTER { color, targetLine }`
3. `APPLY_WALL_TILING` (system/internal action per player)
4. `END_ROUND`
5. `RESIGN`

## 5. Validation Rules
1. Draft actions only in `draft` phase.
2. Selected color must exist in source factory/center.
3. Pattern line placement rules:
   - line color must match existing color in that line (if non-empty)
   - line cannot contain color that already exists in corresponding wall row target slot
4. Overflow tiles go to floor line.
5. Once all factories and center (except token) are empty, transition to `wall_tiling`.

## 6. Round Resolution Algorithm
1. Draft loop until no selectable tiles remain.
2. Wall tiling in player order:
   - for each full pattern line, move one tile to wall target position
   - remaining tiles from that line move to discard
   - score immediate adjacency (left/right/up/down contiguous counts)
3. Apply floor penalties and clamp at minimum 0 score.
4. Refill factories from bag (shuffle discard into bag when needed).
5. Next round starts with player holding first-player token.

## 7. Endgame and Final Scoring
- Trigger endgame if any player has a complete horizontal wall row after wall tiling.
- Final bonuses:
  - completed rows
  - completed columns
  - completed sets of one color
- Highest score wins; ties share victory.

## 8. Illegal Action Set
- Taking color not present in source.
- Placing into incompatible pattern line.
- Placing into full line.
- Ignoring mandatory floor overflow.
- Draft action attempted outside draft phase.

## 9. Real-Time Sync Notes
- Random tile draw is server-authoritative and logged.
- Hidden info is minimal; full state can be mostly public except bag order.
- Replay reconstructs bag/dispense deterministically from logged draws.

## 10. Test Coverage Targets
- 10 normal scenarios: valid drafting, wall tiling, score updates, round transitions.
- 10 illegal scenarios: invalid line placement, invalid color take, stage mismatch.
- 10 edge scenarios: bag depletion + reshuffle, multi-bonus final scoring, score floor clamp.

## 11. Sources
- https://cdn.svc.asmodee.net/production-nextmove/uploads/2024/07/NM6010_azul-rules.pdf
- https://www.planbgames.com/en/boardgames/azul/
- https://www.rulespal.com/azul/rulebook
