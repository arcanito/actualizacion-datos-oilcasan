// src/app.js
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { db } = require('./firebase'); // tu config de firebase

const app = express();

/**
 * Permitir:
 *  - localhost
 *  - oilcasan-formulario (proyecto viejo)
 *  - registro-de-datos-oilcasan (proyecto nuevo)
 *  en dominios *.web.app y *.firebaseapp.com
 */
const ALLOW_LIST = [
  'http://127.0.0.1:4000',
  'http://localhost:4000',
  'https://oilcasan-formulario.web.app',
  'https://oilcasan-formulario.firebaseapp.com',
  'https://registro-de-datos-oilcasan.web.app',
  'https://registro-de-datos-oilcasan.firebaseapp.com',
];

// Función de validación flexible (evita problemas por trailing slashes, etc.)
function isAllowedOrigin(origin) {
  if (!origin) return true; // Postman, curl, etc.
  // Quitar trailing slash si viene
  const clean = origin.replace(/\/+$/, '');
  return ALLOW_LIST.some(allowed => allowed === clean);
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      console.warn('❌ CORS bloqueado para:', origin);
      return callback(new Error('CORS not allowed for this origin: ' + origin), false);
    },
    credentials: true,
  })
);

// MUY IMPORTANTE: responder preflight
app.options('*', cors());

app.use(morgan('dev'));
app.use(express.json());

// ---------- Rutas ----------
app.use(require('./routes/login_user/login_user'));
app.use(require('./routes/password_reset/password_reset'));
app.use(require('./routes/logout/logout'));
app.use(require('./routes/create_user/create_user'));
app.use(require('./routes/forms/forms'));
app.use(require('./routes/stats/stats'));
app.use(require('./routes/forms_list/forms_list'));
app.use(require('./routes/menu/menu'));

// Healthcheck / debug
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ Backend OILCASAN activo',
    origin: req.headers.origin || null,
    time: new Date().toISOString(),
  });
});

// Manejador de errores
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err && err.stack ? err.stack : err);
  // Si el error viene de CORS, responder con cabeceras mínimas para que el navegador lo vea claro
  if (String(err).includes('CORS not allowed')) {
    return res.status(403).json({ success: false, message: String(err) });
  }
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

module.exports = app;
