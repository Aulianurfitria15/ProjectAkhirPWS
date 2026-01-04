const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/auth');

// Halaman login
router.get('/login', redirectIfAuthenticated, authController.showLogin);
router.post('/login', authController.login);

// Halaman register
router.get('/register', redirectIfAuthenticated, authController.showRegister);
router.post('/register', authController.register);

// Logout
router.get('/logout', authController.logout);

module.exports = router;