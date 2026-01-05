const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

// Konfigurasi multer untuk upload gambar
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/concerts/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'concert-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Hanya file gambar (JPG, PNG, GIF) yang diperbolehkan'));
        }
    }
});

// Semua route membutuhkan autentikasi admin
router.use(isAdmin);

// Dashboard admin
router.get('/dashboard', adminController.dashboard);

// CRUD Konser
router.get('/concerts/add', adminController.showAddConcert);
router.post('/concerts/add', upload.single('image'), adminController.addConcert);
router.get('/concerts/edit/:id', adminController.showEditConcert);
router.post('/concerts/edit/:id', upload.single('image'), adminController.editConcert);
router.post('/concerts/delete/:id', adminController.deleteConcert);

// ========== Kelola User ==========

const adminUserController = require('../controllers/adminUserController');

// List semua user
router.get('/users', adminUserController.listUsers);

// Form edit user
router.get('/users/edit/:id', adminUserController.showEditUser);

// Proses edit user
router.post('/users/edit/:id', adminUserController.editUser);

// Hapus user
router.get('/users/delete/:id', adminUserController.deleteUser);


module.exports = router;