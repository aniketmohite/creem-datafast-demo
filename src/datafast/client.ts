import { DataFastRequestError } from "../core/errors.js";
import type {
  DataFastPaymentRequest,
  DataFastApiResponse,
} from "../core/types.js";

export interface DataFastClientOptions {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
  fetch: typeof globalThis.fetch;
}

/**
 * Minimal API client for DataFast payment tracking.
 */
export class DataFastClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof globalThis.fetch;

  constructor(options: DataFastClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs;
    this.fetchFn = options.fetch;
  }

  /**
   * Send a payment event to DataFast.
   *
   * POST https://datafa.st/api/v1/payments
   */
  async sendPayment(
    payment: DataFastPaymentRequest,
  ): Promise<DataFastApiResponse> {
    const url = `${this.baseUrl}/api/v1/payments`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payment),
        signal: controller.signal,
      });

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = await response.text().catch(() => null);
      }

      if (!response.ok) {
        throw new DataFastRequestError(response.status, body);
      }

      return { status: response.status, body };
    } finally {
      clearTimeout(timeout);
    }
  }
}
