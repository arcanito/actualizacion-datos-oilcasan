const { Router } = require('express');
const { adminAuth, db } = require('../../firebase');
const { doc, setDoc, getDoc, deleteDoc, collection, getDocs } = require('firebase/firestore');
const verifyAdmin = require('../middlewares/verifyAdmin');

const router = Router();

/**
 * 📌 Crear nuevo usuario
 */
router.post('/create_user', verifyAdmin, async (req, res) => {
  const { email, password, fullName, phone, role } = req.body;

  if (!email || !password || !fullName || !role) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, fullName y role son requeridos'
    });
  }

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Rol no válido (debe ser admin o user)'
    });
  }

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: role === 'admin'
    });

    const userData = {
      id: userRecord.uid,
      email,
      fullName,
      phone: phone || '',
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: req.user.uid
    };

    await setDoc(doc(db, "Users", userRecord.uid), userData);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: userRecord.uid,
        email,
        fullName,
        role
      }
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);

    let message = 'Error al crear usuario';
    if (error.code === 'auth/email-already-exists') {
      message = 'El email ya está registrado';
    } else if (error.code === 'auth/invalid-password') {
      message = 'La contraseña debe tener al menos 6 caracteres';
    }

    res.status(400).json({
      success: false,
      message,
      code: error.code
    });
  }
});

/**
 * 📌 Obtener todos los usuarios (solo admins)
 */
router.get('/create_user', verifyAdmin, async (req, res) => {
  try {
    const usersSnapshot = await getDocs(collection(db, "Users"));
    const users = [];

    usersSnapshot.forEach(docSnap => {
      const userData = docSnap.data();
      users.push({
        id: userData.id,
        fullName: userData.fullName,
        email: userData.email,
        role: userData.role,
        isActive: userData.isActive,
        createdAt: userData.createdAt,
        phone: userData.phone
      });
    });

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
});

/**
 * 📌 Editar usuario
 */
router.put('/create_user/:id', verifyAdmin, async (req, res) => {
  const userId = req.params.id;
  const { fullName, email, phone, role, isActive } = req.body;

  try {
    const userDoc = await getDoc(doc(db, "Users", userId));
    if (!userDoc.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado en la base de datos'
      });
    }

    let authUser;
    try {
      authUser = await adminAuth.getUser(userId);
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado en Firebase Auth'
        });
      }
      throw authError;
    }

    if (email && email !== authUser.email) {
      await adminAuth.updateUser(userId, {
        email,
        emailVerified: false
      });
    }

    const userData = {
      fullName,
      email,
      phone,
      role,
      isActive,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.uid
    };

    Object.keys(userData).forEach(key => userData[key] === undefined && delete userData[key]);

    await setDoc(doc(db, "Users", userId), userData, { merge: true });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);

    let message = 'Error al actualizar usuario';
    if (error.code === 'auth/email-already-exists') {
      message = 'El email ya está en uso por otro usuario';
    }

    res.status(400).json({
      success: false,
      message
    });
  }
});

/**
 * 📌 Eliminar usuario
 */
router.delete('/create_user/:id', verifyAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const userDoc = await getDoc(doc(db, "Users", userId));
    if (!userDoc.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado en la base de datos'
      });
    }

    try {
      await adminAuth.getUser(userId);
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado en Firebase Auth'
        });
      }
      throw authError;
    }

    await adminAuth.deleteUser(userId);
    await deleteDoc(doc(db, "Users", userId));

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(400).json({
      success: false,
      message: 'Error al eliminar usuario'
    });
  }
});

module.exports = router;
