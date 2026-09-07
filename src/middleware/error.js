const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Internal Server Error";
  let errors = [];

  // Mongoose Bad ObjectId
  if (err.name === "CastError") {
    message = `Resource not found with id of ${err.value}`;
    statusCode = 404;
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: ${field} must be unique`;
    statusCode = 400;
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    errors = Object.values(err.errors).map((val) => val.message);
    message = errors.join(", ") || "Validation Error";
    statusCode = 400;
  }

  // Multer Error
  if (err.name === "MulterError") {
    message = `File upload error: ${err.message}`;
    statusCode = 400;
  }

  // JWT Error
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token authorization";
    statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    message = "Token has expired, please log in again";
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : [message],
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = errorHandler;
