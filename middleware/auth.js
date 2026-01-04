// Middleware untuk cek apakah user sudah login
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    req.flash('error', 'Silakan login terlebih dahulu');
    res.redirect('/login');
};

// Middleware untuk cek apakah user adalah admin
const isAdmin = (req, res, next) => {
    console.log('isAdmin check:', {
        userId: req.session.userId,
        role: req.session.role,
        sessionData: req.session
    });
    
    if (req.session && req.session.userId && req.session.role === 'admin') {
        return next();
    }
    req.flash('error', 'Anda tidak memiliki akses ke halaman ini');
    res.redirect('/login');
};

// Middleware untuk cek apakah user adalah user biasa
const isUser = (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === 'user') {
        return next();
    }
    req.flash('error', 'Anda tidak memiliki akses ke halaman ini');
    res.redirect('/login');
};

// Middleware untuk redirect jika sudah login
const redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        if (req.session.role === 'admin') {
            return res.redirect('/admin/dashboard');
        }
        return res.redirect('/user/dashboard');
    }
    next();
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isUser,
    redirectIfAuthenticated
};