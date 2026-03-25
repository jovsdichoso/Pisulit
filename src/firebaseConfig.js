import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // 👈 Add this line
// import { getAnalytics } from "firebase/analytics"; // Optional for dev

const firebaseConfig = {
    apiKey: "AIzaSyBQraqd0rCEZpy76yltIvWF3SNYLcXxDfU",
    authDomain: "firstapp-d2de6.firebaseapp.com",
    projectId: "firstapp-d2de6",
    storageBucket: "firstapp-d2de6.firebasestorage.app",
    messagingSenderId: "553614225211",
    appId: "1:553614225211:web:69e959211023311f17511e",
    measurementId: "G-9Y51WWW3TQ",
    // Make sure your Realtime Database URL is here if it's not auto-detected
    databaseURL: "https://firstapp-d2de6-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and export it for use in your components
export const db = getDatabase(app);