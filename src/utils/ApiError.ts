export type ApiErrorDetails = Readonly<Record<string, unknown>>;

export type HttpStatusCode =
  400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503;

type ApiErrorOptions = {
  statusCode: HttpStatusCode;
  message: string;
  errors?: ApiErrorDetails | null;
  isOperational?: boolean;
  cause?: unknown;
};

class ApiError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly errors: ApiErrorDetails | null;
  public readonly isOperational: boolean;

  public constructor({
    statusCode,
    message,
    errors = null,
    isOperational = true,
    cause,
  }: ApiErrorOptions) {
    super(message, cause !== undefined ? { cause } : undefined);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public static badRequest(
    message = "Bad request",
    errors: ApiErrorDetails | null = null,
  ): ApiError {
    return new ApiError({
      statusCode: 400,
      message,
      errors,
    });
  }

  public static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError({
      statusCode: 401,
      message,
    });
  }

  public static forbidden(message = "Forbidden"): ApiError {
    return new ApiError({
      statusCode: 403,
      message,
    });
  }

  public static notFound(message = "Resource not found"): ApiError {
    return new ApiError({
      statusCode: 404,
      message,
    });
  }

  public static conflict(
    message = "Conflict",
    errors: ApiErrorDetails | null = null,
  ): ApiError {
    return new ApiError({
      statusCode: 409,
      message,
      errors,
    });
  }

  public static unprocessableEntity(
    message = "Validation failed",
    errors: ApiErrorDetails | null = null,
  ): ApiError {
    return new ApiError({
      statusCode: 422,
      message,
      errors,
    });
  }

  public static tooManyRequests(message = "Too many requests"): ApiError {
    return new ApiError({
      statusCode: 429,
      message,
    });
  }

  public static serviceUnavailable(
    message = "Service unavailable",
    cause?: unknown,
  ): ApiError {
    return new ApiError({
      statusCode: 503,
      message,
      isOperational: true,
      cause,
    });
  }

  public static internal(
    message = "Internal server error",
    cause?: unknown,
  ): ApiError {
    return new ApiError({
      statusCode: 500,
      message,
      isOperational: false,
      cause,
    });
  }

  public static fromUnknown(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      return ApiError.internal(error.message, error);
    }

    return ApiError.internal("Unknown internal server error", error);
  }

  public toResponse(isProduction: boolean): {
    success: false;
    message: string;
    errors?: ApiErrorDetails;
    stack?: string;
  } {
    const response: {
      success: false;
      message: string;
      errors?: ApiErrorDetails;
      stack?: string;
    } = {
      success: false,
      message:
        isProduction && !this.isOperational
          ? "Internal server error"
          : this.message,
    };

    if (this.errors) {
      response.errors = this.errors;
    }

    if (!isProduction && this.stack) {
      response.stack = this.stack;
    }

    return response;
  }
}

export default ApiError;
