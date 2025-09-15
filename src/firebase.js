const { initializeApp, getApps } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, getDoc } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");

const admin = require("firebase-admin");

// 🔹 Configuración cliente (Frontend SDK, segura de usar)
const firebaseConfig = {
  apiKey: "AIzaSyAUAgRSfORHbvOUd4k8jpNOhyq18rz-_hc",
  authDomain: "registro-de-datos-oilcasan.firebaseapp.com",
  projectId: "registro-de-datos-oilcasan",
  storageBucket: "registro-de-datos-oilcasan.appspot.com", // ← usa *.appspot.com
  messagingSenderId: "239159695711",
  appId: "1:239159695711:web:b0ed36bd2963422adabeea"
};
// Inicialización del cliente Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 🔹 Admin SDK para backend (Render usa variables de entorno)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // ✅ fix saltos de línea
    }),
    storageBucket: firebaseConfig.storageBucket,
  });
}

const adminAuth = admin.auth();

module.exports = {
  auth,
  db,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  getDoc,
  doc,
  storage,
  adminAuth,
};
