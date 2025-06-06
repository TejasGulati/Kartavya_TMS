const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
  
    // Log error
    console.error('Error:', err);
  
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      const message = 'Resource not found';
      error = {
        message,
        statusCode: 404
      };
    }
  
    // Mongoose duplicate key
    if (err.code === 11000) {
      let message;
      const field = Object.keys(err.keyValue)[0];
      
      if (field === 'email') {
        message = 'Email already exists';
      } else {
        message = 'Duplicate field value entered';
      }
      
      error = {
        message,
        statusCode: 400
      };
    }
  
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message).join(', ');
      error = {
        message,
        statusCode: 400
      };
    }
  
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      const message = 'Invalid token';
      error = {
        message,
        statusCode: 401
      };
    }
  
    if (err.name === 'TokenExpiredError') {
      const message = 'Token expired';
      error = {
        message,
        statusCode: 401
      };
    }
  
    // Multer errors (file upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
      const message = 'File size too large. Maximum size is 5MB';
      error = {
        message,
        statusCode: 400
      };
    }
  
    if (err.code === 'LIMIT_FILE_COUNT') {
      const message = 'Too many files. Maximum 3 files allowed';
      error = {
        message,
        statusCode: 400
      };
    }
  
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      const message = 'Unexpected file field';
      error = {
        message,
        statusCode: 400
      };
    }
  
    // Default error response
    const statusCode = error.statusCode || err.statusCode || 500;
    const message = error.message || 'Internal Server Error';
  
    res.status(statusCode).json({
      status: 'error',
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        error: err
      })
    });
  };
  
  // Handle 404 errors for undefined routes
  const notFound = (req, res) => {
    res.status(404).json({
      status: 'error',
      message: `Route ${req.originalUrl} not found`
    });
  };
  
  module.exports = { errorHandler, notFound };