export interface OpenClawStatusCard {
  ok?: boolean;
  [key: string]: unknown;
}

export interface OpenClawProxyResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
