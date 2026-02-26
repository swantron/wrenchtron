import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirebaseAuth } from "./config";

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  return signInWithRedirect(getFirebaseAuth(), googleProvider);
}

export async function getGoogleRedirectResult() {
  return getRedirectResult(getFirebaseAuth());
}

export async function signOut() {
  return firebaseSignOut(getFirebaseAuth());
}
