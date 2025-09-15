// src/app.js
const express = require('express');
const morgan  = require('morgan');
const cors    = require('cors');

const app = express();

/* ======== CORS basado en host con logs ======== */
const ALLOWED_HOSTS = new Set([
  'oilcasan-formulario.web.app',
  'oilcasan-formulario.firebaseapp.com',
  'registro-de-datos-oilcasan.web.app',
  'registro-de-datos-oilcasan.firebaseapp.com',
  'localhost:4000',
  '127.0.0.1:4000',
]);

function hostFrom(origin) {
  try { return new URL(origin).host.toLowerCase(); }
  catch { return ''; }
}

console.log('🔐 ALLOWED_HOSTS =', [...ALLOWED_HOSTS].join(', '));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/Postman/Render health-checks
    const host = hostFrom(origin);
    const allowed = ALLOWED_HOSTS.has(host);
    console.log('🌐 CORS check → origin:', origin, 'host:', host, 'allowed:', allowed);
    return allowed ? cb(null, true)
                   : cb(new Error('CORS not allowed for this origin: ' + origin), false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// Responder a preflight
app.options('*', cors());

/* ======== middlewares ======== */
app.use(morgan('dev'));
app.use(express.json());

/* ======== rutas ======== */
app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'backend-oilcasan',
    origin: req.headers.origin || null,
    time: new Date().toISOString()
  });
});

// (mantén tus rutas tal cual)
app.use(require('./routes/login_user/login_user'));
app.use(require('./routes/password_reset/password_reset'));
app.use(require('./routes/logout/logout'));
app.use(require('./routes/create_user/create_user'));
app.use(require('./routes/forms/forms'));
app.use(require('./routes/stats/stats'));
app.use(require('./routes/forms_list/forms_list'));
app.use(require('./routes/menu/menu'));

/* ======== manejo de errores ======== */
app.use((err, req, res, next) => {
  const msg = String(err && err.message ? err.message : err);
  if (msg.includes('CORS not allowed')) {
    console.warn('🚫', msg);
    return res.status(403).json({ success: false, message: msg });
  }
  console.error('🔥 Error:', err && err.stack ? err.stack : err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

module.exports = app;
