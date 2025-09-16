// src/firebase.js
const { initializeApp, getApps } = require("firebase/app");
const {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} = require("firebase/auth");
const { getFirestore, doc, getDoc } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");

const admin = require("firebase-admin");

/* ===========================
   SDK de cliente (para Auth)
=========================== */
const firebaseConfig = {
  apiKey: "AIzaSyAUAgRSfORHbvOUd4k8jpNOhyq18rz-_hc",
  authDomain: "registro-de-datos-oilcasan.firebaseapp.com",
  projectId: "registro-de-datos-oilcasan",
  storageBucket: "registro-de-datos-oilcasan.appspot.com",
  messagingSenderId: "239159695711",
  appId: "1:239159695711:web:b0ed36bd2963422adabeea",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* ===========================
   Admin SDK (omite reglas)
=========================== */
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // ¡OJO! el private key debe tener \n reales:
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Variables de entorno de Firebase Admin incompletas.");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: firebaseConfig.storageBucket,
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

module.exports = {
  cliente,
  auth,
  db,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  getDoc,
  doc,
  storage,
  admin,
  adminAuth,
  adminDb,
};
