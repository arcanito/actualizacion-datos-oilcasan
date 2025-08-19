// src/routes/middlewares/verifyAdmin.js
const { adminAuth, db } = require('../../firebase');
const { doc, getDoc } = require('firebase/firestore');

const verifyAdmin = async (req, res, next) => {
  try {
    const tokenHeader = req.headers.authorization;

    if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    // ✅ Tomamos el token directo (sin desencriptar)
    const token = tokenHeader.split(' ')[1];

    // 🔑 Verificar token con Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);

    // 🔎 Buscar usuario en Firestore
    const userDoc = await getDoc(doc(db, "Users", decodedToken.uid));
    if (!userDoc.exists()) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const userData = userDoc.data();

    // 🔐 Verificar si es admin
    if (userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado: Se requiere rol de administrador'
      });
    }

    // ✅ Guardar info en req.user para usar en controladores
    req.user = {
      uid: decodedToken.uid,
      role: userData.role
    };

    next();
  } catch (error) {
    console.error('❌ Error en verificación de admin:', error);

    let message = 'Error de autenticación';
    if (error.code === 'auth/id-token-expired') {
      message = 'Token expirado';
    } else if (error.code === 'auth/argument-error') {
      message = 'Token inválido';
    }

    res.status(401).json({
      success: false,
      message
    });
  }
};

module.exports = verifyAdmin;
