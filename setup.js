#!/usr/bin/env node
// EduMeet Firebase Setup Helper
// Run: node setup.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

async function main() {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║           EduMeet Firebase Setup                ║
  ║  Paste your Firebase credentials when prompted  ║
  ╚══════════════════════════════════════════════════╝
  `);

  console.log('\n📋 Step 1: Firebase Web App Config');
  console.log('   Get this from: Firebase Console → Project Settings → General → Your apps → Web app');
  console.log('   (The config object looks like: { apiKey: "...", authDomain: "...", ... })\n');

  const apiKey = await ask('  VITE_FIREBASE_API_KEY: ');
  const authDomain = await ask('  VITE_FIREBASE_AUTH_DOMAIN: ');
  const projectId = await ask('  VITE_FIREBASE_PROJECT_ID: ');
  const storageBucket = await ask('  VITE_FIREBASE_STORAGE_BUCKET: ');
  const messagingSenderId = await ask('  VITE_FIREBASE_MESSAGING_SENDER_ID: ');
  const appId = await ask('  VITE_FIREBASE_APP_ID: ');
  const databaseURL = await ask('  VITE_FIREBASE_DATABASE_URL (from Realtime Database): ');

  console.log('\n📋 Step 2: Firebase Service Account (Server)');
  console.log('   Get this from: Firebase Console → Project Settings → Service accounts → Generate new private key');
  console.log('   Open the downloaded JSON file and paste the values:\n');

  const saProjectId = await ask(`  Service Account project_id (press Enter to use "${projectId}"): `);
  const privateKey = await ask('  Service Account private_key (paste the full value including -----BEGIN PRIVATE KEY-----): ');
  const clientEmail = await ask('  Service Account client_email: ');

  const finalProjectId = saProjectId || projectId;

  // Write client .env
  const clientEnv = `VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=${apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${authDomain}
VITE_FIREBASE_PROJECT_ID=${projectId}
VITE_FIREBASE_STORAGE_BUCKET=${storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
VITE_FIREBASE_APP_ID=${appId}
VITE_FIREBASE_DATABASE_URL=${databaseURL}
`;

  // Write server .env
  const serverEnv = `PORT=5000
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=${finalProjectId}
FIREBASE_PRIVATE_KEY="${privateKey}"
FIREBASE_CLIENT_EMAIL=${clientEmail}

# JWT
JWT_SECRET=edu-meet-jwt-secret-${Math.random().toString(36).substring(2, 10)}
JWT_EXPIRES_IN=7d

# Cloudflare R2 (optional - for file storage)
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=zoom-classroom
R2_PUBLIC_URL=

# LiveKit (optional - for video calls)
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=

# CORS
CLIENT_URL=http://localhost:5173
`;

  fs.writeFileSync(path.join(__dirname, 'client', '.env'), clientEnv);
  fs.writeFileSync(path.join(__dirname, 'server', '.env'), serverEnv);

  console.log('\n✅ .env files written successfully!');
  console.log(`   - client/.env`);
  console.log(`   - server/.env`);

  console.log('\n📋 Next steps:');
  console.log('   1. Open server/.env and verify the private key is correct');
  console.log('   2. cd server && npm run dev    (starts backend on port 5000)');
  console.log('   3. cd client && npm run dev    (starts frontend on port 5173)');
  console.log('   4. Open http://localhost:5173 in your browser');
  console.log('   5. Register a new account and start using EduMeet!\n');

  rl.close();
}

main().catch(console.error);
