// src/routes/menu/menu.js
const { Router } = require('express');
const admin = require('firebase-admin');
const { adminAuth, adminDb } = require('../../firebase');
const { Timestamp } = require('firebase-admin/firestore');

const router = Router();

/**
 * Útil para depurar: devuelve el uid decodificado del token
 * GET /whoami
 * Header: Authorization: Bearer <ID_TOKEN>
 */
router.get('/whoami', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Falta token' });

    const decoded = await adminAuth.verifyIdToken(token);
    return res.json({
      success: true,
      projectId: admin.app().options.projectId || null,
      uid: decoded.uid,
      email: decoded.email || null,
    });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
});

/**
 * GET /auth/me?uid=<uid> (uid opcional, solo para comparar)
 * Header: Authorization: Bearer <ID_TOKEN>
 */
router.get('/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Falta el token Bearer' });

    const decoded = await adminAuth.verifyIdToken(token);
    const tokenUid = decoded.uid;
    const qUid = (req.query?.uid || '').trim();

    // Log de diagnóstico
    console.log('[auth/me] project:', admin.app().options.projectId, 'tokenUid:', tokenUid, 'queryUid:', qUid || '(none)');

    if (qUid && qUid !== tokenUid) {
      // Si el front envía un uid distinto al del token, no lo usamos, pero avisamos.
      console.warn('[auth/me] uid de query no coincide con tokenUid');
    }

    // 1) Intento directo por UID correcto
    let userRef = adminDb.doc(`Users/${tokenUid}`);
    let snap = await userRef.get();

    // 2) Si no existe, intentamos por email para migrar documentos con ID aleatorio
    if (!snap.exists && decoded.email) {
      const q = await adminDb.collection('Users').where('email', '==', decoded.email).limit(1).get();
      if (!q.empty) {
        const old = q.docs[0];
        const data = old.data() || {};
        console.log('[auth/me] migrando doc desde', old.id, '→', tokenUid);
        await userRef.set(
          {
            ...data,
            uid: tokenUid,
            migratedFrom: old.id,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
        // opcional: borrar el viejo
        // await old.ref.delete();
        snap = await userRef.get();
      }
    }

    // 3) Si todavía no existe, lo autocreamos mínimo
    if (!snap.exists) {
      console.log('[auth/me] autoprovisionando Users/', tokenUid);
      const data = {
        uid: tokenUid,
        email: decoded.email || '',
        displayName: decoded.name || '',
        role: 'user',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await userRef.set(data, { merge: true });
      snap = await userRef.get();
    }

    const data = snap.data() || {};
    return res.json({
      success: true,
      user: {
        uid: tokenUid,
        email: data.email || decoded.email || '',
        displayName: data.displayName || data.name || '',
        role: data.role || 'user',
        isActive: data.isActive !== undefined ? data.isActive : true,
        ...data,
      },
    });
  } catch (error) {
    console.error('Error en /auth/me:', error);
    if (error?.code === 'auth/invalid-id-token' || error?.code === 'auth/argument-error') {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;
