const express = require('express');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
const authController = require('../controllers/authController');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  handleValidationErrors 
} = require('../middleware/validation');

router.post('/register', 
  validateUserRegistration, 
  handleValidationErrors, 
  authController.register
);

router.post('/login', 
  validateUserLogin, 
  handleValidationErrors, 
  authController.login
);

router.get('/me', 
  authenticate, 
  authController.getMe
);

module.exports = router;