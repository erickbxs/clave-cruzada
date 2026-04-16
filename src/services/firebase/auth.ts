import { getAuth as firebaseGetAuth, signInAnonymously, type Auth } from "firebase/auth";
import { getFirebaseApp } from "./app";

let authInstance: Auth | null = null;

function getAuthInstance(): Auth {
  if (!authInstance) {
    authInstance = firebaseGetAuth(getFirebaseApp());
  }
  return authInstance;
}

export async function initAuth() {
  const auth = getAuthInstance();
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser;
}

export function getAuth() {
  return getAuthInstance();
}
