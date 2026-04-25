// services/AuthService.js - Supabase Authentication service
import { supabase, isSupabaseConfigured } from '../supabase';

class AuthService {
  /**
   * Register a new user with email and password.
   * Supabase sends a verification email automatically.
   * @returns {{ success: boolean, user?: object, error?: string }}
   */
  static async signUp(email, password) {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured.' };
    }
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { success: false, error: AuthService._friendlyError(error) };
      return { success: true, user: data.user };
    } catch (e) {
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  }

  /**
   * Sign in with email and password.
   * Blocks login if the email is not verified.
   * @returns {{ success: boolean, user?: object, error?: string, unverified?: boolean }}
   */
  static async signIn(email, password) {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured.' };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: AuthService._friendlyError(error) };

      const user = data.user;
      if (!user.email_confirmed_at) {
        await supabase.auth.signOut();
        return {
          success: false,
          unverified: true,
          error: 'Please verify your email before signing in. Check your inbox.',
        };
      }
      return { success: true, user };
    } catch (e) {
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  }

  /**
   * Sign out the current user.
   */
  static async signOutUser() {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('AuthService: signOut error', e);
    }
  }

  /**
   * Re-send verification email to the provided email address.
   * @param {string} email - The email address to resend verification to
   */
  static async resendVerification(email) {
    if (!email) return { success: false, error: 'No email provided.' };
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) return { success: false, error: AuthService._friendlyError(error) };
      return { success: true };
    } catch (e) {
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  }

  /**
   * Subscribe to auth state changes.
   * @param {function} callback - Called with user (or null)
   * @returns {function} unsubscribe
   */
  static onAuthStateChanged(callback) {
    if (!isSupabaseConfigured) {
      callback(null);
      return () => {};
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }

  /**
   * Convert Supabase errors to user-friendly messages.
   */
  static _friendlyError(error) {
    const msg = (error?.message ?? '').toLowerCase();
    if (msg.includes('user already registered') || msg.includes('already been registered')) {
      return 'This email is already registered. Try signing in.';
    }
    if (msg.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (msg.includes('password should be at least') || msg.includes('weak password')) {
      return 'Password must be at least 6 characters.';
    }
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return 'Incorrect email or password.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Please verify your email before signing in. Check your inbox.';
    }
    if (msg.includes('too many requests') || msg.includes('rate limit')) {
      return 'Too many attempts. Please try again later.';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Network error. Check your connection and try again.';
    }
    return error?.message || 'An unexpected error occurred. Please try again.';
  }
}

export default AuthService;
