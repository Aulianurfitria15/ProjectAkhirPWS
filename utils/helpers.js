const crypto = require('crypto');

// Generate random API key
const generateApiKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

// Format date
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Format time
const formatTime = (time) => {
    return time.substring(0, 5); // HH:MM
};

module.exports = {
    generateApiKey,
    formatCurrency,
    formatDate,
    formatTime
};