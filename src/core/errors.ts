export class CreemDataFastError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreemDataFastError";
  }
}

export class ConfigError extends CreemDataFastError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class MissingVisitorIdError extends CreemDataFastError {
  constructor(transactionId?: string) {
    super(
      `datafast_visitor_id not found in webhook metadata${transactionId ? ` for transaction ${transactionId}` : ""}`,
    );
    this.name = "MissingVisitorIdError";
  }
}

export class InvalidWebhookSignatureError extends CreemDataFastError {
  constructor() {
    super("Invalid or missing CREEM webhook signature");
    this.name = "InvalidWebhookSignatureError";
  }
}

export class UnsupportedWebhookEventError extends CreemDataFastError {
  public readonly eventType: string;

  constructor(eventType: string) {
    super(`Unsupported webhook event type: ${eventType}`);
    this.name = "UnsupportedWebhookEventError";
    this.eventType = eventType;
  }
}

export class DataFastRequestError extends CreemDataFastError {
  public readonly status: number;
  public readonly responseBody: unknown;

  constructor(status: number, responseBody: unknown) {
    super(`DataFast API request failed with status ${status}`);
    this.name = "DataFastRequestError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export class MetadataCollisionError extends CreemDataFastError {
  constructor() {
    super(
      'datafast_visitor_id already exists in metadata and merge strategy is "error"',
    );
    this.name = "MetadataCollisionError";
  }
}
