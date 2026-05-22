function errorHandler(error, request, response, next) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    error: error.message || "Unexpected backend error.",
  });
}

module.exports = errorHandler;
