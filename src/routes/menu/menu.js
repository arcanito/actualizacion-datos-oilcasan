// src/routes/menu/menu.js
const { Router } = require('express');
const { adminAuth, db } = require('../../firebase');
const { doc, getDoc } = require('firebase/firestore');

const router = Router();

router.get('/auth/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        // ✅ Verificar token real con Firebase
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (err) {
            console.error("❌ Error verificando token con Firebase:", err);
            return res.status(401).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        if (!req.query.uid) {
            return res.status(400).json({
                success: false,
                message: 'UID no proporcionado'
            });
        }

        const uid = req.query.uid; // 👈 ahora sin desencriptar

        // ✅ Comprobar que coincidan UID del token y el de la query
        if (decodedToken.uid !== uid) {
            return res.status(403).json({
                success: false,
                message: 'UID inválido'
            });
        }

        // ✅ Obtener datos del usuario en Firestore
        const userDoc = await getDoc(doc(db, 'Users', uid));
        if (!userDoc.exists()) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const userData = userDoc.data();

        res.json({
            success: true,
            user: {
                uid,
                email: userData.email || '',
                name: userData.name || '',
                role: userData.role || ''
            }
        });

    } catch (error) {
        console.error('Error en /auth/me:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
