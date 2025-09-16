// src/app.js
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const app = express();

/* ========== CORS (whitelist por host) ========== */
/** IMPORTANTE: usa solo host + puerto, sin https:// ni barras */
const ALLOWED_HOSTS = new Set([
  // Firebase Hosting (tus front-ends)
  "registro-de-datos-oilcasan.web.app",
  "registro-de-datos-oilcasan.firebaseapp.com",
  "oilcasan-formulario.web.app",
  "oilcasan-formulario.firebaseapp.com",

  // Dev local
  "localhost:4000",
  "127.0.0.1:4000",

  // Tu backend en Render (útil si abres páginas directamente ahí o haces pruebas)
  "actualizacion-datos-oilcasan.onrender.com",
]);

function originToHost(origin) {
  if (!origin) return null; // fetch sin Origin (curl/health)
  try {
    const { host } = new URL(origin);
    return host; // e.g. "registro-de-datos-oilcasan.web.app"
  } catch {
    return null;
  }
}

app.use((req, res, next) => {
  // Permitir preflight/JSON antes que nada
  next();
});

app.use(
  cors({
    origin: (origin, cb) => {
      const host = originToHost(origin);
      if (!host) return cb(null, true); // permitir curl/health/internal
      if (ALLOWED_HOSTS.has(host)) return cb(null, true);
      return cb(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

/* ========== Middlewares base ========== */
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ========== Endpoints de salud (rápidos) ========== */
app.get("/ping", (_req, res) => res.type("text/plain").send("pong"));
app.get("/", (_req, res) =>
  res.json({
    ok: true,
    name: "OILCASAN API",
    time: new Date().toISOString(),
  })
);

/* ========== Rutas de la API ========== */
/** OJO: estos require asumen tu estructura en /src/routes/<carpeta>/<archivo>.js
 *  Cada router ya define su path completo internamente (p.ej. "/login_user", "/auth/me", etc.)
 *  Si algún archivo está en lugar distinto en tu repo, ajusta el require.
 */
try {
  app.use(require("./routes/login_user/login_user"));
} catch (e) {
  console.warn("Ruta login_user no montada:", e.message);
}
try {
  app.use(require("./routes/menu/menu"));
} catch (e) {
  console.warn("Ruta menu no montada:", e.message);
}
try {
  app.use(require("./routes/forms/forms"));
} catch (e) {
  console.warn("Ruta forms no montada:", e.message);
}
try {
  app.use(require("./routes/stats/stats"));
} catch (e) {
  console.warn("Ruta stats no montada:", e.message);
}
try {
  app.use(require("./routes/create_user/create_user"));
} catch (e) {
  console.warn("Ruta create_user no montada:", e.message);
}
try {
  app.use(require("./routes/logout/logout"));
} catch (e) {
  console.warn("Ruta logout no montada:", e.message);
}
try {
  app.use(require("./routes/password_reset/password_reset"));
} catch (e) {
  console.warn("Ruta password_reset no montada:", e.message);
}

/* ========== Manejo de errores ========== */
app.use((err, _req, res, _next) => {
  if (String(err).startsWith("Error: CORS not allowed")) {
    return res.status(403).json({ success: false, message: String(err) });
  }
  console.error("🔥 Error:", err?.stack || err);
  res.status(500).json({ success: false, message: "Error interno del servidor" });
});

module.exports = app;
