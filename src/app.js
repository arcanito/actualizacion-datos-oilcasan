// src/app.js
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

// 🔒 Whitelist explícita (sin / al final)
const WHITELIST = new Set([
  'http://localhost:4000',
  'http://127.0.0.1:4000',

  // Proyecto viejo
  'https://oilcasan-formulario.web.app',
  'https://oilcasan-formulario.firebaseapp.com',

  // Proyecto nuevo
  'https://registro-de-datos-oilcasan.web.app',
  'https://registro-de-datos-oilcasan.firebaseapp.com',
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite llamadas sin origin (Postman/cURL/monitoreo)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.toLowerCase().replace(/\/+$/, '');
      const allowed = WHITELIST.has(cleanOrigin);

      if (allowed) {
        return callback(null, true);
      } else {
        console.warn('❌ CORS bloqueado para:', origin, '→ normalizado:', cleanOrigin);
        return callback(new Error('CORS not allowed for this origin: ' + origin), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Responder preflight de todo
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

// Healthcheck
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
