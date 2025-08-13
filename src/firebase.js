// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  // Storage bucket should be appspot.com (not firebasestorage.app)
  storageBucket: "judgement-zo.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID, // optional
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Optional: quick sanity log (no secrets)
if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line no-console
  console.log("Firebase project:", app.options?.projectId || "(missing)");
}
