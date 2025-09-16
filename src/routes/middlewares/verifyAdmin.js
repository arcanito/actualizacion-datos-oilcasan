// src/routes/middlewares/verifyAdmin.js
const { adminAuth, adminDb } = require("../../firebase"); // <-- Admin SDK (no uses db del cliente)
const { doc, getDoc } = require('firebase/firestore');


const verifyAdmin = async (req, res, next) => {
  try {
    const hdr = req.headers.authorization || "";
    if (!hdr.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Token no proporcionado" });
    }

    const idToken = hdr.slice("Bearer ".length).trim();

    // 1) Verificar token con Admin
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // 2) Leer perfil desde Firestore con Admin (NO aplica rules)
    const snap = await adminDb.doc(`Users/${uid}`).get();
    if (!snap.exists) {
      return res
        .status(403)
        .json({ success: false, message: "Usuario sin perfil en Users" });
    }
    const profile = snap.data() || {};

    // 3) Validaciones de acceso
    if (profile.isActive === false) {
      return res
        .status(403)
        .json({ success: false, message: "Usuario inactivo" });
    }
    const role = String(profile.role || "").toLowerCase();
    if (role !== "admin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "No autorizado: se requiere rol de administrador",
        });
    }

    // 4) Exponer datos al siguiente handler
    req.user = {
      uid,
      email: decoded.email || null,
      role: profile.role,
      profile,
    };

    return next();
  } catch (error) {
    console.error(
      "[verifyAdmin] ERROR:",
      error?.code || error?.message || error
    );
    let message = "Error de autenticación";
    if (error?.code === "auth/id-token-expired") message = "Token expirado";
    else if (
      error?.code === "auth/argument-error" ||
      error?.code === "auth/invalid-id-token"
    )
      message = "Token inválido";
    return res.status(401).json({ success: false, message });
  }
};

module.exports = verifyAdmin;
