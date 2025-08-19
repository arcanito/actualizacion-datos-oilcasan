// routes/forms/registers.js
const { Router } = require('express');
const { db } = require('../../firebase');
const { collection, getDocs, getDoc, addDoc, doc, Timestamp, orderBy, query } = require('firebase/firestore');

const router = Router();

// Obtener todos los formularios
router.get('/records', async (req, res) => {
  try {
    const formsRef = collection(db, 'Formularios');
    const q = query(formsRef, orderBy('creadoEn', 'desc'));
    const snapshot = await getDocs(q);

    const forms = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        codigo: data.codigo || '',
        nombre: data.nombre || '',
        area: data.area || '',
        creadoEn: data.creadoEn || ''
      };
    });

    res.json({ success: true, records: forms });
  } catch (error) {
    console.error('Error al obtener formularios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener formularios'
    });
  }
});

// Obtener un formulario por ID (keys originales)
router.get('/records/:id', async (req, res) => {
  try {
    const formRef = doc(db, 'Formularios', req.params.id);
    const formSnap = await getDoc(formRef);

    if (!formSnap.exists()) {
      return res.status(404).json({ success: false, message: 'Formulario no encontrado' });
    }

    const data = formSnap.data();

    // Si hay campos tipo Timestamp, formatearlos
    Object.keys(data).forEach(key => {
      if (data[key]?.seconds) {
        data[key] = new Date(data[key].seconds * 1000).toLocaleDateString("es-CO");
      }
    });

    res.json({
      id: formSnap.id,
      ...data
    });
  } catch (error) {
    console.error('Error al obtener formulario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el formulario'
    });
  }
});

// Guardar nuevo formulario
router.post('/records', async (req, res) => {
  try {
    const formData = req.body;

    if (!formData.nombre || !formData.codigo) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y código son obligatorios'
      });
    }

    await addDoc(collection(db, 'Formularios'), {
      ...formData,
      creadoEn: Timestamp.now()
    });

    res.status(201).json({
      success: true,
      message: 'Formulario guardado exitosamente'
    });
  } catch (error) {
    console.error('Error al guardar formulario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar formulario'
    });
  }
});

module.exports = router;
