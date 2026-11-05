export const errorMiddleware = (err, req, res, next) => {
  console.error("🚨 [Express Error]:", err); // Track the exact crash
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
