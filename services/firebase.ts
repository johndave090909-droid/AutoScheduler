
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDvnhFArkVb0_YvjA2drqjhtofTSlaQ8ac",
  authDomain: "autoscheduler-12140.firebaseapp.com",
  projectId: "autoscheduler-12140",
  storageBucket: "autoscheduler-12140.firebasestorage.app",
  messagingSenderId: "690062324731",
  appId: "1:690062324731:web:c8cf161d623ee1afd5515e",
  measurementId: "G-0EL3MWSGMT"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
