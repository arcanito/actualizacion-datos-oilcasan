// src/routes/menu/menu.js
const { Router } = require("express");
const { adminAuth, adminDb } = require("../../firebase"); // <- usa Admin SDK

const router = Router();

/**
 * GET /auth/me?uid=<uid>
 * Requiere: Authorization: Bearer <ID_TOKEN>
 */
router.get("/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Falta el token Bearer",
      });
    }

    // 1) Verificar ID token con Admin
    const decoded = await adminAuth.verifyIdToken(token);
    const tokenUid = decoded.uid;

    // 2) (opcional) Validar que el uid de la query coincide
    const { uid } = req.query || {};
    if (uid && uid !== tokenUid) {
      return res.status(403).json({
        success: false,
        message: "UID inválido para este token",
      });
    }

    // 3) Leer Firestore con Admin SDK (NO con SDK de cliente)
    const snap = await adminDb.doc(`Users/${tokenUid}`).get();
    if (!snap.exists) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado en la colección Users",
      });
    }
    const data = snap.data() || {};

    // 4) Responder
    return res.json({
      success: true,
      user: {
        uid: tokenUid,
        email: decoded.email || "",
        displayName: data.displayName || "",
        role: data.role || "",
        ...data, // si quieres exponer más campos del doc
      },
    });
  } catch (error) {
    console.error("Error en /auth/me:", error);
    // Firebase Admin lanza errores con 'code' (auth/invalid-id-token, etc.)
    if (
      error?.code === "auth/argument-error" ||
      error?.code === "auth/invalid-id-token"
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Token inválido" });
    }
    if (String(error?.code).includes("permission-denied")) {
      // NO debería pasar con Admin; si pasa, hay problema de inicialización del Admin SDK
      return res
        .status(500)
        .json({ success: false, message: "Admin SDK sin permisos" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

module.exports = router;
