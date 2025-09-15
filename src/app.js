// src/app.js
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { db } = require('./firebase');

const app = express();

// ✅ Permite ambos proyectos en *.web.app y *.firebaseapp.com (sin importar trailing slashes)
const ORIGIN_REGEX = /^https:\/\/(registro-de-datos-oilcasan|oilcasan-formulario)\.(web\.app|firebaseapp\.com)$/i;

app.use(
  cors({
    origin: (origin, callback) => {
      // Postman/cURL o llamadas internas
      if (!origin) return callback(null, true);

      const clean = origin.replace(/\/+$/, '');
      const ok = ORIGIN_REGEX.test(clean);

      if (ok) {
        return callback(null, true);
      } else {
        console.warn('❌ CORS bloqueado para:', origin);
        return callback(new Error('CORS not allowed for this origin: ' + origin), false);
      }
    },
    credentials: true,
    // (opcional) si tu frontend envía headers personalizados
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// Muy importante: responder preflight
app.options('*', cors());

app.use(morgan('dev'));
app.use(express.json());

// Rutas
app.use(require('./routes/login_user/login_user'));
app.use(require('./routes/password_reset/password_reset'));
app.use(require('./routes/logout/logout'));
app.use(require('./routes/create_user/create_user'));
app.use(require('./routes/forms/forms'));
app.use(require('./routes/stats/stats'));
app.use(require('./routes/forms_list/forms_list'));
app.use(require('./routes/menu/menu'));

// Healthcheck (útil para probar CORS rápido)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ Backend OILCASAN activo',
    origin: req.headers.origin || null,
    time: new Date().toISOString(),
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err && err.stack ? err.stack : err);
  if (String(err).includes('CORS not allowed')) {
    return res.status(403).json({ success: false, message: String(err) });
  }
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

module.exports = app;
