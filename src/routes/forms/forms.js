// routes/forms/registers.js
const { Router } = require("express");
const { adminAuth, adminDb } = require("../../firebase"); // <-- Admin SDK
const { Timestamp } = require("firebase-admin/firestore");

const router = Router();

/* ---------- Auth simple: requiere token válido, NO rol admin ---------- */
async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    if (!hdr.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Token no proporcionado" });
    }
    const idToken = hdr.slice(7).trim();
    const decoded = await adminAuth.verifyIdToken(idToken);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    return next();
  } catch (e) {
    return res
      .status(401)
      .json({ success: false, message: "Token inválido o expirado" });
  }
}

/* ---------- Handlers compartidos (para /records y /stats) ---------- */
async function listRecords(_req, res) {
  try {
    const snap = await adminDb
      .collection("Formularios")
      .orderBy("creadoEn", "desc")
      .get();

    const forms = snap.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        id: docSnap.id,
        codigo: data.codigo || "",
        nombre: data.nombre || "",
        area: data.area || "",
        creadoEn: data.creadoEn || null,
      };
    });

    // Forma compatible con tu front
    return res.json({ success: true, records: forms });
  } catch (error) {
    console.error("Error al obtener formularios:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error al obtener formularios" });
  }
}

async function getRecord(req, res) {
  try {
    const ref = adminDb.doc(`Formularios/${req.params.id}`);
    const snap = await ref.get();
    if (!snap.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Formulario no encontrado" });
    }
    const data = snap.data() || {};
    return res.json({ success: true, record: { id: snap.id, ...data } });
  } catch (error) {
    console.error("Error al obtener formulario:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error al obtener el formulario" });
  }
}

async function createRecord(req, res) {
  try {
    const formData = req.body || {};
    // Validación mínima (ajusta a tus campos)
    if (!formData.nombre || !formData.codigo) {
      return res
        .status(400)
        .json({ success: false, message: "Nombre y código son obligatorios" });
    }

    const toSave = {
      ...formData,
      creadoEn: Timestamp.now(),
      createdBy: req.user?.uid || null,
    };

    const ref = await adminDb.collection("Formularios").add(toSave);
    return res
      .status(201)
      .json({
        success: true,
        id: ref.id,
        message: "Formulario guardado exitosamente",
      });
  } catch (error) {
    console.error("Error al guardar formulario:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error al guardar formulario" });
  }
}

/* ---------- Rutas nuevas (lo que tu front está pidiendo) ---------- */
router.get("/records", requireAuth, listRecords);
router.get("/records/:id", requireAuth, getRecord);
router.post("/records", requireAuth, createRecord);

/* ---------- Alias legacy /stats (por compatibilidad) ---------- */
router.get("/stats", requireAuth, listRecords);
router.get("/stats/:id", requireAuth, getRecord);
router.post("/stats", requireAuth, createRecord);

module.exports = router;
