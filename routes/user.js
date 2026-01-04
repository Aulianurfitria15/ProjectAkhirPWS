const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isUser } = require('../middleware/auth');

// Semua route membutuhkan autentikasi user
router.use(isUser);

// Dashboard user
router.get('/dashboard', userController.dashboard);

// Generate API Key
router.post('/generate-api-key', userController.generateApiKey);

// Validasi API Key
router.post('/validate-api-key', userController.validateApiKey);

// Daftar konser (membutuhkan API key aktif)
router.get('/concerts', userController.showConcerts);

module.exports = router;