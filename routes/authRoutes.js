const express = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
} = require('../controllers/authControllers');

const router = express.Router();

// Register
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);

// Logout
router.get('/logout', logoutUser);

// Forgot Pass
router.post('/forgotpassword', forgotPassword);

// Reset Pass
router.put('/resetpassword/:resetToken', resetPassword);

module.exports = router;
