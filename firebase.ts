// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBtKBSlXTPgwCo0WPRlYLTsxBR-0h-1-M4",
  authDomain: "ongeki-database.firebaseapp.com",
  projectId: "ongeki-database",
  storageBucket: "ongeki-database.firebasestorage.app",
  messagingSenderId: "364706373729",
  appId: "1:364706373729:web:c171da334910756c5a8a20",
  measurementId: "G-TY9YME52WW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
