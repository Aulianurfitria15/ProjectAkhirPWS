const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const apiRoutes = require('./routes/api');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Flash messages
app.use(flash());

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/api', apiRoutes);

// Home route - redirect to login
app.get('/', (req, res) => {
    if (req.session && req.session.userId) {
        if (req.session.role === 'admin') {
            return res.redirect('/admin/dashboard');
        }
        return res.redirect('/user/dashboard');
    }
    res.redirect('/login');
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('404 - Halaman tidak ditemukan');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('500 - Terjadi kesalahan server');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on:http://localhost:${PORT}`);
});

app.use('/uploads/music', express.static('uploads/music'));

module.exports = app;