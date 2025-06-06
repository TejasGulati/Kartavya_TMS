require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

// Declare server variable at module level
let server = null;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Unhandled Rejection: ${err.message}`);
  console.log('Shutting down the server due to Unhandled Promise Rejection');
  if (server) {
    server.close(() => {
      console.log('Server closed due to Unhandled Rejection');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Uncaught Exception: ${err.message}`);
  console.log('Shutting down the server due to Uncaught Exception');
  if (server) {
    server.close(() => {
      console.log('Server closed due to Uncaught Exception');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Connect to MongoDB using Mongoose and start the server
const startServer = async () => {
  try {
    // Connect to MongoDB using Mongoose
    await mongoose.connect(MONGODB_URI);
    console.log("Successfully connected to MongoDB Atlas!");
    
    // Assign server to module-level variable
    server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`API Docs: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Gracefully shutting down...');
      if (server) {
        server.close(async () => {
          console.log('Server closed.');
          await mongoose.connection.close();
          console.log('MongoDB connection closed.');
          process.exit(0);
        });
      } else {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        process.exit(0);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

// Only start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };