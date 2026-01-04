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

            // Handle gambar - jika ada file upload, gunakan path file, jika tidak gunakan placeholder
            const image_url = req.file ? `/uploads/concerts/${req.file.filename}` : 'https://via.placeholder.com/400x300';

            await db.query(
                'INSERT INTO concerts (title, artist, date, time, location, price, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [title, artist, date, time, location, price, description || '', image_url]
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

            // Ambil data konser lama untuk mendapatkan image_url yang ada
            const [concerts] = await db.query('SELECT image_url FROM concerts WHERE id = ?', [id]);
            
            if (concerts.length === 0) {
                req.flash('error', 'Konser tidak ditemukan');
                return res.redirect('/admin/dashboard');
            }

            // Handle gambar - jika ada file upload baru, gunakan yang baru, jika tidak pertahankan yang lama
            const image_url = req.file ? `/uploads/concerts/${req.file.filename}` : concerts[0].image_url;

            await db.query(
                'UPDATE concerts SET title = ?, artist = ?, date = ?, time = ?, location = ?, price = ?, description = ?, image_url = ? WHERE id = ?',
                [title, artist, date, time, location, price, description || '', image_url, id]
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