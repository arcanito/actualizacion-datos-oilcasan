// src/routes/login_user/login_user.js
const { Router } = require("express");
const {
  signInWithEmailAndPassword,
  sendEmailVerification,
} = require("firebase/auth");

const { auth, adminDb } = require("../../firebase");

const router = Router();

router.post("/login_user", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email y contraseña son obligatorios",
    });
  }

  try {
    // 1) Login con Auth (cliente)
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // 2) Verificación de email
    if (!user.emailVerified) {
      try {
        await sendEmailVerification(user);
      } catch (_) {}
      return res.status(403).json({
        success: false,
        message:
          "Correo no verificado. Hemos enviado un nuevo enlace de verificación a tu email.",
        emailSent: true,
      });
    }

    // 3) Leer datos extra con Admin (omite reglas)
    const snap = await adminDb.doc(`Users/${user.uid}`).get();
    const userData = snap.exists ? snap.data() : {};

    // 4) ID Token real
    const token = await user.getIdToken();

    return res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      user: {
        uid: user.uid,
        email: user.email,
        role: userData.role ?? null,
        token,
      },
    });
  } catch (error) {
    console.error("❌ /login_user error:", error);

    // Mapeo de errores comunes de Auth
    let status = 401;
    let message = "Error al iniciar sesión";

    switch (error.code) {
      case "auth/user-not-found":
        message = "Usuario no registrado";
        break;
      case "auth/wrong-password":
        message = "Contraseña incorrecta";
        break;
      case "auth/invalid-email":
        message = "Correo inválido";
        break;
      case "auth/too-many-requests":
        status = 429;
        message = "Demasiados intentos fallidos. Intenta más tarde.";
        break;
      case "auth/user-disabled":
        message = "Esta cuenta ha sido desactivada";
        break;
      default:
        status = 500;
    }

    return res.status(status).json({ success: false, message });
  }
});

module.exports = router;
