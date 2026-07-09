import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "strong-exchange-5pnh2",
  appId: "1:453351289774:web:0a32624cbf86ea9ba1ce3f",
  apiKey: "AIzaSyB5YgFD8ZEri02K8MeFUt47B5MnrOCLcj8",
  authDomain: "strong-exchange-5pnh2.firebaseapp.com",
  storageBucket: "strong-exchange-5pnh2.firebasestorage.app",
  messagingSenderId: "453351289774",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the databaseId from config
export const db = getFirestore(app, "ai-studio-abcaf2e9-468a-47fe-bc95-055c4705a535");

// Initialize Authentication
export const auth = getAuth(app);

// Function to handle anonymous sign-in or check current user
export async function getOrCreateUser(): Promise<string> {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (user) {
        resolve(user.uid);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          resolve(userCredential.user.uid);
        } catch (error) {
          console.warn("Utilizando identificador persistente seguro offline/local para sincronização...", error);
          // Fallback to a local random user ID if connection fails, ensuring offline-first operation
          let localId = localStorage.getItem('cashflow_fallback_uid');
          if (!localId) {
            localId = 'fallback_user_' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem('cashflow_fallback_uid', localId);
          }
          resolve(localId);
        }
      }
    });
  });
}
