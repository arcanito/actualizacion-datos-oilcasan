const { Router } = require('express');
const { signInWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
const { auth, db, getDoc, doc } = require('../../firebase');
const { encrypt } = require('../../utils/crypto'); // 👈 Importamos el encriptador

const router = Router();

router.post('/login_user', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email y contraseña son obligatorios"
        });
    }

    try {
        // Iniciar sesión con Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Verificar que el correo esté confirmado
        if (!user.emailVerified) {
            await sendEmailVerification(user);
            return res.status(403).json({
                success: false,
                message: "Correo no verificado. Hemos enviado un nuevo enlace de verificación a tu email.",
                emailSent: true
            });
        }

        // Obtener datos adicionales desde Firestore
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        // ✅ Obtener un ID Token real
        const idToken = await user.getIdToken();

        // 🔒 Encriptar UID antes de enviarlo al front
        const encryptedUid = encrypt(user.uid);

        return res.status(200).json({
            success: true,
            message: "Inicio de sesión exitoso",
            user: {
                uid: encryptedUid, // 👈 Encriptado
                email: user.email,
                role: userData.role || null,
                token: idToken
            }
        });

    } catch (error) {
        let message = "Error al iniciar sesión";
        let statusCode = 401;

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
                message = "Demasiados intentos fallidos. Intenta más tarde.";
                statusCode = 429;
                break;
            case "auth/user-disabled":
                message = "Esta cuenta ha sido desactivada";
                break;
            default:
                statusCode = 500;
        }

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
});

module.exports = router;
