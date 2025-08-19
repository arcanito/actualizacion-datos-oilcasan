const { initializeApp, getApps } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, getDoc } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");

const admin = require('firebase-admin');

// 🔹 Configuración cliente (Frontend SDK, segura de usar)
const firebaseConfig = {
  apiKey: "AIzaSyAbkbbxWc-MGD_uNqrsd7YL62P8VYbk7k4",
  authDomain: "oilcasan-formulario-d6dd1.firebaseapp.com",
  projectId: "oilcasan-formulario-d6dd1",
  storageBucket: "oilcasan-formulario-d6dd1.firebasestorage.app",
  messagingSenderId: "274537463748",
  appId: "1:274537463748:web:d09bb7d30d50b4c049ee91",
  measurementId: "G-VPMGG83399"
};

// Inicialización del cliente Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 🔹 Admin SDK para backend (usando variables de entorno en Render)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    }),
    storageBucket: firebaseConfig.storageBucket,
  });
}

const adminAuth = admin.auth();

module.exports = { auth, db, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, getDoc, doc, storage, adminAuth };
