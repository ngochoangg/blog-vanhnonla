class AppError extends Error {
    /**
     * Global app error
     * @param {String} message The message of error
     * @param {Number} statusCode Status code
     */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;