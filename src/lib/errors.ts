export class PDFProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PDFProcessingError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export function getErrorResponse(error: unknown): { message: string; status: number; code?: string } {
  if (error instanceof PDFProcessingError) {
    return { message: error.message, status: 422, code: error.code };
  }
  if (error instanceof ValidationError) {
    return { message: error.message, status: 400, code: 'VALIDATION_ERROR' };
  }
  if (error instanceof RateLimitError) {
    return { message: error.message, status: 429, code: 'RATE_LIMITED' };
  }
  if (error instanceof Error) {
    return { message: error.message, status: 500, code: 'INTERNAL_ERROR' };
  }
  return { message: 'An unknown error occurred', status: 500, code: 'UNKNOWN_ERROR' };
}
