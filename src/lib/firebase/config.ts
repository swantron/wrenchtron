import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  enableIndexedDbPersistence,
  type Firestore,
} from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Local testing against `firebase emulators:start --project demo-wrenchtron`:
 * run the dev server with NEXT_PUBLIC_FIREBASE_EMULATORS=1 and
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-wrenchtron. Ports match firebase.json.
 */
const useEmulators = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "1";

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;
let _storage: FirebaseStorage | undefined;

function getFirebaseApp() {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return _app;
}

export function getFirebaseAuth() {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
    if (useEmulators) connectAuthEmulator(_auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  return _auth;
}

export function getFirebaseDb() {
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
    if (useEmulators) connectFirestoreEmulator(_db, "127.0.0.1", 8080);
    if (typeof window !== "undefined" && !useEmulators) {
      enableIndexedDbPersistence(_db).catch((err) => {
        if (err.code === "failed-precondition") {
          console.warn("Firestore persistence unavailable: multiple tabs open");
        } else if (err.code === "unimplemented") {
          console.warn("Firestore persistence not supported by this browser");
        }
      });
    }
  }
  return _db;
}

export function getFirebaseStorage() {
  if (!_storage) {
    _storage = getStorage(getFirebaseApp());
    if (useEmulators) connectStorageEmulator(_storage, "127.0.0.1", 9199);
  }
  return _storage;
}
