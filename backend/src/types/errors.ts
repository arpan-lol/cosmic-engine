export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly shouldExposeToClient: boolean;
  public readonly clientMessage?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    shouldExposeToClient: boolean = false,
    clientMessage?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.shouldExposeToClient = shouldExposeToClient;
    this.clientMessage = clientMessage;
    
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class GeminiRateLimitError extends AppError {
  constructor(message: string = 'Google Gemini API rate limit has been hit') {
    super(
      message,
      429,
      true,
      true,
      'Google Gemini API RateLimit Hit'
    );
    Object.setPrototypeOf(this, GeminiRateLimitError.prototype);
  }
}

export class GeminiInternalError extends AppError {
  constructor(message: string = 'Google Gemini API encountered an internal server error') {
    super(
      message,
      500,
      true,
      true,
      'Google Gemini API Internal Server Error'
    );
    Object.setPrototypeOf(this, GeminiInternalError.prototype);
  }
}

export class GeminiOverloadedError extends AppError {
  constructor(message: string = 'Google Gemini API is overloaded') {
    super(
      message,
      503,
      true,
      true,
      'Google Gemini API Internal Server Overloaded'
    );
    Object.setPrototypeOf(this, GeminiOverloadedError.prototype);
  }
}

export class ProcessingError extends AppError {
  constructor(message: string, statusCode: number = 500) {
    super(
      message,
      statusCode,
      true,
      false,
      'Processing failed! The server might be overloaded, please try again later.'
    );
    Object.setPrototypeOf(this, ProcessingError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, true, true, message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true, true, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, true, true, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export function isGeminiError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorString = String(error).toLowerCase();
  
  return (
    errorMessage.includes('resource_exhausted') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('quota exceeded') ||
    errorMessage.includes('internal error') ||
    errorMessage.includes('overloaded') ||
    errorMessage.includes('503') ||
    errorString.includes('resource_exhausted') ||
    errorString.includes('rate limit')
  );
}

export function parseGeminiError(error: any): AppError {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorString = String(error).toLowerCase();
  
  if (
    errorMessage.includes('resource_exhausted') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('quota exceeded') ||
    errorString.includes('resource_exhausted')
  ) {
    return new GeminiRateLimitError(error.message);
  }
  
  if (
    errorMessage.includes('overloaded') ||
    errorMessage.includes('503') ||
    errorString.includes('overloaded')
  ) {
    return new GeminiOverloadedError(error.message);
  }
  
  if (
    errorMessage.includes('internal error') ||
    errorMessage.includes('internal server error') ||
    errorMessage.includes('500')
  ) {
    return new GeminiInternalError(error.message);
  }
  
  return new ProcessingError(error.message || 'Failed to process request');
}
