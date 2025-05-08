// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAes_U-bm-kVmJOulOHXS6hJ7IPL7i2OWI",
  authDomain: "onostudytimetableproject.firebaseapp.com",
  projectId: "onostudytimetableproject",
  storageBucket: "onostudytimetableproject.firebasestorage.app",
  messagingSenderId: "551611830150",
  appId: "1:551611830150:web:e6c5255d75af92ccdae607"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);