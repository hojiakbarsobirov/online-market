import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  setPersistence,
  browserLocalPersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // 1. Buni qo'shing

const firebaseConfig = {
  apiKey: "AIzaSyDi4zWjxbMdVcNGPVREJldWlaoL8f4HtC4",
  authDomain: "auth-3cb38.firebaseapp.com",
  projectId: "auth-3cb38",
  storageBucket: "auth-3cb38.firebasestorage.app",
  messagingSenderId: "983979033714",
  appId: "1:983979033714:web:ea31a7d1324cbf52f7aeeb",
  measurementId: "G-YSCHBQ76P1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // 2. BU QATORNI QO'SHING (Xatolik shunda)

// Sessiyani saqlash
setPersistence(auth, browserLocalPersistence);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Xatolik kodi:", error.code);
    throw error;
  }
};

export const logOut = () => signOut(auth);