# Online Boardgame Platform

## Included Games (MVP 5)
- Splendor
- Gomoku (freestyle baseline)
- Go-Stop / Matgo
- Catan (base game)
- Azul (base game)

## What Is Included
- Shared runtime contracts:
  - `src/contracts/types.ts`
  - `src/contracts/messages.ts`
  - `src/contracts/persistence.ts`
  - `src/contracts/test-vectors.ts`
  - `src/contracts/api.ts`
- Replay deterministic helper:
  - `src/core/replay.ts`
  - `src/core/runtime.ts`
- Game catalog:
  - `src/games/catalog.ts`
- API skeleton:
  - `src/server/app.ts`
  - `src/server/index.ts`
  - `src/server/repository/memory-store.ts`
- Research specs and citations:
  - `research_online_boardgames/game_specs/*.md`
  - `research_online_boardgames/sources.md`
  - `research_online_boardgames/implementation_handoff.md`
- Machine-readable test vectors:
  - `research_online_boardgames/test_vectors/*.json`

## API Endpoints (v1)
- `GET /health`
- `POST /api/v1/matches`
  - body: `{ "gameId": "splendor", "playerIds": ["p1", "p2"] }`
- `GET /api/v1/test-vectors/:gameId`

## Local Commands
```bash
npm install
npm run generate:vectors
npm run validate:vectors
npm run check
npm run dev
```

## Render Deployment
This repository includes `render.yaml` for web service deployment.

- Build command: `npm ci && npm run build`
- Start command: `npm run start`
- Health check path: `/health`

## GitHub Actions
- CI workflow: `.github/workflows/ci.yml`
- Render deploy workflow: `.github/workflows/deploy-render.yml`

Set GitHub secret:
- `RENDER_DEPLOY_HOOK_URL`: Deploy hook URL from Render service settings.

## Notes
- Test vectors are scenario-driven artifacts for implementing reducers and validators.
- Random outcomes must remain server-authoritative and replayable from action logs.
