// src/app.js
const express = require('express');
const morgan  = require('morgan');
const cors    = require('cors');

const app = express();

/* ========== CORS ========== */
// Usa solo host (sin protocolo/barras)
const ALLOWED_HOSTS = new Set([
  'registro-de-datos-oilcasan.web.app',
  'registro-de-datos-oilcasan.firebaseapp.com',
  'oilcasan-formulario.web.app',
  'oilcasan-formulario.firebaseapp.com',
  'localhost:4000',
  '127.0.0.1:4000',
]);

function hostFrom(origin) {
  try { return new URL(origin).host.toLowerCase(); }
  catch { return ''; }
}

console.log('🔐 ALLOWED_HOSTS =', [...ALLOWED_HOSTS].join(', '));

const corsOptions = {
  origin: (origin, cb) => {
    // Permite peticiones sin origin (curl/Postman/cron)
    if (!origin) return cb(null, true);

    const host = hostFrom(origin);
    const allowed = ALLOWED_HOSTS.has(host);
    console.log('🌐 CORS check → origin:', origin, 'host:', host, 'allowed:', allowed);

    return allowed
      ? cb(null, true)
      : cb(new Error('CORS not allowed for this origin: ' + origin), false);
  },
  credentials: true, // ok incluso si no usas cookies
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  optionsSuccessStatus: 204,
};

// Preflight para TODO (esto responde los OPTIONS con headers CORS)
app.options('*', cors(corsOptions));
// CORS normal
app.use(cors(corsOptions));

/* ========== MIDDLEWARES ========== */
app.use(morgan('dev'));
app.use(express.json());

/* ========== RUTAS ========== */
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
    ok: true,
    service: 'backend-oilcasan',
    origin: req.headers.origin || null,
    time: new Date().toISOString(),
  });
});

/* ========== ERRORES ========== */
app.use((err, req, res, next) => {
  if (String(err).startsWith('Error: CORS not allowed')) {
    return res.status(403).json({ success: false, message: String(err) });
  }
  console.error('🔥 Error:', err && err.stack ? err.stack : err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

module.exports = app;
