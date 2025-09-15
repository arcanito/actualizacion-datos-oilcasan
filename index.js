// src/app.js
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { db } = require('./firebase'); // tu config de firebase

const app = express();

// 🔥 Lista de orígenes permitidos (sin slash al final)
const allowedOrigins = [
  'http://127.0.0.1:4000',
  'http://localhost:4000',
  'https://registro-de-datos-oilcasan.web.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sin origin (Postman, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn('❌ Bloqueado por CORS:', origin);
        return callback(new Error('CORS not allowed for this origin: ' + origin), false);
      }
    },
    credentials: true,
  })
);

app.use(morgan('dev'));
app.use(express.json());

// 👉 Rutas
app.use(require('./routes/login_user/login_user'));
app.use(require('./routes/password_reset/password_reset'));
app.use(require('./routes/logout/logout'));
app.use(require('./routes/create_user/create_user'));
app.use(require('./routes/forms/forms'));
app.use(require('./routes/stats/stats'));
app.use(require('./routes/forms_list/forms_list'));
app.use(require('./routes/menu/menu'));

// 🛑 Ruta base para debug (opcional)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ Backend OILCASAN activo',
    timestamp: new Date().toISOString(),
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
});

module.exports = app;
