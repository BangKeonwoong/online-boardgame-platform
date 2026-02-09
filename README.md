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

### Manual Deployment Steps (Render Dashboard)
1. Open Render and click `New +` -> `Blueprint`.
2. Connect GitHub account and select repo: `BangKeonwoong/online-boardgame-platform`.
3. Confirm blueprint file `render.yaml` is detected, then deploy.
4. After deployment completes, open service URL and verify:
   - `GET /health`
   - `GET /api/v1/test-vectors/splendor`
   - `POST /api/v1/matches`
5. Create Deploy Hook in Render service settings and copy the URL.
6. Add GitHub secret in this repo:
   - Name: `RENDER_DEPLOY_HOOK_URL`
   - Value: copied deploy hook URL
7. Push to `main` and confirm GitHub Actions `CI` then `Deploy Render` succeed.

## GitHub Actions
- CI workflow: `.github/workflows/ci.yml`
- Render deploy workflow: `.github/workflows/deploy-render.yml`

Set GitHub secret:
- `RENDER_DEPLOY_HOOK_URL`: Deploy hook URL from Render service settings.

## Remote Smoke Test
After Render URL is issued:

```bash
BASE_URL=https://your-service.onrender.com npm run smoke:remote
```

## Notes
- Test vectors are scenario-driven artifacts for implementing reducers and validators.
- Random outcomes must remain server-authoritative and replayable from action logs.
