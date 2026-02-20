/**
 * Generate a secure JWT secret key
 * Run: node scripts/generateJwtSecret.js
 */
const crypto = require('crypto');

console.log('\n🔐 Generating Secure JWT Secret...\n');

// Generate 64-byte random string
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('Your JWT Secret (copy this to .env file):');
console.log('━'.repeat(130));
console.log(jwtSecret);
console.log('━'.repeat(130));

console.log('\n📝 Update your .env file:');
console.log(`JWT_SECRET=${jwtSecret}`);

console.log('\n✅ Keep this secret safe! Never commit it to git.\n');
