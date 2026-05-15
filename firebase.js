// KEEP THIS FILE PRIVATE AND NEVER SHARE IT.

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNUAOVLRT562wHaTdXLxygFBXmpeUPr_0",
  authDomain: "hydra-a8bac.firebaseapp.com",
  projectId: "hydra-a8bac",
  storageBucket: "hydra-a8bac.firebasestorage.app",
  messagingSenderId: "821848397936",
  appId: "1:821848397936:web:dcf42c5f94800ca396bcb5",
  measurementId: "G-NMSJTYJ1CP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence (fixes the warning!)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
export const isFirebaseConfigured = true;