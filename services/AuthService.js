// services/AuthService.js - Firebase Authentication service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  reload,
  deleteUser,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, isFirebaseConfigured, db} from '../firebase';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

class AuthService {
  static DEFAULT_PROFILE_PIC_URL = 'https://ui-avatars.com/api/?name=Hydra+User&background=b7bec8&color=ffffff&size=256';

  /**
   * Register a new user with email and password.
   * Sends a verification email after successful registration.
   * @returns {{ success: boolean, user?: object, error?: string }}
   */
  static async signUp(email, password) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, {
        displayName: credential.user.displayName || 'Hydra User',
        photoURL: credential.user.photoURL || AuthService.DEFAULT_PROFILE_PIC_URL,
      });
      
      // Don't send Firebase's default email - Cloud Function will send custom one!
      // await sendEmailVerification(credential.user); // REMOVE THIS
      
      return { success: true, user: credential.user };
    } catch (e) {
      console.error('❌ Sign up error:', e.code, e.message);
      return { success: false, error: AuthService._friendlyError(e.code) };
    }
  }

  /**
   * Sign in with email and password.
   * Blocks login if the email is not verified.
   * @returns {{ success: boolean, user?: object, error?: string, unverified?: boolean }}
   */
  static async signIn(email, password) {
    if (!isFirebaseConfigured || !auth) {
      return { success: false, error: 'Firebase is not configured.' };
    }
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      // Reload the user to get the latest emailVerified status from the server,
      // since the cached token may not reflect a verification completed after sign-in.
      await reload(credential.user);
      if (!credential.user.emailVerified) {
        await signOut(auth);
        return {
          success: false,
          unverified: true,
          error: 'Please verify your email before signing in. Check your inbox.',
        };
      }
      return { success: true, user: credential.user };
    } catch (e) {
      return { success: false, error: AuthService._friendlyError(e.code) };
    }
  }

  /**
   * Sign out the current user.
   */
  static async signOutUser() {
    if (!isFirebaseConfigured || !auth) return;
    try {
      await signOut(auth);
    } catch (e) {
      console.error('AuthService: signOut error', e);
    }
  }

  /**
   * Re-send verification email to the currently signed-in (unverified) user.
   * @param {object} user - Firebase user object
   */
  static async resendVerification(user) {
    if (!user) return { success: false, error: 'No user provided.' };
    try {
      // Instead of the default Firebase email, we create a doc 
      // that triggers our "onResendRequested" Cloud Function
      await setDoc(doc(db, 'resendRequests', user.uid), {
        requestedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Failed to request resend.' };
    }
  }
  
  static async reauthenticateWithPassword(user, password) {
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      return { success: true };
    } catch (e) {
      return { success: false, error: AuthService._friendlyError(e.code) };
    }
  }

  static async deleteAccount(user, password) {
  try {
    // Step 1: re-authenticate
    const reauth = await AuthService.reauthenticateWithPassword(user, password);

    if (!reauth.success) {
      return reauth;
    }

    // Step 2: delete account
    await deleteUser(user);

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

  /**
   * Subscribe to auth state changes.
   * @param {function} callback - Called with user (or null)
   * @returns {function} unsubscribe
   */
  static onAuthStateChanged(callback) {
    if (!isFirebaseConfigured || !auth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Convert Firebase error codes to user-friendly messages.
   */
  static _friendlyError(code) {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Try signing in.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

export default AuthService;
