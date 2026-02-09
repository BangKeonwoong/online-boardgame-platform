# Online Boardgame Implementation Research Plan

## Main Question
How should five board games (Splendor, Gomoku, Go-Stop/Matgo, Catan, Azul) be specified so they can be implemented as deterministic, server-authoritative online games with replay support?

## Subtopics
1. Splendor official base-game rules and implementation edge cases.
2. Gomoku baseline ruleset selection for online deterministic play.
3. Go-Stop + Matgo common-core and mode-divergent scoring/events.
4. Catan base-game turn/economy/trade/robber algorithms.
5. Azul factory drafting, placement, and scoring timing details.

## Expected Information
- Official and secondary sources per game.
- Turn-state machine and legal action boundaries.
- Win/termination rules and tie handling.
- Common illegal actions and conflict-resolution priorities.

## Synthesis Approach
- Produce one implementation-focused markdown spec per game.
- Produce one machine-readable test-vector dataset per game.
- Track source URLs in a global bibliography and game-level metadata.
