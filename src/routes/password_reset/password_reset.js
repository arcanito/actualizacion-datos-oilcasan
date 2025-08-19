const { Router } = require('express');
const { sendPasswordResetEmail } = require('firebase/auth');
const { auth } = require('../../firebase');
const router = Router();

router.post('/password_reset', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ 
            success: false,
            message: "El correo electrónico es requerido",
            code: "missing-email"
        });
    }

    try {
        await sendPasswordResetEmail(auth, email);
        
        return res.status(200).json({
            success: true,
            message: "Correo de recuperación enviado. Por favor revisa tu bandeja de entrada.",
            data: {
                email: email,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error("Error en recuperación de contraseña:", error);
        
        let message = "Error al enviar el correo de recuperación";
        let statusCode = 400;
        let errorCode = error.code || "unknown-error";

        switch(error.code) {
            case "auth/user-not-found":
                message = "No existe una cuenta con este correo electrónico";
                break;
            case "auth/invalid-email":
                message = "Correo electrónico no válido";
                break;
            case "auth/too-many-requests":
                message = "Demasiados intentos. Por favor inténtalo más tarde.";
                statusCode = 429;
                break;
            default:
                statusCode = 500;
                message = "Ocurrió un error inesperado. Por favor inténtalo nuevamente.";
        }

        return res.status(statusCode).json({ 
            success: false,
            message,
            code: errorCode
        });
    }
});

module.exports = router;