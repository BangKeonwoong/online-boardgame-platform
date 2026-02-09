const baseUrl = process.env.BASE_URL;

if (!baseUrl) {
  // eslint-disable-next-line no-console
  console.error("Missing BASE_URL. Example: BASE_URL=https://your-service.onrender.com npm run smoke:remote");
  process.exit(1);
}

const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

async function main(): Promise<void> {
  const health = await fetchJson(`${normalizedBaseUrl}/health`, {
    method: "GET"
  });
  assertStatus("GET /health", health.status, [200]);
  // eslint-disable-next-line no-console
  console.log("GET /health OK", health.body);

  const vector = await fetchJson(`${normalizedBaseUrl}/api/v1/test-vectors/splendor`, {
    method: "GET"
  });
  assertStatus("GET /api/v1/test-vectors/splendor", vector.status, [200]);
  const vectorBody = asRecord(vector.body);
  // eslint-disable-next-line no-console
  console.log("GET /api/v1/test-vectors/splendor OK", {
    gameId: vectorBody?.gameId,
    scenarioCounts: vectorBody?.scenarioCounts
  });

  const createMatch = await fetchJson(`${normalizedBaseUrl}/api/v1/matches`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      gameId: "splendor",
      playerIds: ["u1", "u2"]
    })
  });
  assertStatus("POST /api/v1/matches", createMatch.status, [201]);
  // eslint-disable-next-line no-console
  console.log("POST /api/v1/matches OK", createMatch.body);
}

async function fetchJson(
  url: string,
  options: RequestInit
): Promise<{ status: number; body: unknown; text: string }> {
  const response = await fetch(url, options);
  const text = await response.text();
  try {
    return { status: response.status, body: JSON.parse(text), text };
  } catch {
    return { status: response.status, body: null, text };
  }
}

function assertStatus(name: string, actual: number, expectedStatuses: number[]): void {
  if (!expectedStatuses.includes(actual)) {
    throw new Error(`${name} failed. Expected ${expectedStatuses.join(", ")}, got ${actual}.`);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
