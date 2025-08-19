const { Router } = require('express');
const { adminAuth, db } = require('../../firebase');
const { collection, query, where, getDocs, updateDoc } = require('firebase/firestore');

const router = Router();

router.post('/logout', async (req, res) => {
    console.log("📩 Petición de logout recibida");

    try {
        // 1️⃣ Obtener token de autorización
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado o inválido',
                code: 'auth/missing-token'
            });
        }

        const token = authHeader.split('Bearer ')[1].trim();

        // 2️⃣ Verificar token con Firebase
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;
        console.log("✅ Token verificado, UID:", uid);

        // 3️⃣ Revocar los tokens en Firebase (cierra sesión en todos los dispositivos)
        await adminAuth.revokeRefreshTokens(uid);
        console.log("🔒 Tokens revocados para UID:", uid);

        // 4️⃣ Actualizar el estado del usuario en Firestore
        const usersRef = collection(db, 'Users');
        const q = query(usersRef, where('id', '==', uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0].ref;
            await updateDoc(userDoc, {
                lastLogout: new Date().toISOString(),
                isActive: false,
                lastActivity: new Date().toISOString()
            });
            console.log("📝 Estado de usuario actualizado en Firestore");
        }

        // 5️⃣ Respuesta al cliente
        return res.status(200).json({
            success: true,
            message: 'Sesión cerrada correctamente',
            userId: uid
        });

    } catch (error) {
        console.error('❌ Error en logout:', error);

        let statusCode = 500;
        let errorMessage = 'Error al cerrar sesión';
        let errorCode = 'auth/internal-error';

        if (error.code === 'auth/id-token-expired') {
            statusCode = 401;
            errorMessage = 'Token expirado';
            errorCode = error.code;
        } else if (error.code === 'auth/argument-error') {
            statusCode = 401;
            errorMessage = 'Token inválido';
            errorCode = error.code;
        } else if (error.code === 'auth/user-not-found') {
            statusCode = 404;
            errorMessage = 'Usuario no encontrado';
            errorCode = error.code;
        }

        return res.status(statusCode).json({
            success: false,
            message: errorMessage,
            code: errorCode
        });
    }
});

module.exports = router;
