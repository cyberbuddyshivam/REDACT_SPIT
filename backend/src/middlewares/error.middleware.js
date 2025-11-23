import { ApiError } from "../utils/api-error.js";

/**
 * Global error handling middleware
 * Catches all errors thrown in the application and returns standardized responses
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If it's not an ApiError instance, convert it
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof Error ? 500 : 400;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || [], "");
  }

  // Handle Mongoose validation errors
  if (error.name === "ValidationError") {
    const validationErrors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
    error = new ApiError(400, "Validation Error", validationErrors);
  }

  // Handle Mongoose duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    error = new ApiError(
      409,
      `${field} already exists`,
      [{ field, message: "This value is already in use" }]
    );
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (error.name === "CastError") {
    error = new ApiError(400, `Invalid ${error.path}: ${error.value}`);
  }

  // Handle JWT errors (for future authentication)
  if (error.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token. Please log in again.");
  }

  if (error.name === "TokenExpiredError") {
    error = new ApiError(401, "Token expired. Please log in again.");
  }

  // Prepare the response
  const response = {
    success: false,
    message: error.message,
    statusCode: error.statusCode,
    ...(error.errors.length > 0 && { errors: error.errors }),
  };

  // In development, include stack trace
  if (process.env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  // Log error for debugging
  console.error("ERROR:", {
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    stack: error.stack,
  });

  return res.status(error.statusCode).json(response);
};

export default errorHandler;
