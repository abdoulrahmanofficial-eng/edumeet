import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from './index';

function getDatabaseURL(): string {
  if (config.firebase.databaseURL) return config.firebase.databaseURL;
  return `https://${config.firebase.projectId}-default-rtdb.firebaseio.com`;
}

const firebaseApp = initializeApp({
  credential: cert({
    projectId: config.firebase.projectId,
    privateKey: config.firebase.privateKey,
    clientEmail: config.firebase.clientEmail,
  }),
  databaseURL: getDatabaseURL(),
});

export const auth = getAuth();
export const db = getDatabase();
export const firestore = getFirestore();
export default firebaseApp;
