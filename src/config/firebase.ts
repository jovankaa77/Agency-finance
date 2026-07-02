// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAkd1inpmqqdtEkgFXkredDRITgDgtQPik",
  authDomain: "agency-2fab3.firebaseapp.com",
  projectId: "agency-2fab3",
  storageBucket: "agency-2fab3.firebasestorage.app",
  messagingSenderId: "64910849720",
  appId: "1:64910849720:web:5caf7f4a931f87cde3664d",
  measurementId: "G-3MBEWKGW27",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, analytics, storage };
export default app;
