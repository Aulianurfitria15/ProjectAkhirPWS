// Script untuk cek dan membuat akun admin
const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function checkAndCreateAdmin() {
    try {
        // Cek akun admin yang ada
        console.log('Checking admin accounts...\n');
        const [users] = await db.query("SELECT id, name, email, role FROM users WHERE role = 'admin' OR email LIKE '%admin%'");
        
        if (users.length > 0) {
            console.log('Admin accounts found:');
            users.forEach(user => {
                console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
            });
        } else {
            console.log('No admin accounts found.');
        }

        // Tanya apakah ingin membuat admin baru
        console.log('\n---\nCreating new admin account...\n');
        
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE role = 'admin'",
            ['Administrator', 'admin@konser.com', hashedPassword, 'admin']
        );
        
        console.log('✓ Admin account created/updated successfully!');
        console.log('Email: admin@konser.com');
        console.log('Password: admin123\n');

        // Tampilkan semua admin lagi
        const [finalUsers] = await db.query("SELECT id, name, email, role FROM users WHERE role = 'admin'");
        console.log('Current admin accounts:');
        finalUsers.forEach(user => {
            console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAndCreateAdmin();