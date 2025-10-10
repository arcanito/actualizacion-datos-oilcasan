// src/routes/create_user/create_user.js
const { Router } = require("express");
const { adminAuth, adminDb } = require("../../firebase"); // Admin SDK
const verifyAdmin = require("../middlewares/verifyAdmin");

const router = Router();

/**
 * 📌 Crear nuevo usuario (ADMIN)
 */
router.post("/create_user", verifyAdmin, async (req, res) => {
  try {
    const { email, password, fullName, phone, role } = req.body || {};

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password, fullName y role son requeridos",
      });
    }
    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rol no válido (debe ser admin o user)",
      });
    }

    // 1) Crear en Auth (Admin)
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
      phoneNumber: phone || undefined,
      emailVerified: role === "admin",
      disabled: false,
    });

    // 2) Guardar perfil en Firestore (Admin)
    const nowIso = new Date().toISOString();
    const userData = {
      id: userRecord.uid,   // uid
      email,
      fullName,
      phone: phone || "",
      role,
      isActive: true,
      createdAt: nowIso,
      createdBy: req.user?.uid || null,
      updatedAt: nowIso,
    };

    await adminDb.doc(`Users/${userRecord.uid}`).set(userData, { merge: true });

    return res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      user: { id: userRecord.uid, email, fullName, role },
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    let message = "Error al crear usuario";
    if (error?.code === "auth/email-already-exists") message = "El email ya está registrado";
    if (error?.code === "auth/invalid-password") message = "La contraseña debe tener al menos 6 caracteres";
    return res.status(400).json({ success: false, message, code: error?.code });
  }
});

/**
 * 📌 Obtener todos los usuarios (ADMIN)
 */
router.get("/create_user", verifyAdmin, async (_req, res) => {
  try {
    const snap = await adminDb.collection("Users").get();
    const users = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id, // id del documento (idealmente = uid)
        uid: data.id || d.id, // uid real (por compat.)
        fullName: data.fullName || "",
        email: data.email || "",
        role: data.role || "",
        isActive: data.isActive !== false,
        createdAt: data.createdAt || null,
        phone: data.phone || "",
      };
    });

    return res.json({ success: true, users });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return res.status(500).json({ success: false, message: "Error al obtener usuarios" });
  }
});

/**
 * 📌 Editar usuario (ADMIN)
 */
router.put("/create_user/:id", verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id; // se espera uid (o docId si coinciden)
    const { fullName, email, phone, role, isActive } = req.body || {};

    // Asegurar que el doc existe en Firestore (Admin)
    const ref = adminDb.doc(`Users/${userId}`);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado en la base de datos",
      });
    }

    // Asegurar que el usuario existe en Auth
    let authUser;
    try {
      authUser = await adminAuth.getUser(userId);
    } catch (authError) {
      if (authError?.code === "auth/user-not-found") {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado en Firebase Auth",
        });
      }
      throw authError;
    }

    // Actualizaciones en Auth
    const updateAuth = {};
    if (email && email !== authUser.email) {
      updateAuth.email = email;
      updateAuth.emailVerified = false;
    }
    if (fullName && fullName !== authUser.displayName) {
      updateAuth.displayName = fullName;
    }
    if (phone && phone !== authUser.phoneNumber) {
      updateAuth.phoneNumber = phone;
    }
    if (Object.keys(updateAuth).length) {
      await adminAuth.updateUser(userId, updateAuth);
    }

    // Actualizaciones en Firestore (Admin)
    const toMerge = {
      ...(fullName !== undefined ? { fullName } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.uid || null,
    };

    await ref.set(toMerge, { merge: true });

    return res.json({ success: true, message: "Usuario actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    let message = "Error al actualizar usuario";
    if (error?.code === "auth/email-already-exists") message = "El email ya está en uso por otro usuario";
    return res.status(400).json({ success: false, message });
  }
});

/**
 * 📌 Eliminar usuario (ADMIN)
 * Acepta:
 *   - :id = uid (ideal)
 *   - :id = docId aleatorio cuyo data.id = uid
 *   - :id = email (buscar por campo email)
 */
router.delete("/create_user/:id", verifyAdmin, async (req, res) => {
  try {
    const paramId = req.params.id;

    // 1) Intentar como si el param fuera el docId directo
    const refByDocId = adminDb.doc(`Users/${paramId}`);
    const snapByDocId = await refByDocId.get();

    let uidReal = null;
    let docRefToDelete = null;

    if (snapByDocId.exists) {
      const data = snapByDocId.data() || {};
      uidReal = data.id || paramId;       // si el doc tiene "id" (uid), úsalo; si no, asume docId = uid
      docRefToDelete = refByDocId;
    } else {
      // 2) No existe ese docId. Busca por campo "id" (uid) o por email.
      const col = adminDb.collection("Users");

      // a) Buscar por id == paramId
      let querySnap = await col.where("id", "==", paramId).limit(1).get();
      if (!querySnap.empty) {
        const d = querySnap.docs[0];
        uidReal = (d.data() || {}).id || d.id;
        docRefToDelete = adminDb.doc(`Users/${d.id}`); // puede ser d.id != uid
      } else if (paramId.includes("@")) {
        // b) si parece email, intenta por email
        querySnap = await col.where("email", "==", paramId).limit(1).get();
        if (!querySnap.empty) {
          const d = querySnap.docs[0];
          uidReal = (d.data() || {}).id || d.id;
          docRefToDelete = adminDb.doc(`Users/${d.id}`);
        }
      }
    }

    if (!uidReal || !docRefToDelete) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado en la base de datos",
      });
    }

    // 3) Intentar borrar en Auth (si existe)
    try {
      await adminAuth.getUser(uidReal);
      await adminAuth.deleteUser(uidReal);
    } catch (authErr) {
      if (authErr?.code !== "auth/user-not-found") {
        // si es otro error distinto a "no existe", reportamos
        throw authErr;
      }
      // si no existe en Auth, seguimos con Firestore igualmente
    }

    // 4) Borrar doc de Firestore (el correcto)
    await docRefToDelete.delete();

    return res.json({ success: true, message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("[create_user DELETE]", error);
    return res.status(400).json({
      success: false,
      message: "Error al eliminar usuario",
      code: error?.code,
    });
  }
});

module.exports = router;
