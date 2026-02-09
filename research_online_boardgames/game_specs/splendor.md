# Splendor Implementation Spec (Base Game)

## 1. Ruleset Metadata
- `gameId`: `splendor`
- `rulesetVersion`: `2024-space-cowboys-base-en`
- Player count: 2-4
- Scope: Base game only (no Cities of Splendor modules)
- Win condition: 15+ prestige points, then finish round

## 2. Components and Setup (Deterministic Targets)
- Development cards: 3 tiers (`tier1`, `tier2`, `tier3`), shuffled independently.
- Noble tiles: reveal `playerCount + 1` nobles.
- Gem tokens: emerald/sapphire/ruby/diamond/onyx + gold joker.
  - 2 players: 4 of each color
  - 3 players: 5 of each color
  - 4 players: 7 of each color
  - Gold: 5
- Reveal 4 cards per tier to `tableau`.

## 3. State Model (`GameState.payload`)
- `bankTokens: Record<Color, number> & { gold: number }`
- `tableau: { tier1: Card[]; tier2: Card[]; tier3: Card[] }`
- `decksRemaining: { tier1: number; tier2: number; tier3: number }`
- `nobles: Noble[]`
- `playerBoards: Record<PlayerId, PlayerBoard>`
- `roundStartPlayerId: string`
- `lastRoundTriggered: boolean`
- `lastRoundTriggerTurn: number | null`

### PlayerBoard
- `tokens: Record<Color, number> & { gold: number }`
- `bonuses: Record<Color, number>`
- `reserved: Card[]` (max 3)
- `purchasedCardIds: string[]`
- `prestige: number`

## 4. Phase Machine
- `setup` -> `main_turn`
- `main_turn` -> `end_of_turn_checks`
- `end_of_turn_checks` -> `main_turn` or `finished`

## 5. Legal Actions
1. `TAKE_TOKENS_DIFFERENT`
2. `TAKE_TOKENS_SAME`
3. `RESERVE_VISIBLE_CARD`
4. `RESERVE_TOP_DECK_CARD`
5. `PURCHASE_VISIBLE_CARD`
6. `PURCHASE_RESERVED_CARD`
7. `RETURN_TOKENS_AFTER_OVERFLOW` (forced follow-up when player > 10 tokens)

## 6. Validation Rules (Order Matters)
1. Match/game/turn ownership validation.
2. Action availability by phase.
3. Action-specific constraints:
   - Different colors: exactly 3 distinct colors with bank availability >= 1 each.
   - Same color: exactly 2 tokens only when bank has >= 4 of that color before taking.
   - Reserve: player reserved count < 3.
   - Purchase: computed payment must satisfy card cost using bonuses + tokens + optional gold.
4. Post-action token overflow check (`sum(tokens) <= 10`) or force return action chain.

## 7. Turn Resolution Algorithm
1. Apply one primary action.
2. If card purchased:
   - add permanent bonus and prestige
   - refill empty tableau slot from corresponding deck
3. Evaluate noble visit:
   - for each noble, if player bonuses meet requirements, noble is claimable
   - if multiple claimable, deterministic selection by ascending `noble.id` unless UI preselect action exists
4. If player prestige >= 15 and `lastRoundTriggered = false`, mark `lastRoundTriggered = true` and save trigger turn.
5. Advance `currentPlayerId`.
6. If full round completed after trigger, compute winner:
   - highest prestige
   - tie-breaker: fewer purchased development cards
   - final tie: earlier in turn order relative to trigger player

## 8. Illegal Action Set
- Taking tokens not in bank.
- Taking two of same color when bank has < 4.
- Reserving fourth card.
- Buying without enough payment.
- Paying with non-optimal negative token result.
- Ending turn while token count > 10.

## 9. Real-Time Sync Notes
- Server authoritative card draw from seeded RNG or pre-shuffled deck order.
- Every reserve-from-deck action stores drawn `cardId` in action result.
- Idempotency key required for all purchase/reserve actions.

## 10. Test Coverage Targets
- 10 normal scenarios: token actions, reserve, purchase, noble claim, last round.
- 10 illegal scenarios: overflow, bad payment, invalid reserve, invalid token take.
- 10 edge scenarios: empty deck refill, tie-breakers, multi-noble eligibility.

## 11. Sources
- https://cdn.svc.asmodee.net/production-spacecowboys/uploads/2024/09/SPLENDOR-RULES-EN.pdf
- https://www.spacecowboys.fr/splendor
- https://www.rulespal.com/splendor/rulebook
