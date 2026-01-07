const db = require('../config/database');

const adminController = {
    // Dashboard admin
    dashboard: async (req, res) => {
        try {
            const [concerts] = await db.query('SELECT * FROM concerts ORDER BY date DESC');
            
            res.render('admin/dashboard', {
                name: req.session.name,
                concerts: concerts,
                success: req.flash('success'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Admin dashboard error:', error);
            req.flash('error', 'Terjadi kesalahan sistem');
            res.redirect('/admin/dashboard');
        }
    },

    // Tampilkan form tambah konser
    showAddConcert: (req, res) => {
        res.render('admin/add-concert', {
            name: req.session.name,
            error: req.flash('error')
        });
    },

    // Proses tambah konser
    addConcert: async (req, res) => {
        try {
            const { title, artist, date, time, location, price, description } = req.body;

            // Validasi
            if (!title || !artist || !date || !time || !location || !price) {
                req.flash('error', 'Semua field wajib diisi kecuali deskripsi dan gambar');
                return res.redirect('/admin/concerts/add');
            }

            // Handle multiple files (image dan music)
            let image_url = 'https://via.placeholder.com/400x300';
            let music_url = null;

            if (req.files) {
                if (req.files.image && req.files.image[0]) {
                    image_url = `/uploads/concerts/${req.files.image[0].filename}`;
                }
                if (req.files.music && req.files.music[0]) {
                    music_url = `/uploads/music/${req.files.music[0].filename}`;
                }
            }

            await db.query(
                'INSERT INTO concerts (title, artist, date, time, location, price, description, image_url, music_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [title, artist, date, time, location, price, description || '', image_url, music_url]
            );

            req.flash('success', 'Konser berhasil ditambahkan');
            res.redirect('/admin/dashboard');
        } catch (error) {
            console.error('Add concert error:', error);
            req.flash('error', 'Terjadi kesalahan sistem');
            res.redirect('/admin/concerts/add');
        }
    },

    // Tampilkan form edit konser
    showEditConcert: async (req, res) => {
        try {
            const { id } = req.params;
            const [concerts] = await db.query('SELECT * FROM concerts WHERE id = ?', [id]);

            if (concerts.length === 0) {
                req.flash('error', 'Konser tidak ditemukan');
                return res.redirect('/admin/dashboard');
            }

            res.render('admin/edit-concert', {
                name: req.session.name,
                concert: concerts[0],
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Show edit concert error:', error);
            req.flash('error', 'Terjadi kesalahan sistem');
            res.redirect('/admin/dashboard');
        }
    },

    // Proses edit konser
    editConcert: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, artist, date, time, location, price, description } = req.body;

            // Validasi
            if (!title || !artist || !date || !time || !location || !price) {
                req.flash('error', 'Semua field wajib diisi kecuali deskripsi dan gambar');
                return res.redirect(`/admin/concerts/edit/${id}`);
            }

            // Ambil data konser lama untuk mendapatkan image_url dan music_url yang ada
            const [concerts] = await db.query('SELECT image_url, music_url FROM concerts WHERE id = ?', [id]);
            
            if (concerts.length === 0) {
                req.flash('error', 'Konser tidak ditemukan');
                return res.redirect('/admin/dashboard');
            }

            // Handle multiple files
            let image_url = concerts[0].image_url;
            let music_url = concerts[0].music_url;

            if (req.files) {
                if (req.files.image && req.files.image[0]) {
                    image_url = `/uploads/concerts/${req.files.image[0].filename}`;
                }
                if (req.files.music && req.files.music[0]) {
                    music_url = `/uploads/music/${req.files.music[0].filename}`;
                }
            }

            await db.query(
                'UPDATE concerts SET title = ?, artist = ?, date = ?, time = ?, location = ?, price = ?, description = ?, image_url = ?, music_url = ? WHERE id = ?',
                [title, artist, date, time, location, price, description || '', image_url, music_url, id]
            );

            req.flash('success', 'Konser berhasil diupdate');
            res.redirect('/admin/dashboard');
        } catch (error) {
            console.error('Edit concert error:', error);
            req.flash('error', 'Terjadi kesalahan sistem');
            res.redirect(`/admin/concerts/edit/${id}`);
        }
    },

    // Hapus konser
    deleteConcert: async (req, res) => {
        try {
            const { id } = req.params;
            await db.query('DELETE FROM concerts WHERE id = ?', [id]);

            req.flash('success', 'Konser berhasil dihapus');
            res.redirect('/admin/dashboard');
        } catch (error) {
            console.error('Delete concert error:', error);
            req.flash('error', 'Terjadi kesalahan sistem');
            res.redirect('/admin/dashboard');
        }
    }
};

module.exports = adminController;