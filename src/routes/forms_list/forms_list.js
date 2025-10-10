// src/routes/forms_list/forms_list.js
const { Router } = require('express');
const { adminAuth, adminDb } = require('../../firebase'); // Admin SDK
const { Timestamp } = require('firebase-admin/firestore');

const router = Router();

/* ===== Auth simple: requiere ID token válido, NO rol admin ===== */
async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    if (!hdr.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }
    const idToken = hdr.slice(7).trim();
    const decoded = await adminAuth.verifyIdToken(idToken);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    return next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      message: e?.code === 'auth/id-token-expired' ? 'Token expirado' : 'Token inválido o expirado',
      code: e?.code || null,
    });
  }
}

/* === GET /records: lista Formularios (más recientes primero) === */
router.get('/records', requireAuth, async (_req, res) => {
  try {
    const snap = await adminDb
      .collection('Formularios')
      .orderBy('creadoEn', 'desc')
      .get();

    const records = snap.docs.map(d => {
      const x = d.data() || {};
      return {
        id: d.id,
        codigo: x.codigo || '',
        nombre: x.nombre || '',
        area: x.area || '',
        // deja el Timestamp como viene para que el front use .seconds
        creadoEn: x.creadoEn ?? null,
      };
    });

    return res.json({ success: true, records });
  } catch (error) {
    console.error('[records GET]', error);
    return res.status(500).json({ success: false, message: 'Error al obtener registros' });
  }
});

/* === GET /records/:id === */
router.get('/records/:id', requireAuth, async (req, res) => {
  try {
    const ref = adminDb.doc(`Formularios/${req.params.id}`);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Formulario no encontrado' });
    }
    return res.json({ success: true, record: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('[records GET /:id]', error);
    return res.status(500).json({ success: false, message: 'Error al obtener el formulario' });
  }
});

/* === POST /records === */
router.post('/records', requireAuth, async (req, res) => {
  try {
    const formData = req.body || {};

    if (!formData.nombre || !formData.codigo) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y código son obligatorios',
      });
    }

    const toSave = {
      ...formData,
      creadoEn: Timestamp.now(),
      createdBy: req.user?.uid || null,
    };

    const ref = await adminDb.collection('Formularios').add(toSave);

    return res.status(201).json({
      success: true,
      id: ref.id,
      message: 'Formulario guardado exitosamente',
    });
  } catch (error) {
    console.error('[records POST]', error);
    return res.status(500).json({
      success: false,
      message: 'Error al guardar formulario',
    });
  }
});

module.exports = router;
