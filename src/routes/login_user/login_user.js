const { Router } = require("express");
const { signInWithEmailAndPassword } = require("firebase/auth");
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
    // 1) Autenticar con Firebase Auth (SDK cliente)
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // 2) Bloquear si el correo no está verificado (no reenviamos email desde backend)
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Correo no verificado. Revisa tu bandeja y verifica tu email antes de continuar.",
        emailVerified: false,
      });
    }

    // 3) Leer el perfil con Admin SDK (no aplica reglas)
    const snap = await adminDb.collection("Users").doc(user.uid).get();
    const profile = snap.exists ? snap.data() : {};

    // 4) Emitir ID Token real para el frontend (lo usa en Authorization: Bearer ...)
    const idToken = await user.getIdToken();

    return res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      user: {
        uid: user.uid,
        email: user.email,
        role: profile.role || null,
        token: idToken,
      },
    });
  } catch (error) {
    console.error("❌ /login_user error:", {
      code: error?.code,
      message: error?.message,
      name: error?.name,
    });

    let statusCode = 401;
    let message = "Error al iniciar sesión";

    switch (error?.code) {
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
        statusCode = 429;
        message = "Demasiados intentos fallidos. Intenta más tarde.";
        break;
      case "auth/user-disabled":
        message = "Esta cuenta ha sido desactivada";
        break;
      default:
        statusCode = 500;
        message = "Error interno de autenticación";
    }

    return res.status(statusCode).json({
      success: false,
      message,
      code: error?.code || "unknown",
    });
  }
});

module.exports = router;
