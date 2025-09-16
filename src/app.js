// src/app.js
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { randomUUID } = require("crypto");

const app = express();

/* ===================== CORS (whitelist por HOST) ===================== */
/** IMPORTANTE: solo host:puerto, SIN https:// ni barras */
const ALLOWED_HOSTS = new Set([
  // Fronts en Firebase Hosting (ajusta si cambian)
  "registro-de-datos-oilcasan.web.app",
  "registro-de-datos-oilcasan.firebaseapp.com",
  "oilcasan-formulario.web.app",
  "oilcasan-formulario.firebaseapp.com",

  // Dev local
  "localhost:4000",
  "127.0.0.1:4000",

  // Tu backend Render (útil si abres HTMLs de prueba ahí o haces llamadas desde ese origin)
  "actualizacion-datos-oilcasan.onrender.com",
]);

function originToHost(origin) {
  if (!origin) return null; // Ej: curl/healthcheck, o mismo origen
  try {
    return new URL(origin).host; // p.ej. "registro-de-datos-oilcasan.web.app"
  } catch {
    return null;
  }
}

app.use(
  cors({
    origin: (origin, cb) => {
      const host = originToHost(origin);
      if (!host) return cb(null, true); // permite llamadas sin Origin (curl/Render health)
      if (ALLOWED_HOSTS.has(host)) return cb(null, true);
      return cb(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);
// Opcional: responder preflight de forma explícita
app.options("*", cors());

/* ===================== Middlewares base ===================== */
// ID de request para correlacionar logs en Render
app.use((req, res, next) => {
  req.id =
    (typeof randomUUID === "function" ? randomUUID() : Math.random().toString(36).slice(2, 10))
      .replace(/-/g, "")
      .slice(0, 8);
  res.setHeader("X-Req-Id", req.id);
  next();
});

// Logger con ID
morgan.token("id", (req) => req.id);
app.use(morgan(":date[iso] :id :method :url :status :response-time ms"));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ===================== Endpoints de salud ===================== */
app.get("/ping", (_req, res) => res.type("text/plain").send("pong"));
app.get("/", (_req, res) =>
  res.json({
    ok: true,
    name: "OILCASAN API",
    time: new Date().toISOString(),
  })
);

/* ===================== Rutas de la API ===================== */
/** Ajusta los require si tu estructura difiere.
 *  Cada router ya define su propio path (ej: "/login_user", "/auth/me", etc.)
 */
function mount(path, loader) {
  try {
    app.use(loader());
    console.log(`[mount] OK -> ${path}`);
  } catch (e) {
    console.warn(`[mount] NO montada -> ${path}: ${e.message}`);
  }
}

mount("routes/login_user/login_user.js", () => require("./routes/login_user/login_user"));
mount("routes/menu/menu.js", () => require("./routes/menu/menu"));
mount("routes/forms/forms.js", () => require("./routes/forms/forms"));
mount("routes/stats/stats.js", () => require("./routes/stats/stats"));
mount("routes/create_user/create_user.js", () => require("./routes/create_user/create_user"));
mount("routes/logout/logout.js", () => require("./routes/logout/logout"));
mount("routes/password_reset/password_reset.js", () => require("./routes/password_reset/password_reset"));

/* ===================== Manejo de errores ===================== */
app.use((err, _req, res, _next) => {
  const msg = String(err && (err.message || err));
  if (msg.startsWith("CORS not allowed")) {
    return res.status(403).json({ success: false, message: msg });
  }
  console.error("🔥 Error:", err?.stack || err);
  res.status(500).json({ success: false, message: "Error interno del servidor" });
});

// 404 (por si caen en rutas no definidas)
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Ruta no encontrada" });
});

module.exports = app;
