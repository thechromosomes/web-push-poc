#!/usr/bin/env node
/**
 * generate-keys.js
 * Run once to produce your VAPID key pair.
 * Paste the output into server.js (or .env).
 */

const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();

console.log('\n✅ New VAPID Keys Generated\n');
console.log('Add these to server.js or your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('\n⚠️  Never commit your private key to version control!\n');
