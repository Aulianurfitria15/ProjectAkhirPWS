const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// ==================== AUTH ENDPOINTS ====================

// POST /api/auth/register - Register user baru
router.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword, role } = req.body;

        // Validasi input
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Semua field harus diisi'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Password dan konfirmasi password tidak cocok'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password minimal 6 karakter'
            });
        }

        // Validasi role (hanya admin atau user yang diperbolehkan)
        const userRole = role && (role === 'admin' || role === 'user') ? role : 'user';

        // Cek apakah email sudah terdaftar
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Email sudah terdaftar'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user baru
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, userRole]
        );

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil! Silakan login',
            data: {
                userId: result.insertId,
                name: name,
                email: email,
                role: userRole
            }
        });
    } catch (error) {
        console.error('API Register error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan sistem'
        });
    }
});

// POST /api/auth/login - Login dan dapat API Key
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validasi input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email dan password harus diisi'
            });
        }

        // Cari user berdasarkan email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Email atau password salah'
            });
        }

        const user = users[0];

        // Verifikasi password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Email atau password salah'
            });
        }

        // Generate atau ambil API Key yang sudah ada
        let apiKey;
        const [existingApiKeys] = await db.query(
            'SELECT api_key FROM api_keys WHERE user_id = ? AND is_active = TRUE',
            [user.id]
        );

        if (existingApiKeys.length > 0) {
            // Gunakan API Key yang sudah ada
            apiKey = existingApiKeys[0].api_key;
        } else {
            // Generate API Key baru
            apiKey = 'koncr_' + Date.now() + Math.random().toString(36).substring(2, 15);
            
            await db.query(
                'INSERT INTO api_keys (user_id, api_key, is_active) VALUES (?, ?, TRUE)',
                [user.id, apiKey]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Login berhasil',
            data: {
                userId: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                apiKey: apiKey
            }
        });
    } catch (error) {
        console.error('API Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan sistem'
        });
    }
});

// POST /api/auth/generate-api-key - Generate API Key baru (untuk user yang sudah login via web)
router.post('/auth/generate-api-key', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID diperlukan'
            });
        }

        // Cek apakah user ada
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User tidak ditemukan'
            });
        }

        // Nonaktifkan API Key lama
        await db.query(
            'UPDATE api_keys SET is_active = FALSE WHERE user_id = ?',
            [userId]
        );

        // Generate API Key baru
        const newApiKey = 'koncr_' + Date.now() + Math.random().toString(36).substring(2, 15);
        
        await db.query(
            'INSERT INTO api_keys (user_id, api_key, is_active) VALUES (?, ?, TRUE)',
            [userId, newApiKey]
        );

        res.status(201).json({
            success: true,
            message: 'API Key berhasil dibuat',
            data: {
                apiKey: newApiKey
            }
        });
    } catch (error) {
        console.error('API Generate Key error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan sistem'
        });
    }
});

// ==================== CONCERT ENDPOINTS ====================

// Middleware untuk validasi API Key
const validateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API Key diperlukan. Sertakan X-API-Key di header request.'
            });
        }

        // Cek apakah API key valid dan aktif
        const [apiKeys] = await db.query(
            'SELECT * FROM api_keys WHERE api_key = ? AND is_active = TRUE',
            [apiKey]
        );

        if (apiKeys.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'API Key tidak valid atau sudah tidak aktif'
            });
        }

        // API Key valid, lanjutkan
        req.apiKeyData = apiKeys[0];
        next();
    } catch (error) {
        console.error('API Key validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan sistem'
        });
    }
};

// GET /api/concerts - Daftar semua konser (dengan filter & search)
router.get('/concerts', validateApiKey, async (req, res) => {
    try {
        const { genre, search } = req.query;
        let query = 'SELECT * FROM concerts WHERE 1=1';
        const params = [];

        // Filter by genre
        if (genre) {
            query += ' AND genre = ?';
            params.push(genre);
        }

        // Search by name or artist
        if (search) {
            query += ' AND (name LIKE ? OR artist LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY date ASC';

        const [concerts] = await db.query(query, params);

        res.json({
            success: true,
            data: concerts
        });
    } catch (error) {
        console.error('API concerts error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan sistem'
        });
    }
});

// GET /api/concerts/:id - Detail konser spesifik
router.get('/concerts/:id', validateApiKey, async (req, res) => {
    try {
        const concertId = req.params.id;

        const [concerts] = await db.query(
            'SELECT * FROM concerts WHERE id = ?',
            [concertId]
        );

        if (concerts.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Konser tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: concerts[0]
        });
    } catch (error) {
        console.error('API concert detail error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan sistem'
        });
    }
});

// Middleware untuk validasi admin
const validateAdmin = async (req, res, next) => {
    try {
        const apiKeyData = req.apiKeyData;
        
        // Get user role from database
        const [users] = await db.query(
            'SELECT role FROM users WHERE id = ?',
            [apiKeyData.user_id]
        );

        if (users.length === 0 || users[0].role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Akses ditolak. Hanya admin yang dapat menambah konser.'
            });
        }

        next();
    } catch (error) {
        console.error('Admin validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan sistem'
        });
    }
};

// POST /api/concerts - Menambah konser baru (Admin only)
router.post('/concerts', validateApiKey, validateAdmin, async (req, res) => {
    try {
        const { name, artist, genre, date, time, location, price, description, image_url, music_url } = req.body;

        // Validasi field required
        if (!name || !artist || !genre || !date || !time || !location || !price) {
            return res.status(400).json({
                success: false,
                error: 'Field wajib: name, artist, genre, date, time, location, price'
            });
        }

        // Validasi genre
        const validGenres = ['rock', 'pop', 'jazz', 'electronic'];
        if (!validGenres.includes(genre)) {
            return res.status(400).json({
                success: false,
                error: 'Genre harus salah satu dari: rock, pop, jazz, electronic'
            });
        }

        // Validasi price adalah number
        if (isNaN(price) || price < 0) {
            return res.status(400).json({
                success: false,
                error: 'Price harus berupa angka positif'
            });
        }

        // Validasi format date (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                error: 'Format date harus YYYY-MM-DD (contoh: 2026-03-15)'
            });
        }

        // Validasi format time (HH:MM)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(time)) {
            return res.status(400).json({
                success: false,
                error: 'Format time harus HH:MM (contoh: 19:00, 20:30)'
            });
        }

        // Insert konser baru
        const [result] = await db.query(
            `INSERT INTO concerts (name, artist, genre, date, time, location, price, description, image_url, music_url, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [name, artist, genre, date, time, location, price, description || '', image_url || '/uploads/concerts/default.jpg', music_url || null]
        );

        // Get konser yang baru ditambahkan
        const [newConcert] = await db.query(
            'SELECT * FROM concerts WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Konser berhasil ditambahkan',
            data: newConcert[0]
        });
    } catch (error) {
        console.error('API add concert error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan sistem'
        });
    }
});

module.exports = router;