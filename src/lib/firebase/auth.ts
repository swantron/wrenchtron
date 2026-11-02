import {
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirebaseAuth } from "./config";

const googleProvider = new GoogleAuthProvider();

/** Remembers which address a sign-in link went to, so opening it on the same device needs no retyping. */
const EMAIL_FOR_SIGN_IN_KEY = "emailForSignIn";

export async function signInWithGoogle() {
  return signInWithPopup(getFirebaseAuth(), googleProvider);
}

/**
 * Emails a one-time sign-in link (no password). Techs and partner shops won't all
 * have Google accounts. The link comes back to /login, which finishes signing in
 * and then goes to `next`.
 */
export async function sendSignInLink(email: string, next: string) {
  const url = `${window.location.origin}/login?next=${encodeURIComponent(next)}`;
  await sendSignInLinkToEmail(getFirebaseAuth(), email, { url, handleCodeInApp: true });
  try {
    localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
  } catch {
    // Private mode — they'll be asked to confirm the address when the link opens
  }
}

export function isEmailSignInLink(href: string): boolean {
  return isSignInWithEmailLink(getFirebaseAuth(), href);
}

/** The address the link was sent to, if it was sent from this browser. */
export function storedSignInEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
  } catch {
    return null;
  }
}

export async function completeEmailLinkSignIn(email: string, href: string) {
  const result = await signInWithEmailLink(getFirebaseAuth(), email, href);
  try {
    localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
  } catch {
    // Nothing to clean up
  }
  return result;
}

export async function signOut() {
  return firebaseSignOut(getFirebaseAuth());
}
