import { env } from "@/lib/config/env";

interface OpenClawRequest {
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
}

export async function openclawRequest<T>({ path, method = "GET", body }: OpenClawRequest): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (env.openclawToken) {
    headers["Authorization"] = `Bearer ${env.openclawToken}`;
  }

  const response = await fetch(`${env.openclawBaseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenClaw request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}
