/**
 * Global Express error handler.
 * Must have 4 params so Express recognizes it as error middleware.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  const status = err.statusCode || 500;
  res.status(status).json({
    error: {
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
}

/**
 * Wrapper for async route handlers — catches promise rejections
 * and forwards them to the error handler.
 */
export function asyncWrap(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
