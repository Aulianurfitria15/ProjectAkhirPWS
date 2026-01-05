const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

const fs = require('fs');

// Pastikan folder ada
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log("Folder dibuat:", dir);
    }
};

ensureDir('uploads/concerts');
ensureDir('uploads/music');


// =======================
// 🔥 Konfigurasi Multer FULL (Gambar + Musik)
// =======================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, 'uploads/concerts/');
        } else if (file.mimetype === "audio/mpeg") {
            cb(null, 'uploads/music/');
        } else {
            cb(new Error("Format file tidak didukung"), null);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

// Filter jenis file
const fileFilter = (req, file, cb) => {
    const imageTypes = /jpeg|jpg|png|gif/;
    const musicTypes = /mp3/;

    const ext = path.extname(file.originalname).toLowerCase();

    if (file.mimetype.startsWith("image/") && imageTypes.test(ext)) {
        cb(null, true);
    } else if (file.mimetype === "audio/mpeg" && musicTypes.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Hanya file JPG/PNG/GIF dan MP3 yang diperbolehkan"));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB untuk musik
    fileFilter
});

// =======================
// 🔥 Semua route butuh admin
// =======================
router.use(isAdmin);

// Dashboard admin
router.get('/dashboard', adminController.dashboard);

// =======================
// 🔥 CRUD Konser (sudah support musik)
// =======================

// Tampilkan form tambah konser
router.get('/concerts/add', adminController.showAddConcert);

// Proses tambah konser (image + music)
router.post(
    '/concerts/add',
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'music', maxCount: 1 }
    ]),
    adminController.addConcert
);

// Tampilkan form edit
router.get('/concerts/edit/:id', adminController.showEditConcert);

// Proses edit
router.post(
    '/concerts/edit/:id',
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'music', maxCount: 1 }
    ]),
    adminController.editConcert
);

// Hapus konser
router.post('/concerts/delete/:id', adminController.deleteConcert);

// =======================
// 🔥 Kelola User
// =======================
const adminUserController = require('../controllers/adminUserController');

router.get('/users', adminUserController.listUsers);
router.get('/users/edit/:id', adminUserController.showEditUser);
router.post('/users/edit/:id', adminUserController.editUser);
router.get('/users/delete/:id', adminUserController.deleteUser);


// =========================
//  FILTER AUDIO
// =========================
const allowedAudio = /mp3|wav|ogg|aac|flac/;

const audioFilter = (req, file, cb) => {
    const extname = allowedAudio.test(
        path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedAudio.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error("Format audio tidak didukung. Gunakan MP3, WAV, OGG, AAC, atau FLAC."));
    }
};



module.exports = router;
