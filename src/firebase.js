const { initializeApp, getApps } = require("firebase/app"); // Añade getApps aquí
const { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, getDoc } = require("firebase/firestore");
const { getStorage } = require("firebase/storage"); // También parece que usas storage pero no estaba importado

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // ⚠️ Ajusta la ruta

const firebaseConfig = {
  apiKey: "AIzaSyAbkbbxWc-MGD_uNqrsd7YL62P8VYbk7k4",
  authDomain: "oilcasan-formulario-d6dd1.firebaseapp.com",
  projectId: "oilcasan-formulario-d6dd1",
  storageBucket: "oilcasan-formulario-d6dd1.firebasestorage.app",
  messagingSenderId: "274537463748",
  appId: "1:274537463748:web:d09bb7d30d50b4c049ee91",
  measurementId: "G-VPMGG83399"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Admin SDK (solo para backend)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: firebaseConfig.storageBucket,
  });
}
const adminAuth = admin.auth();

module.exports = { auth, db, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, getDoc, doc, storage, adminAuth };