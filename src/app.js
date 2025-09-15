// src/app.js
require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { db } = require('./firebase');

const app = express();

// 🔥 Lista de orígenes permitidos (¡sin "/" al final!)
const allowedOrigins = [
  'http://127.0.0.1:4000',
  'http://localhost:4000',

  // hosting anterior (si aún lo usas)
  'https://oilcasan-formulario.web.app',
  'https://oilcasan-formulario.firebaseapp.com',

  // hosting nuevo
  'https://registro-de-datos-oilcasan.web.app',
  'https://registro-de-datos-oilcasan.firebaseapp.com'
];

// Middleware CORS (antes de las rutas)
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (ej: Postman, curl, SSR)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed for this origin: ' + origin), false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Manejo explícito de preflight (OPTIONS)
app.options('*', cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed for this origin: ' + origin), false);
  },
  credentials: true
}));

// Middlewares comunes
app.use(morgan('dev'));
app.use(express.json());

// Rutas
app.use(require("./routes/login_user/login_user"));
app.use(require("./routes/password_reset/password_reset"));
app.use(require("./routes/logout/logout"));
app.use(require("./routes/create_user/create_user"));
app.use(require('./routes/forms/forms'));
app.use(require('./routes/stats/stats'));
app.use(require('./routes/forms_list/forms_list'));
app.use(require('./routes/menu/menu'));

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

module.exports = app;
