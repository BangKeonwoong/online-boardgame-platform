import type { ApiErrorResponse } from "../../contracts/api.js";

export function toApiError(code: string, message: string, details?: unknown): ApiErrorResponse {
  return {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details })
    }
  };
}
