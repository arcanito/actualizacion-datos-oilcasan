// src/app.js
const express = require('express');
const morgan  = require('morgan');
const cors    = require('cors');

const app = express();

// ⚠️ SIN slashes finales
const WHITELIST = new Set([
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  // proyecto anterior
  'https://oilcasan-formulario.web.app',
  'https://oilcasan-formulario.firebaseapp.com',
  // proyecto nuevo
  'https://registro-de-datos-oilcasan.web.app',
  'https://registro-de-datos-oilcasan.firebaseapp.com',
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman/cURL
      const clean = origin.toLowerCase().replace(/\/+$/, ''); // normaliza y quita "/"
      if (WHITELIST.has(clean)) return callback(null, true);

      console.warn('❌ CORS bloqueado para:', origin, '→', clean);
      return callback(new Error('CORS not allowed for this origin: ' + origin), false);
    },
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  })
);

// Responder todos los preflight
app.options('*', cors());

app.use(morgan('dev'));
app.use(express.json());

// ---- RUTAS DE TU API ----
app.use(require('./routes/login_user/login_user'));
app.use(require('./routes/password_reset/password_reset'));
app.use(require('./routes/logout/logout'));
app.use(require('./routes/create_user/create_user'));
app.use(require('./routes/forms/forms'));
app.use(require('./routes/stats/stats'));
app.use(require('./routes/forms_list/forms_list'));
app.use(require('./routes/menu/menu'));

// Healthcheck para probar rápido en el navegador
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'backend-oilcasan',
    origin: req.headers.origin || null,
    time: new Date().toISOString(),
  });
});

// Manejo de errores (incluye CORS)
app.use((err, req, res, next) => {
  if (String(err).includes('CORS not allowed')) {
    return res.status(403).json({ success: false, message: String(err) });
  }
  console.error('🔥 Error:', err && err.stack ? err.stack : err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

module.exports = app;
