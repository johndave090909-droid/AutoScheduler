
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCWZa1bi04b3bHkNQRHEnlOXUAS_9utABA",
  authDomain: "progression-tracking.firebaseapp.com",
  projectId: "progression-tracking",
  storageBucket: "progression-tracking.firebasestorage.app",
  messagingSenderId: "619162418208",
  appId: "1:619162418208:web:36816de59df185a62c1045",
  measurementId: "G-9NCEJW06SL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
