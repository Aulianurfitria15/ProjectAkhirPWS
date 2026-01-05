const db = require('../config/database');

const adminUserController = {
    // List user
    listUsers: async (req, res) => {
        try {
            const [users] = await db.query('SELECT id, name, email, role FROM users');
            res.render('admin/users', {
                name: req.session.name,
                users,
                success: req.flash('success'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error(error);
            req.flash('error', 'Gagal mengambil data user');
            res.redirect('/admin/dashboard');
        }
    },

    // Show form edit
    showEditUser: async (req, res) => {
        try {
            const { id } = req.params;
            const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
            
            if (!users.length) {
                req.flash('error', 'User tidak ditemukan');
                return res.redirect('/admin/users');
            }

            res.render('admin/edit-user', {
                name: req.session.name,
                user: users[0]
            });
        } catch (error) {
            console.error(error);
            req.flash('error', 'Gagal membuka form edit');
            res.redirect('/admin/users');
        }
    },

    // Edit user
    editUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, role } = req.body;

            await db.query(
                'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
                [name, email, role, id]
            );

            req.flash('success', 'User berhasil diperbarui');
            res.redirect('/admin/users');
        } catch (error) {
            console.error(error);
            req.flash('error', 'Gagal update user');
            res.redirect('/admin/users');
        }
    },

    // Hapus user
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;

            await db.query('DELETE FROM users WHERE id = ?', [id]);

            req.flash('success', 'User berhasil dihapus');
            res.redirect('/admin/users');
        } catch (error) {
            console.error(error);
            req.flash('error', 'Gagal hapus user');
            res.redirect('/admin/users');
        }
    }
};

module.exports = adminUserController;
