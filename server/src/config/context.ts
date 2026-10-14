import { AsyncLocalStorage } from 'node:async_hooks';

export interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean; error?: string }>;
  run<T = unknown>(): Promise<{ success: boolean; error?: string; meta?: any }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<any[]>;
  exec(query: string): Promise<any>;
}

export interface RequestContext {
  requestId?: string;
  hyperdriveConnectionString?: string;
  d1Database?: D1Database;
  nodeEnv?: string;
  corsOrigin?: string;
  resendApiKey?: string;
  resendFromEmail?: string;
  resendToEmail?: string;
  databaseUrl?: string;
  clientIp?: string;
  inquiryRateLimiter?: RateLimiterBinding;
}

export const requestContextStore = new AsyncLocalStorage<RequestContext>();

const activeContexts = new Map<string, RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContextStore.getStore();
}

export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return requestContextStore.run(context, fn);
}

export function registerRequestContext(id: string, context: RequestContext): void {
  activeContexts.set(id, context);
}

export function getRegisteredRequestContext(id: string): RequestContext | undefined {
  return activeContexts.get(id);
}

export function unregisterRequestContext(id: string): void {
  activeContexts.delete(id);
}

export function getActiveContextCount(): number {
  return activeContexts.size;
}
