import Fastify, { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import {
  CreateMatchRequestSchema,
  type CreateMatchResponse,
  type HealthResponse
} from "../contracts/api.js";
import { GAME_CATALOG } from "../games/catalog.js";
import { toApiError } from "./http/errors.js";
import { MemoryMatchStore } from "./repository/memory-store.js";
import { loadTestVector } from "./vector-loader.js";
import type { GameId } from "../contracts/types.js";

export interface BuildAppOptions {
  logger?: boolean;
  matchStore?: MemoryMatchStore;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? false
  });
  const matchStore = options.matchStore ?? new MemoryMatchStore();
  const catalogByGameId = new Map(GAME_CATALOG.map((game) => [game.gameId, game]));

  app.get("/health", async () => {
    const response: HealthResponse = {
      status: "ok",
      service: "online-boardgame-platform",
      version: process.env.npm_package_version ?? "0.0.0"
    };
    return response;
  });

  app.post("/api/v1/matches", async (request, reply) => {
    const parsed = CreateMatchRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send(toApiError("INVALID_BODY", "Request body does not match schema.", parsed.error.flatten()));
    }

    const { gameId, playerIds } = parsed.data;
    const catalogEntry = catalogByGameId.get(gameId);
    if (!catalogEntry) {
      return reply.code(404).send(toApiError("GAME_NOT_FOUND", `Unknown gameId: ${gameId}`));
    }

    if (playerIds.length < catalogEntry.minPlayers || playerIds.length > catalogEntry.maxPlayers) {
      return reply.code(400).send(
        toApiError(
          "INVALID_PLAYER_COUNT",
          `${gameId} requires ${catalogEntry.minPlayers}-${catalogEntry.maxPlayers} players.`,
          {
            minPlayers: catalogEntry.minPlayers,
            maxPlayers: catalogEntry.maxPlayers,
            requestedPlayers: playerIds.length
          }
        )
      );
    }

    const createdAt = new Date().toISOString();
    const entity = matchStore.createMatch({
      matchId: randomUUID(),
      gameId,
      playerIds,
      createdAt
    });

    const response: CreateMatchResponse = {
      matchId: entity.matchId,
      gameId: entity.gameId,
      playerIds: entity.playerIds,
      status: entity.status,
      createdAt: entity.createdAt
    };
    return reply.code(201).send(response);
  });

  app.get("/api/v1/test-vectors/:gameId", async (request, reply) => {
    const params = request.params as { gameId: string };
    const gameId = params.gameId as GameId;

    if (!catalogByGameId.has(gameId)) {
      return reply.code(404).send(toApiError("GAME_NOT_FOUND", `Unknown gameId: ${params.gameId}`));
    }

    try {
      const vector = await loadTestVector(gameId);
      return reply.code(200).send(vector);
    } catch (error) {
      request.log.error(error, "Failed to load test vector");
      return reply
        .code(500)
        .send(toApiError("VECTOR_LOAD_FAILED", `Could not load test vectors for ${gameId}.`));
    }
  });

  return app;
}
