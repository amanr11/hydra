// screens/AuthScreen.js - Email/password authentication with email verification
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

import GradientBackground from '../components/GradientBackground';
import { COLOR } from '../components/Theme';
import AuthService from '../services/AuthService';

const VIEWS = {
  SIGN_IN: 'sign_in',
  SIGN_UP: 'sign_up',
  VERIFY_EMAIL: 'verify_email',
};

export default function AuthScreen({ onAuthenticated }) {
  const [view, setView] = useState(VIEWS.SIGN_IN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // The email used during sign-up (used for resend verification)
  const [pendingEmail, setPendingEmail] = useState('');

  const handleSignIn = useCallback(async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await AuthService.signIn(email.trim(), password);
      if (result.success) {
        onAuthenticated(result.user);
      } else if (result.unverified) {
        Alert.alert('Email Not Verified', result.error);
      } else {
        Alert.alert('Sign In Failed', result.error);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, onAuthenticated]);

  const handleSignUp = useCallback(async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const result = await AuthService.signUp(email.trim(), password);
      if (result.success) {
        setPendingUser(result.user);
        setView(VIEWS.VERIFY_EMAIL);
      } else {
        Alert.alert('Sign Up Failed', result.error);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword]);

  const handleResendVerification = useCallback(async () => {
    if (!pendingUser) return;
    setLoading(true);
    try {
      const result = await AuthService.resendVerification(pendingUser);
      if (result.success) {
        Alert.alert('Email Sent', 'Verification email resent. Please check your inbox.');
      } else {
        Alert.alert('Error', result.error);
      }
    } finally {
      setLoading(false);
    }
  }, [pendingUser]);

  const inputStyle = {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 14,
    color: COLOR.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 14,
  };

  const labelStyle = {
    color: COLOR.white,
    opacity: 0.8,
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500',
  };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <Animatable.View animation="fadeInDown" style={{ alignItems: 'center', marginBottom: 36 }}>
              <Text
                style={{
                  fontSize: 56,
                  fontWeight: '900',
                  color: COLOR.white,
                  textShadowColor: 'rgba(0,0,0,0.7)',
                  textShadowOffset: { width: -2, height: 3 },
                  textShadowRadius: 6,
                  letterSpacing: -1,
                }}
              >
                hydra
              </Text>
              <Text style={{ color: COLOR.aquaMint, fontSize: 15, fontWeight: '500', marginTop: 4 }}>
                Stay hydrated. Stay healthy.
              </Text>
            </Animatable.View>

            {/* ---- VERIFY EMAIL VIEW ---- */}
            {view === VIEWS.VERIFY_EMAIL && (
              <Animatable.View animation="fadeInUp">
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>📧</Text>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: '700',
                      color: COLOR.white,
                      textAlign: 'center',
                      marginBottom: 12,
                    }}
                  >
                    Check your inbox
                  </Text>
                  <Text
                    style={{
                      color: COLOR.white,
                      opacity: 0.8,
                      textAlign: 'center',
                      lineHeight: 22,
                      fontSize: 15,
                    }}
                  >
                    We sent a verification email to{' '}
                    <Text style={{ color: COLOR.aquaMint, fontWeight: '600' }}>{email}</Text>.
                    {'\n\n'}Open the link in that email to verify your account, then sign in below.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleResendVerification}
                  disabled={loading}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    padding: 14,
                    alignItems: 'center',
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.25)',
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color={COLOR.white} />
                  ) : (
                    <Text style={{ color: COLOR.white, fontWeight: '600', fontSize: 15 }}>
                      📨 Resend Verification Email
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setView(VIEWS.SIGN_IN)}
                  style={{
                    backgroundColor: COLOR.skyBlue,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: COLOR.white, fontWeight: '700', fontSize: 16 }}>
                    Go to Sign In
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
            )}

            {/* ---- SIGN IN VIEW ---- */}
            {view === VIEWS.SIGN_IN && (
              <Animatable.View animation="fadeInUp">
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: COLOR.white,
                    marginBottom: 24,
                    textAlign: 'center',
                  }}
                >
                  Welcome back 👋
                </Text>

                <Text style={labelStyle}>Email</Text>
                <TextInput
                  style={inputStyle}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={labelStyle}>Password</Text>
                <View style={{ position: 'relative', marginBottom: 14 }}>
                  <TextInput
                    style={[inputStyle, { marginBottom: 0, paddingRight: 48 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: 14,
                    }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="rgba(255,255,255,0.6)"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleSignIn}
                  disabled={loading}
                  style={{
                    backgroundColor: COLOR.skyBlue,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                    marginBottom: 14,
                    marginTop: 6,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color={COLOR.white} />
                  ) : (
                    <Text style={{ color: COLOR.white, fontWeight: '700', fontSize: 16 }}>
                      Sign In
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setPassword('');
                    setConfirmPassword('');
                    setView(VIEWS.SIGN_UP);
                  }}
                  style={{ alignItems: 'center', paddingVertical: 8 }}
                >
                  <Text style={{ color: COLOR.aquaMint, fontSize: 14 }}>
                    Don't have an account?{' '}
                    <Text style={{ fontWeight: '700' }}>Sign up</Text>
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
            )}

            {/* ---- SIGN UP VIEW ---- */}
            {view === VIEWS.SIGN_UP && (
              <Animatable.View animation="fadeInUp">
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: COLOR.white,
                    marginBottom: 24,
                    textAlign: 'center',
                  }}
                >
                  Create account 💧
                </Text>

                <Text style={labelStyle}>Email</Text>
                <TextInput
                  style={inputStyle}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={labelStyle}>Password</Text>
                <View style={{ position: 'relative', marginBottom: 14 }}>
                  <TextInput
                    style={[inputStyle, { marginBottom: 0, paddingRight: 48 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={{ position: 'absolute', right: 14, top: 14 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="rgba(255,255,255,0.6)"
                    />
                  </TouchableOpacity>
                </View>

                <Text style={labelStyle}>Confirm Password</Text>
                <TextInput
                  style={inputStyle}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat password"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry={!showPassword}
                />

                <TouchableOpacity
                  onPress={handleSignUp}
                  disabled={loading}
                  style={{
                    backgroundColor: COLOR.skyBlue,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                    marginBottom: 14,
                    marginTop: 6,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color={COLOR.white} />
                  ) : (
                    <Text style={{ color: COLOR.white, fontWeight: '700', fontSize: 16 }}>
                      Create Account
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setPassword('');
                    setConfirmPassword('');
                    setView(VIEWS.SIGN_IN);
                  }}
                  style={{ alignItems: 'center', paddingVertical: 8 }}
                >
                  <Text style={{ color: COLOR.aquaMint, fontSize: 14 }}>
                    Already have an account?{' '}
                    <Text style={{ fontWeight: '700' }}>Sign in</Text>
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
