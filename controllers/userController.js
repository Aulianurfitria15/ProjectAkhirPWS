const db = require('../config/database');
const { generateApiKey } = require('../utils/helpers');

const userController = {
    // Dashboard user
    dashboard: async (req, res) => {
        try {
            // Ambil API key user jika ada
            const [apiKeys] = await db.query(
                'SELECT * FROM api_keys WHERE user_id = ? AND is_active = TRUE ORDER BY created_at DESC LIMIT 1',
                [req.session.userId]
            );

            res.render('user/dashboard', {
                name: req.session.name,
                apiKey: apiKeys.length > 0 ? apiKeys[0] : null,
                success: req.flash('success'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('User dashboard error:', error);
            req.flash('error', 'Terjadi kesalahan sistem');
            res.redirect('/user/dashboard');
        }
    },

    // Generate API Key
    generateApiKey: async (req, res) => {
        try {
            const userId = req.session.userId;

            // Non-aktifkan API key lama jika ada
            await db.query(
                'UPDATE api_keys SET is_active = FALSE WHERE user_id = ?',
                [userId]
            );

            // Generate API key baru
            const newApiKey = generateApiKey();

            // Simpan ke database
            await db.query(
                'INSERT INTO api_keys (user_id, api_key) VALUES (?, ?)',
                [userId, newApiKey]
            );

            req.flash('success', 'API Key berhasil di-generate!');
            res.redirect('/user/dashboard');
        } catch (error) {
            console.error('Generate API key error:', error);
            req.flash('error', 'Terjadi kesalahan sistem');
            res.redirect('/user/dashboard');
        }
    },

    // Validasi API Key dan tampilkan daftar konser
    validateApiKey: async (req, res) => {
        try {
            const { api_key } = req.body;
            const userId = req.session.userId;

            if (!api_key) {
                req.flash('error', 'API Key harus diisi');
                return res.redirect('/user/dashboard');
            }

            // Cek apakah API key valid dan milik user ini
            const [apiKeys] = await db.query(
                'SELECT * FROM api_keys WHERE api_key = ? AND user_id = ? AND is_active = TRUE',
                [api_key, userId]
            );

            if (apiKeys.length === 0) {
                req.flash('error', 'API Key tidak valid atau sudah tidak aktif');
                return res.redirect('/user/dashboard');
            }

            // Jika valid, redirect ke halaman daftar konser
            res.redirect('/user/concerts');
        } catch (error) {
            console.error('Validate API key error:', error);
            req.flash('error', 'Terjadi kesalahan sistem');
            res.redirect('/user/dashboard');
        }
    },

    // Tampilkan daftar konser
    showConcerts: async (req, res) => {
        try {
            // Cek apakah user punya API key yang aktif
            const [apiKeys] = await db.query(
                'SELECT * FROM api_keys WHERE user_id = ? AND is_active = TRUE',
                [req.session.userId]
            );

            if (apiKeys.length === 0) {
                req.flash('error', 'Anda harus memiliki API Key aktif untuk melihat daftar konser');
                return res.redirect('/user/dashboard');
            }

            // Ambil semua konser
            const [concerts] = await db.query('SELECT * FROM concerts ORDER BY date ASC');

            res.render('user/concerts', {
                name: req.session.name,
                concerts: concerts,
                success: req.flash('success'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Show concerts error:', error);
            req.flash('error', 'Terjadi kesalahan sistem');
            res.redirect('/user/dashboard');
        }
    }
};



module.exports = userController;