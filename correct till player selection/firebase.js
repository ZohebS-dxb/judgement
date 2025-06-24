// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update } from 'firebase/database';

const firebaseConfig = {
 apiKey: "AIzaSyClffvlLY66cKD6ex6eOygg8uS9rbKvCns",
  authDomain: "liar-1-ebc12.firebaseapp.com",
  databaseURL: "https://liar-1-ebc12-default-rtdb.europe-west1.firebasedatabase.app",  // ✅ Add this
  projectId: "liar-1-ebc12",
  storageBucket: "liar-1-ebc12.firebasestorage.app",
  messagingSenderId: "853929867266",
  appId: "1:853929867266:web:12fd05aa5cfdc0746d0f1b"
};


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, get, set, update };
