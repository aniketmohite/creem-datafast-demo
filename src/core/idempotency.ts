import type { IdempotencyStore } from "./types.js";

/**
 * In-memory idempotency store for development and testing.
 * For production, use a durable store like Redis.
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly store = new Map<
    string,
    { processedAt: string; eventType: string }
  >();

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async set(
    key: string,
    value: { processedAt: string; eventType: string },
  ): Promise<void> {
    this.store.set(key, value);
  }

  /** Clear all entries. Useful in tests. */
  clear(): void {
    this.store.clear();
  }

  /** Get the current number of stored entries. */
  get size(): number {
    return this.store.size;
  }
}
