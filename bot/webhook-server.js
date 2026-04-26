/**
 * GetRichbymyself — Webhook Server
 *
 * Recibe alertas JSON enviadas por TradingView (Pine Script strategy.pine)
 * y las reenvía a Eightcap / MetaTrader 5 a través de una API REST de puente.
 *
 * ── Flujo ────────────────────────────────────────────────────────────────────
 *
 *   TradingView (Pine Script)
 *       │  POST /webhook?token=<WEBHOOK_SECRET>
 *       │  Body: { "action":"buy"|"sell"|"close", "symbol":"...", ... }
 *       ▼
 *   webhook-server.js  ──►  MT5 REST API  ──►  Eightcap
 *       │
 *       └──►  Telegram (notificación opcional)
 *
 * ── Formato del payload esperado (del script strategy.pine) ──────────────────
 *
 *   {
 *     "action":  "buy" | "sell" | "close",
 *     "symbol":  "NAS100",
 *     "price":   21500.50,
 *     "qty":     1,
 *     "tp_usd":  400,
 *     "sl_usd":  300,
 *     "comment": "GetRichbymyself_LONG"
 *   }
 *
 * ── Integración directa con Eightcap en TradingView ─────────────────────────
 *   Si conectas tu cuenta Eightcap directamente en el Trading Panel de
 *   TradingView (sin webhook), este servidor NO es necesario.  El servidor
 *   solo es requerido si deseas un intermediario personalizado, logging,
 *   multi-cuenta o notificaciones Telegram.
 *
 * ── Arranque ─────────────────────────────────────────────────────────────────
 *   cp .env.example .env   # Completa los valores
 *   npm install
 *   npm start
 */

"use strict";

require("dotenv").config();

const express = require("express");

const app  = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const MT5_API_URL    = process.env.MT5_API_URL || "";
const MT5_API_KEY    = process.env.MT5_API_KEY || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID   || "";

app.use(express.json());

// ─── Middleware: valida el token secreto ─────────────────────────────────────
function validateToken(req, res, next) {
    const token = req.query.token || req.headers["x-webhook-token"] || "";
    if (!WEBHOOK_SECRET) {
        console.warn("[WARN] WEBHOOK_SECRET no configurado — endpoint desprotegido");
        return next();
    }
    if (token !== WEBHOOK_SECRET) {
        console.warn(`[WARN] Token inválido desde ${req.ip}`);
        return res.status(401).json({ error: "Token inválido" });
    }
    next();
}

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", ts: new Date().toISOString() });
});

// ─── Endpoint principal de webhook ───────────────────────────────────────────
app.post("/webhook", validateToken, async (req, res) => {
    const payload = req.body;
    const ts      = new Date().toISOString();

    // Validación básica del payload
    if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Payload inválido" });
    }

    const { action, symbol, price, qty, tp_usd, sl_usd, comment, reason } = payload;

    if (!action || !symbol) {
        return res.status(400).json({ error: "Campos 'action' y 'symbol' requeridos" });
    }

    const validActions = ["buy", "sell", "close"];
    if (!validActions.includes(action.toLowerCase())) {
        return res.status(400).json({ error: `Acción desconocida: ${action}` });
    }

    console.log(`[${ts}] 📨 Alerta recibida: ${JSON.stringify(payload)}`);

    // Construir la orden para MT5
    const order = buildOrder(payload);

    // Enviar la orden a MT5 REST API (si está configurada)
    let mt5Result = { skipped: true, reason: "MT5_API_URL no configurado" };
    if (MT5_API_URL) {
        mt5Result = await sendToMt5(order);
    } else {
        console.log("[INFO] MT5_API_URL no configurado — orden registrada pero no enviada");
    }

    // Notificación por Telegram (opcional)
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        await sendTelegram(formatTelegramMessage(payload, mt5Result)).catch((err) => {
            console.error("[WARN] Error enviando Telegram:", err.message);
        });
    }

    const logEntry = {
        ts,
        payload,
        order,
        mt5Result,
    };

    console.log(`[${ts}] ✅ Procesado: ${JSON.stringify(logEntry)}`);

    return res.json({ ok: true, ts, order, mt5Result });
});

// ─── Construir objeto de orden para MT5 ───────────────────────────────────────
function buildOrder(payload) {
    const { action, symbol, price, qty = 1, tp_usd, sl_usd, comment = "" } = payload;
    const act = action.toLowerCase();

    return {
        action:  act,
        symbol:  (symbol || "").toUpperCase(),
        price:   Number(price)  || 0,
        volume:  Number(qty)    || 1,
        tp_usd:  Number(tp_usd) || 0,
        sl_usd:  Number(sl_usd) || 0,
        comment: comment || "GetRichbymyself_bot",
        magic:   20240101,  // identificador único del bot en MT5
    };
}

// ─── Enviar orden a MT5 REST API ──────────────────────────────────────────────
/**
 * Este módulo asume que tienes un servidor REST puente corriendo en MT5.
 * Opciones populares:
 *   - MetaAPI (metaapi.cloud) — SaaS, soporta Eightcap MT5
 *   - TradeLocker API          — si Eightcap lo soporta
 *   - EA puente propio         — Expert Advisor en MT5 con servidor HTTP
 *
 * El endpoint POST /order debe aceptar el objeto `order` definido en buildOrder().
 */
async function sendToMt5(order) {
    const url = `${MT5_API_URL}/order`;
    try {
        const response = await fetch(url, {
            method:  "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key":    MT5_API_KEY,
            },
            body: JSON.stringify(order),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`[ERROR] MT5 API respondió ${response.status}: ${text}`);
            return { ok: false, status: response.status, body: text };
        }

        const data = await response.json();
        console.log("[INFO] Orden enviada a MT5:", JSON.stringify(data));
        return { ok: true, data };
    } catch (err) {
        console.error("[ERROR] No se pudo conectar con MT5 API:", err.message);
        return { ok: false, error: err.message };
    }
}

// ─── Notificación Telegram ────────────────────────────────────────────────────
function formatTelegramMessage(payload, mt5Result) {
    const emoji = payload.action === "buy"   ? "🟢" :
                  payload.action === "sell"  ? "🔴" : "⚪";
    const status = mt5Result.ok       ? "✅ Ejecutada"  :
                   mt5Result.skipped  ? "📋 Registrada" : "❌ Error";

    return (
        `${emoji} *GetRichbymyself Bot*\n` +
        `Acción: *${payload.action?.toUpperCase()}* ${payload.symbol}\n` +
        `Precio: ${payload.price || "—"}\n` +
        `Qty: ${payload.qty || 1}  TP: $${payload.tp_usd}  SL: $${payload.sl_usd}\n` +
        `Estado: ${status}\n` +
        `_${new Date().toISOString()}_`
    );
}

async function sendTelegram(text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id:    TELEGRAM_CHAT_ID,
            text,
            parse_mode: "Markdown",
        }),
    });
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Telegram API: ${err}`);
    }
}

// ─── Manejo de errores no capturados ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error("[ERROR] Unhandled:", err);
    res.status(500).json({ error: "Error interno del servidor" });
});

// ─── Arranque del servidor ────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 GetRichbymyself Webhook Server corriendo en http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Webhook: POST http://localhost:${PORT}/webhook?token=<WEBHOOK_SECRET>`);
    if (!WEBHOOK_SECRET) {
        console.warn("   ⚠️  WEBHOOK_SECRET no configurado — establece esta variable en .env");
    }
    if (!MT5_API_URL) {
        console.info("   ℹ️  MT5_API_URL no configurado — las órdenes solo serán registradas");
    }
});

module.exports = app;
