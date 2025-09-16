const { initializeApp, getApps } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");

const admin = require("firebase-admin");

// 🔹 Configuración cliente (Frontend SDK)
const firebaseConfig = {
  apiKey: "AIzaSyAUAgRSfORHbvOUd4k8jpNOhyq18rz-_hc",
  authDomain: "registro-de-datos-oilcasan.firebaseapp.com",
  projectId: "registro-de-datos-oilcasan",
  storageBucket: "registro-de-datos-oilcasan.appspot.com",
  messagingSenderId: "239159695711",
  appId: "1:239159695711:web:b0ed36bd2963422adabeea",
};

// Inicialización del cliente Firebase (para login con email/pass)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 🔹 Admin SDK (para operar Firestore sin reglas y verificar tokens)
if (!admin.apps.length) {
  // Opción A: Variables de entorno (Render > Environment)
  // Si existen, se usan. Si no, intentamos credenciales por defecto
  // (por ejemplo, Secret File montado por Render o GOOGLE_APPLICATION_CREDENTIALS).
  const hasEnv =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

  if (hasEnv) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      storageBucket: firebaseConfig.storageBucket,
    });
  } else {
    // Usar credenciales por defecto (service account JSON cargado como Secret File en Render)
    admin.initializeApp();
  }
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

module.exports = {
  // SDK cliente
  auth,
  db,
  storage,

  // SDK admin
  adminAuth,
  adminDb,
};
