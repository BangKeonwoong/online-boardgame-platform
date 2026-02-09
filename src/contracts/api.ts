import { z } from "zod";

export const CreateMatchRequestSchema = z.object({
  gameId: z.enum(["splendor", "gomoku", "gostop", "catan", "azul"]),
  playerIds: z.array(z.string().min(1)).min(2).max(4)
});

export type CreateMatchRequest = z.infer<typeof CreateMatchRequestSchema>;

export interface CreateMatchResponse {
  matchId: string;
  gameId: "splendor" | "gomoku" | "gostop" | "catan" | "azul";
  playerIds: string[];
  status: "pending" | "active" | "finished" | "aborted";
  createdAt: string;
}

export interface HealthResponse {
  status: "ok";
  service: string;
  version: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
