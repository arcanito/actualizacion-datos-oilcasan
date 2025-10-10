// src/routes/stats/stats.js  (o src/routes/stats.js si lo tienes así)
const { Router } = require('express');
const { adminAuth, adminDb } = require('../../firebase'); // <-- Admin SDK

const router = Router();

// Campos que queremos incluir en las estadísticas
const camposPermitidos = {
  sexo: 'Distribución por Sexo',
  es_padre_madre: 'Padres o Madres',
  etnia: 'Pertenece a una Etnia',
  religion: 'Religión',
  lgbtiq: 'Comunidad LGBTIQ+',
  nivel_educativo: 'Nivel Educativo',
};

/* ===== Auth simple: requiere ID token válido, NO rol admin ===== */
async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    if (!hdr.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }
    const token = hdr.slice(7).trim();
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

/**
 * GET /records/stats
 * Devuelve datos agregados para gráficos.
 */
router.get('/records/stats', requireAuth, async (_req, res) => {
  try {
    // Admin SDK: no aplica rules → adiós permission-denied
    const snap = await adminDb.collection('Formularios').get();

    if (snap.empty) {
      return res.json({});
    }

    const stats = {};
    for (const doc of snap.docs) {
      const form = doc.data() || {};
      for (const [campo, _titulo] of Object.entries(camposPermitidos)) {
        const valorRaw = form[campo];
        if (valorRaw !== undefined && valorRaw !== null && valorRaw !== '') {
          const valor = String(valorRaw).trim();
          if (!stats[campo]) stats[campo] = {};
          stats[campo][valor] = (stats[campo][valor] || 0) + 1;
        }
      }
    }

    // Formato para charts (como tenías)
    const chartData = {};
    for (const [campo, conteo] of Object.entries(stats)) {
      chartData[campo] = {
        labels: Object.keys(conteo),
        data: Object.values(conteo),
        // colores fijos (puedes cambiarlos)
        backgroundColor: [
          '#1a5f1a', '#4CAF50', '#8BC34A', '#FFC107',
          '#FF5722', '#2196F3', '#9C27B0', '#E91E63'
        ],
        title: camposPermitidos[campo],
      };
    }

    return res.json(chartData);
  } catch (error) {
    console.error('[records/stats GET]', error);
    return res.status(500).json({ message: 'Error obteniendo estadísticas' });
  }
});

module.exports = router;
