// src/app.js
require('dotenv').config(); // 👈 Esto al inicio, antes de cualquier otra cosa

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

// Aquí ya apuntamos correctamente al firebase.js que está en src
const { db } = require('./firebase');

const app = express();

// Middlewares
app.use(cors({
    origin: 'http://127.0.0.1:5500', // O tu URL del front
    credentials: true
}));
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
