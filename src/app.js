// src/app.js
require('dotenv').config();

const express = require('express');
const morgan  = require('morgan');
const cors    = require('cors');

const app = express();

// ====== Ajustes base ======
app.set('trust proxy', 1);                    // detrás de proxy (Render)
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ====== CORS SÓLIDO ======
// Acepta:
//  - cualquier subdominio *.web.app y *.firebaseapp.com (Firebase Hosting)
//  - localhost para desarrollo
//  - añade aquí orígenes adicionales si los necesitas
const corsOptions = {
  origin: [
    /https:\/\/.*\.web\.app$/,
    /https:\/\/.*\.firebaseapp\.com$/,
    'http://localhost:4000',
    'http://127.0.0.1:4000',
  ],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};

// Log del origin para diagnosticar preflights
app.use((req, res, next) => {
  console.log(`[CORS] ${req.method} ${req.path} origin=`, req.headers.origin || '(sin origin)');
  next();
});

// Aplica CORS global
app.use(cors(corsOptions));
// Preflight global
app.options('*', cors(corsOptions));
// (Opcional) preflight explícitos si alguno es sensible
app.options('/login_user', cors(corsOptions));

// ====== Rutas de salud/diagnóstico ======
app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'backend-oilcasan',
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// útil para probar CORS rápidamente desde el navegador
app.get('/__whoami', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    originReceived: req.headers.origin || null,
    ip: req.ip,
    ua: req.headers['user-agent'] || null,
    now: new Date().toISOString()
  });
});

// ====== Tus rutas reales ======
app.use(require('./routes/login_user/login_user'));
app.use(require('./routes/password_reset/password_reset'));
app.use(require('./routes/logout/logout'));
app.use(require('./routes/create_user/create_user'));
app.use(require('./routes/forms/forms'));
app.use(require('./routes/forms_list/forms_list'));
app.use(require('./routes/stats/stats'));
app.use(require('./routes/menu/menu'));

// ====== 404 explícito (tras todas las rutas) ======
app.use((req, res, next) => {
  console.warn('[404] No route for', req.method, req.originalUrl);
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// ====== Manejador de errores global ======
app.use((err, req, res, next) => {
  // Si el error viene de CORS, deja claro qué origin falló
  if (err && /CORS/i.test(err.message)) {
    console.error('[CORS ERROR]', err.message);
    return res.status(403).json({
      success: false,
      message: 'Origen no permitido por CORS',
      origin: req.headers.origin || null
    });
  }

  console.error('[ERROR]', err.stack || err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

module.exports = app;
