
// KEEP THIS FILE PRIVATE AND NEVER SHARE IT.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Replace these with your actual credentials from the Firebase console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Check if Firebase has real credentials configured
const isFirebaseConfigured = !Object.values(firebaseConfig).some(v =>
  typeof v === 'string' && v.startsWith('YOUR_')
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  // Initialize Firebase only when real credentials are present
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

// Export the initialized services so you can use them anywhere in your app
export { app, auth, db, isFirebaseConfigured };
