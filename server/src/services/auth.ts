import { auth, db } from '../config/firebase';
import { User, UserRole } from '../types';
import { toTimestamp } from '../utils/helpers';

export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'student'
): Promise<{ user: User; customToken: string }> {
  const userRecord = await auth.createUser({
    email,
    password,
    displayName,
  });

  await auth.setCustomUserClaims(userRecord.uid, { role });

  const user: User = {
    id: userRecord.uid,
    uid: userRecord.uid,
    email: userRecord.email || email,
    displayName,
    photoURL: '',
    role,
    createdAt: toTimestamp(),
  };

  await db.ref(`users/${userRecord.uid}`).set(user);

  const customToken = await auth.createCustomToken(userRecord.uid, { role });

  return { user, customToken };
}

export async function getUserRole(uid: string): Promise<string> {
  try {
    const userRecord = await auth.getUser(uid);
    const claims = userRecord.customClaims;
    return claims?.role || 'student';
  } catch {
    return 'student';
  }
}

export async function resetPassword(email: string): Promise<void> {
  await auth.generatePasswordResetLink(email);
}

export async function verifyEmail(user: User): Promise<void> {
  await auth.generateEmailVerificationLink(user.email);
}

export async function getUserData(uid: string): Promise<User | null> {
  const snapshot = await db.ref(`users/${uid}`).once('value');
  const data = snapshot.val();
  if (!data) return null;

  const userRecord = await auth.getUser(uid);
  return {
    ...data,
    email: userRecord.email || data.email,
  };
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<User, 'displayName' | 'photoURL'>>
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (data.displayName) updates.displayName = data.displayName;
  if (data.photoURL) updates.photoURL = data.photoURL;

  if (Object.keys(updates).length > 0) {
    await db.ref(`users/${uid}`).update(updates);
  }
}
