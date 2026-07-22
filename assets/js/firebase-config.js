/* ============================================================
   隱哈歌利 En-hakkore — 共用 Firebase 前端設定
   ============================================================ */


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBvqv6Y9ed6tFDDc5LLHC1ePFtcwQwBeV4",
  authDomain: "einhakkore-3efe2.firebaseapp.com",
  projectId: "einhakkore-3efe2",
  storageBucket: "einhakkore-3efe2.firebasestorage.app",
  messagingSenderId: "158806315576",
  appId: "1:158806315576:web:cb9a50f92d57ff562fcccd",
  measurementId: "G-Q91DCHM5YC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
