const bcrypt = require('bcryptjs');
const db = require('../config/database');

const authController = {
    // Tampilkan halaman login
    showLogin: (req, res) => {
        res.render('login', {
            error: req.flash('error'),
            success: req.flash('success')
        });
    },

    // Proses login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validasi input
            if (!email || !password) {
                req.flash('error', 'Email dan password harus diisi');
                return res.redirect('/login');
            }

            // Cari user berdasarkan email
            const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            
            if (users.length === 0) {
                req.flash('error', 'Email atau password salah');
                return res.redirect('/login');
            }

            const user = users[0];

            // Verifikasi password
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                req.flash('error', 'Email atau password salah');
                return res.redirect('/login');
            }

            // Set session
            req.session.userId = user.id;
            req.session.name = user.name;
            req.session.email = user.email;
            req.session.role = user.role;

            // Debug log
            console.log('Login Success:', {
                userId: user.id,
                email: user.email,
                role: user.role,
                sessionRole: req.session.role
            });

            // Save session explicitly before redirect
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    req.flash('error', 'Terjadi kesalahan saat login');
                    return res.redirect('/login');
                }

                // Redirect berdasarkan role
                if (user.role === 'admin') {
                    return res.redirect('/admin/dashboard');
                } else {
                    return res.redirect('/user/dashboard');
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            req.flash('error', 'Terjadi kesalahan sistem');
            res.redirect('/login');
        }
    },

    // Tampilkan halaman register
    showRegister: (req, res) => {
        res.render('register', {
            error: req.flash('error'),
            success: req.flash('success')
        });
    },

    // Proses register
    register: async (req, res) => {
        try {
            const { name, email, password, confirmPassword, role } = req.body;

            // Validasi input
            if (!name || !email || !password || !confirmPassword) {
                req.flash('error', 'Semua field harus diisi');
                return res.redirect('/register');
            }

            if (password !== confirmPassword) {
                req.flash('error', 'Password dan konfirmasi password tidak cocok');
                return res.redirect('/register');
            }

            if (password.length < 6) {
                req.flash('error', 'Password minimal 6 karakter');
                return res.redirect('/register');
            }

            // Validasi role (hanya admin atau user yang diperbolehkan)
            const userRole = role && (role === 'admin' || role === 'user') ? role : 'user';

            // Cek apakah email sudah terdaftar
            const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            
            if (existingUsers.length > 0) {
                req.flash('error', 'Email sudah terdaftar');
                return res.redirect('/register');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user baru dengan role dari request atau default 'user'
            await db.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, userRole]
            );

            console.log('Register Success:', { email, role: userRole });

            req.flash('success', 'Registrasi berhasil! Silakan login');
            res.redirect('/login');

        } catch (error) {
            console.error('Register error:', error);
            req.flash('error', 'Terjadi kesalahan sistem');
            res.redirect('/register');
        }
    },

    // Logout
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
            }
            res.redirect('/login');
        });
    }
};

module.exports = authController;