// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; // Import Realtime Database
import { getStorage } from "firebase/storage"; // Import Storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBSoaqeFRcbo1Mh8C-0yaOPyZXyhu5DRSQ",
  authDomain: "firstapp-6e9f9.firebaseapp.com",
  projectId: "firstapp-6e9f9",
  storageBucket: "firstapp-6e9f9.appspot.com",
  messagingSenderId: "204673256176",
  appId: "1:204673256176:web:789e807065495373e51035"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 
export const database = getDatabase(app); // Initialize Realtime Database
export const storage = getStorage(app); // Initialize Storage

