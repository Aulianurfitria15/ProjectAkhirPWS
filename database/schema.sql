-- Buat database
CREATE DATABASE IF NOT EXISTS info_konser_db;
USE info_konser_db;

-- Tabel users (untuk admin dan user)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel concerts
CREATE TABLE concerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    artist VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel api_keys
CREATE TABLE api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin account
-- Password: admin123 (hashed dengan bcrypt)
INSERT INTO users (name, email, password, role) 
VALUES ('Administrator', 'admin@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert sample concerts (optional)
INSERT INTO concerts (title, artist, date, time, location, price, description, image_url) VALUES
('Rock Festival 2026', 'The Rockers', '2026-02-15', '19:00:00', 'Jakarta Convention Center', 500000.00, 'Festival rock terbesar tahun ini dengan berbagai band ternama', 'https://via.placeholder.com/400x300'),
('Jazz Night', 'Smooth Jazz Band', '2026-03-20', '20:00:00', 'Balai Sarbini', 350000.00, 'Malam jazz dengan suasana yang intimate dan elegant', 'https://via.placeholder.com/400x300'),
('Pop Extravaganza', 'Pop Stars', '2026-04-10', '18:30:00', 'Gelora Bung Karno', 750000.00, 'Konser pop dengan teknologi panggung terkini', 'https://via.placeholder.com/400x300');
