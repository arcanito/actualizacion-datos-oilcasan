// src/app.js
const express = require('express');
const morgan  = require('morgan');
const cors    = require('cors');

const app = express();

// Hosts permitidos (solo host, sin protocolo ni barra final)
const ALLOWED_HOSTS = new Set([
  'oilcasan-formulario.web.app',
  'oilcasan-formulario.firebaseapp.com',
  'registro-de-datos-oilcasan.web.app',
  'registro-de-datos-oilcasan.firebaseapp.com',
  'localhost:4000',
  '127.0.0.1:4000',
]);

function isAllowedOrigin(origin) {
  try {
    const { host } = new URL(origin);
    return ALLOWED_HOSTS.has(host);
  } catch {
    return false;
  }
}

app.use(cors({
  origin: (origin, cb) => {
    // Requests sin origin (curl/Postman) → permitir
    if (!origin) return cb(null, true);

    const ok = isAllowedOrigin(origin);
    if (ok) return cb(null, true);

    // Log de diagnóstico (host que llegó y lista actual)
    try {
      const { host } = new URL(origin);
      console.warn('❌ CORS bloqueado. Origin:', origin, 'Host:', host);
    } catch {
      console.warn('❌ CORS bloqueado. Origin inválido:', origin);
    }
    return cb(new Error('CORS not allowed for this origin: ' + origin), false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Preflight
app.options('*', cors());

app.use(morgan('dev'));
app.use(express.json());

// ---- Rutas de tu API ----
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
    service: 'backend-oilcasan',
    origin: req.headers.origin || null,
    time: new Date().toISOString(),
  });
});

// Errores (incluye CORS)
app.use((err, req, res, next) => {
  if (String(err).includes('CORS not allowed')) {
    return res.status(403).json({ success: false, message: String(err) });
  }
  console.error('🔥 Error:', err && err.stack ? err.stack : err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

module.exports = app;
