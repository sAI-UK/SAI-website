// src/services/userService.ts
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  headline?: string;
  createdAt: any;
  updatedAt: any;
}

// Ensure user profile document exists upon login
export async function syncUserProfileOnLogin(user: User) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'User',
      photoURL: user.photoURL || '',
      bio: '',
      headline: 'Member',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// Update profile data in Firestore
export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Real-time listener for profile changes
export function subscribeToUserProfile(userId: string, cb: (profile: UserProfile) => void) {
  return onSnapshot(doc(db, 'users', userId), (snap) => {
    if (snap.exists()) cb(snap.data() as UserProfile);
  });
}
