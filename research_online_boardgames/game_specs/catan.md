# Catan Implementation Spec (Base Game)

## 1. Ruleset Metadata
- `gameId`: `catan`
- `rulesetVersion`: `catan-base-2025-secure-rulebook`
- Player count: 3-4
- Scope: Base game only (no Seafarers/C&K/5-6 expansion rules)
- Win condition: first to 10 victory points during own turn

## 2. Setup
- Generate hex map (resource + number token layout) from deterministic seed or official beginner preset.
- Place robber on desert.
- Each player places two settlements and two connecting roads in snake order.
- Initial resources granted from second settlement adjacent hexes.

## 3. State Model (`GameState.payload`)
- `board: { hexes, intersections, edges, ports }`
- `robberHexId: string`
- `dice: { lastRoll?: number }`
- `bank: { resourceCards, developmentDeckRemaining }`
- `players: Record<PlayerId, CatanPlayerState>`
- `turnStage: CatanTurnStage`
- `tradeContext?: TradeContext`
- `longestRoadOwnerId?: string`
- `largestArmyOwnerId?: string`

### CatanTurnStage
- `setup_place_settlement_road`
- `roll_or_play_knight`
- `resolve_roll`
- `main_actions`
- `robber_discard`
- `robber_move_steal`
- `game_end`

## 4. Legal Actions
1. `PLACE_SETUP_SETTLEMENT`
2. `PLACE_SETUP_ROAD`
3. `ROLL_DICE`
4. `PLAY_DEVELOPMENT_CARD`
5. `BUILD_ROAD`
6. `BUILD_SETTLEMENT`
7. `UPGRADE_TO_CITY`
8. `BUY_DEVELOPMENT_CARD`
9. `PROPOSE_TRADE`
10. `ACCEPT_TRADE`
11. `TRADE_WITH_BANK`
12. `MOVE_ROBBER`
13. `STEAL_RANDOM_CARD`
14. `END_TURN`
15. `RESIGN`

## 5. Validation Rules
1. Turn and stage authorization.
2. Build legality:
   - Road connected to own network unless setup rule applies.
   - Settlement obeys distance rule (no adjacent settlements).
   - City only upgrades own settlement.
3. Resource sufficiency and bank availability.
4. Development card timing:
   - bought card cannot be played same turn (except immediate VP reveal policy configured).
5. Trade legality:
   - offering player owns offered cards.
   - acceptance only by targeted peer.
6. Robber flow:
   - if roll=7, enforce discard before robber move.
   - robber must move to different hex.

## 6. Turn Resolution Algorithm
1. Start turn -> `roll_or_play_knight`.
2. On roll:
   - distribute resources for hexes with rolled number and without robber.
   - if 7: execute discard and robber move/steal sequence.
3. Main actions loop:
   - any number of build/trade/buy actions in any order
   - one development card play per turn (configurable by official rule)
4. Recompute longest road and largest army after relevant actions.
5. Check victory points; if >=10 current player wins immediately.
6. `END_TURN` advances to next player.

## 7. Longest Road Deterministic Evaluation
- Build player-specific road graph with blocked vertices at opponents' settlements/cities.
- Evaluate longest simple path length for each player.
- Award at length >=5 and strictly greater than current holder.
- Tie keeps existing holder.

## 8. Illegal Action Set
- Building on occupied or invalid location.
- Rolling dice twice in one turn.
- Playing disallowed dev card type/time.
- Trading cards not owned.
- Moving robber to same hex.
- Ending turn before mandatory robber resolution.

## 9. Real-Time Sync Notes
- Server handles hidden info: dev deck draw, random steal card selection.
- Use action-level audit entries for all random outputs.
- Reconnection sync sends public state + per-player private hand projection.

## 10. Test Coverage Targets
- 10 normal scenarios: setup snake order, resource distribution, builds, trades, win.
- 10 illegal scenarios: invalid builds, stage violations, invalid dev usage.
- 10 edge scenarios: robber on scarce resources, tie on longest road, bank depletion.

## 11. Sources
- https://www.catan.com/understand-catan/game-rules
- https://www.catan.com/sites/default/files/2025-03/CN3081%20CATAN%E2%80%93The%20Game%20Rulebook%20secure%20%281%29.pdf
- https://www.catan.com
