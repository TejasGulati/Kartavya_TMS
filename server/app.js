const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// First lets import are 3 routes - auth , users and tasks!!!
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');

// Second lets import are Error handling middleware - centralised to ensure consistent handling!!!
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Third lets initialize our express server!!!
const app = express();

// Fourth ensure security middleware!!!
app.use(helmet());

// CORS configuration setup.
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://kartavya-tms.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));



// Logging middleware setup.
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting setup.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing middleware.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads of pdfs etc.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint to see working.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Kartavya Backend Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes usage.
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// Error handling middleware - must be before 404 handler
app.use(errorHandler);

// 404 handler for undefined routes - must be last
app.use('*', notFound);

module.exports = app;