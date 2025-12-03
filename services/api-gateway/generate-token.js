#!/usr/bin/env node

/**
 * JWT Token Generator for Testing
 * 
 * Usage:
 *   node generate-token.js
 *   node generate-token.js buyer
 *   node generate-token.js seller user-456 seller@example.com
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const roles = {
    buyer: {
        id: 'buyer-1',
        email: 'buyer@example.com',
        role: 'buyer',
    },
    seller: {
        id: 'seller-1',
        email: 'seller@example.com',
        role: 'seller',
    },
    admin: {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
    },
};

function generateToken(role = 'buyer', userId = null, email = null) {
    const user = roles[role] || roles.buyer;

    const payload = {
        id: userId || user.id,
        email: email || user.email,
        role: role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return { token, payload };
}

// CLI usage
const args = process.argv.slice(2);
const role = args[0] || 'buyer';
const userId = args[1];
const email = args[2];

const { token, payload } = generateToken(role, userId, email);

console.log('\n🔑 JWT Token Generated\n');
console.log('Payload:');
console.log(JSON.stringify(payload, null, 2));
console.log('\nToken:');
console.log(token);
console.log('\nUsage:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:8000/api/v1/orders\n`);

// Export for programmatic use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateToken };
}
