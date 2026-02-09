import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/server/app.js";

describe("server api", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildApp({ logger: false });
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns health payload", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.status).toBe("ok");
    expect(payload.service).toBe("online-boardgame-platform");
  });

  it("creates a match for valid request", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/matches",
      payload: {
        gameId: "splendor",
        playerIds: ["p1", "p2", "p3"]
      }
    });

    expect(response.statusCode).toBe(201);
    const payload = response.json();
    expect(payload.gameId).toBe("splendor");
    expect(payload.status).toBe("pending");
    expect(payload.playerIds).toEqual(["p1", "p2", "p3"]);
    expect(typeof payload.matchId).toBe("string");
  });

  it("rejects invalid player count by game", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/matches",
      payload: {
        gameId: "gomoku",
        playerIds: ["p1", "p2", "p3"]
      }
    });

    expect(response.statusCode).toBe(400);
    const payload = response.json();
    expect(payload.error.code).toBe("INVALID_PLAYER_COUNT");
  });

  it("returns vector payload for known game", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/test-vectors/splendor"
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.gameId).toBe("splendor");
    expect(payload.scenarioCounts.normal).toBe(10);
  });

  it("returns 404 for unknown game vector", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/test-vectors/unknown"
    });

    expect(response.statusCode).toBe(404);
    const payload = response.json();
    expect(payload.error.code).toBe("GAME_NOT_FOUND");
  });
});
