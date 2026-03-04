import { env } from "@/lib/config/env";

interface OpenClawRequest {
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
  timeoutMs?: number;
}

export async function openclawRequest<T>({ path, method = "GET", body, timeoutMs = 10_000 }: OpenClawRequest): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (env.openclawToken) {
    headers["Authorization"] = `Bearer ${env.openclawToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${env.openclawBaseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`OpenClaw request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();

  if (!response.ok) {
    const snippet = rawBody.slice(0, 180).replace(/\s+/g, " ").trim();
    throw new Error(`OpenClaw request failed (${response.status})${snippet ? `: ${snippet}` : ""}`);
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("OpenClaw response was not JSON");
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new Error("OpenClaw returned invalid JSON");
  }
}
