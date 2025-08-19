// routes/stats.js
const { Router } = require('express');
const { db } = require('../../firebase');
const { collection, getDocs } = require('firebase/firestore');

const router = Router();

// Campos que queremos incluir en las estadísticas
const camposPermitidos = {
  sexo: 'Distribución por Sexo',
  es_padre_madre: 'Padres o Madres',
  etnia: 'Pertenece a una Etnia',
  religion: 'Religión',
  lgbtiq: 'Comunidad LGBTIQ+',
  nivel_educativo: 'Nivel Educativo'
};

router.get('/records/stats', async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, 'Formularios'));
    const forms = snapshot.docs.map(doc => doc.data());

    if (forms.length === 0) {
      return res.json({});
    }

    const stats = {};

    forms.forEach(form => {
      for (const [campo, titulo] of Object.entries(camposPermitidos)) {
        if (form[campo] !== undefined && form[campo] !== null && form[campo] !== '') {
          const valor = String(form[campo]).trim();
          if (!stats[campo]) stats[campo] = {};
          stats[campo][valor] = (stats[campo][valor] || 0) + 1;
        }
      }
    });

    const chartData = {};
    Object.entries(stats).forEach(([campo, conteo]) => {
      chartData[campo] = {
        labels: Object.keys(conteo),
        data: Object.values(conteo),
        backgroundColor: [
          '#1a5f1a', '#4CAF50', '#8BC34A', '#FFC107',
          '#FF5722', '#2196F3', '#9C27B0', '#E91E63'
        ],
        title: camposPermitidos[campo]
      };
    });

    res.json(chartData);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error obteniendo estadísticas' });
  }
});

module.exports = router;
