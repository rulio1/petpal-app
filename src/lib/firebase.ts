// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "petpal-2xowu",
  "appId": "1:350592436528:web:03ae3c938d35e585b2a0f5",
  "storageBucket": "petpal-2xowu.firebasestorage.app",
  "apiKey": "AIzaSyDMTTfqmPr46uFWZ-F5OqOZzLMK-IZX6cY",
  "authDomain": "petpal-2xowu.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "350592436528"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const storage = getStorage(app);

export { app, db, storage };
