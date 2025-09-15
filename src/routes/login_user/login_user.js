// src/routes/login_user/login_user.js
const { Router } = require('express');
const { signInWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
const { auth, db, getDoc, doc } = require('../../firebase');

const router = Router();

router.post('/login_user', async (req, res) => {
  const email = String(req.body?.email || '').trim();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email y contraseña son obligatorios',
    });
  }

  try {
    // Iniciar sesión con Firebase Authentication
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // Verificar que el correo esté confirmado
    if (!user.emailVerified) {
      await sendEmailVerification(user);
      return res.status(403).json({
        success: false,
        message: 'Correo no verificado. Hemos enviado un nuevo enlace de verificación a tu email.',
        emailSent: true,
      });
    }

    // Datos adicionales en Firestore
    const snap = await getDoc(doc(db, 'Users', user.uid));
    const userData = snap.exists() ? snap.data() : {};

    // ID token real
    const idToken = await user.getIdToken();

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: {
        uid: user.uid,
        email: user.email,
        role: userData.role || null,
        token: idToken,
      },
    });
  } catch (error) {
    // 🔎 Log detallado en Render
    console.error('❌ Error en /login_user:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
    });

    // Mapeo de códigos comunes
    let status = 500;
    let message = 'Error al iniciar sesión';
    switch (error?.code) {
      case 'auth/user-not-found':
        status = 401; message = 'Usuario no registrado'; break;
      case 'auth/wrong-password':
        status = 401; message = 'Contraseña incorrecta'; break;
      case 'auth/invalid-email':
        status = 400; message = 'Correo inválido'; break;
      case 'auth/too-many-requests':
        status = 429; message = 'Demasiados intentos fallidos. Intenta más tarde.'; break;
      case 'auth/user-disabled':
        status = 403; message = 'Esta cuenta ha sido desactivada'; break;
      default:
        status = 500; message = 'Error al iniciar sesión';
    }

    // En no-producción devolvemos más contexto para depurar
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(status).json({
      success: false,
      message,
      ...(isProd ? {} : { code: error?.code || null, detail: error?.message || null })
    });
  }
});

module.exports = router;
