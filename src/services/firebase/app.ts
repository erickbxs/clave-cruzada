import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY ?? "").trim(),
  authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "").trim(),
  projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "").trim(),
  storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "").trim(),
  messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "").trim(),
  databaseURL: String(import.meta.env.VITE_FIREBASE_DATABASE_URL ?? "").trim(),
  appId: String(import.meta.env.VITE_FIREBASE_APP_ID ?? "").trim(),
  measurementId: String(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "").trim(),
};

function validateFirebaseConfig() {
  const requiredFields = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];

  const missing = requiredFields.filter((field) => !firebaseConfig[field as keyof typeof firebaseConfig]);

  if (missing.length > 0) {
    throw new Error(`Faltam variáveis Firebase no .env: ${missing.join(", ")}`);
  }
}

export function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  validateFirebaseConfig();
  return initializeApp(firebaseConfig);
}
