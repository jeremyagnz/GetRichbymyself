# GetRichbymyself — Trading Performance Calculator

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_NETLIFY_SITE_ID/deploy-status)](https://app.netlify.com/sites/YOUR_NETLIFY_SITE_NAME/deploys)

Calculadora cuantitativa de trading para proyecciones de rentabilidad individuales y multi-cuenta (copy trading).

## 🚀 Deploy en Netlify

El sitio se despliega automáticamente en Netlify con cada push a la rama principal.

### Pasos para conectar Netlify

1. Ve a [netlify.com](https://netlify.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add new site" → "Import an existing project"**.
3. Selecciona el repositorio `jeremyagnz/GetRichbymyself`.
4. Netlify detectará automáticamente la configuración de `netlify.toml`.
5. Haz clic en **"Deploy site"**.

Netlify generará automáticamente **Deploy Previews** para cada Pull Request, con una URL única del tipo `https://deploy-preview-XX--YOUR_SITE.netlify.app`.

Una vez desplegado, reemplaza `YOUR_NETLIFY_SITE_ID` y `YOUR_NETLIFY_SITE_NAME` en el badge de arriba con los valores de tu sitio en Netlify (**Site settings → General → Site details**).

## Uso

Abre `index.html` en cualquier navegador moderno, o visita la URL de Netlify. No requiere servidor ni dependencias externas.

## Funcionalidades

- **16 métricas calculadas** por cuenta y consolidadas
- **Copy trading / multi-cuenta**: multiplica resultados por número de cuentas y factor de copiado
- **Escenarios**: base, conservador (WR −10 %), optimista (WR +10 %) y cuentas duplicadas
- **Análisis de riesgo**: drawdown potencial, racha perdedora, riesgo de ruina, break-even
- **Recomendaciones automáticas** de escalado

## Variables de entrada

| Campo | Descripción |
|---|---|
| Target por trade | Ganancia esperada en cada operación ganadora |
| Stop loss por trade | Pérdida máxima en cada operación perdedora |
| Win rate (%) | Porcentaje de operaciones ganadoras |
| Trades por día | Operaciones abiertas por jornada |
| Días de trading / semana | Jornadas activas semanales |
| Tiempo a proyectar | Semanas o meses |
| Capital por cuenta | Capital destinado a cada cuenta |
| Drawdown máximo | Pérdida máxima tolerable por cuenta |
| Número de cuentas | Cuentas conectadas al copy trading |
| Factor de copiado | Multiplicador de réplica (1 = copia exacta) |
| Costos/fees por trade | Comisiones por operación por cuenta |

## Ejemplo de input (valores predeterminados)

```
Target: $400 | Stop loss: $300 | Win rate: 67%
Trades/día: 2 | Días/semana: 5 | Tiempo: 5 meses
Capital/cuenta: $10 000 | Drawdown máx.: $2 500
Cuentas: 5 | Factor copiado: 1x | Costos: $0
```

---

## 🤖 Bot Automático — TradingView + Eightcap

El bot se genera y configura **directamente desde la página web**, sin necesidad de tocar código.

### Pasos rápidos

1. **Completa la Calculadora** (sección 01) con tu target, stop loss, win rate y capital.  
   Los valores se sincronizan automáticamente al Bot.
2. **Ir a la sección 04 — Bot Automático** de la misma página.
3. **Elige el instrumento, timeframe y horario** (NAS100, EUR/USD, XAU/USD, etc.).
4. Haz clic en **"🤖 Generar mi bot"**.
5. Descarga el archivo **`GetRichbymyself_bot.pine`** o cópialo.
6. Sigue las **5 instrucciones visuales** que aparecen en pantalla para cargarlo en TradingView y conectar Eightcap.

> ⚠️ **Plan TradingView requerido:** mínimo **Essential** para alertas en tiempo real. Se recomienda **Plus** o superior para múltiples alertas simultáneas.

---

### Archivos del bot en `/bot`

| Archivo | Descripción |
|---|---|
| `bot/strategy.pine` | Versión base del Pine Script v5 con valores predeterminados (referencia) |
| `bot/webhook-server.js` | Servidor Node.js opcional para multi-cuenta / Telegram / logging avanzado |
| `bot/package.json` | Dependencias del servidor webhook (`express`, `dotenv`) |
| `bot/.env.example` | Plantilla de variables de entorno para el servidor webhook |

> **Nota:** El archivo `bot.js` en la raíz del proyecto es el generador integrado en la página web. El directorio `/bot` contiene el servidor webhook opcional para flujos avanzados (multi-cuenta, Telegram, etc.).

---

#### Requisitos para el desarrollador

1. **Plataforma:** MetaTrader 4 o MetaTrader 5 instalado y conectado a tu broker.
2. **Lenguaje:** MQL4 (MT4) o MQL5 (MT5) — C++ simplificado, editor incluido en MetaEditor.
3. **Archivo a entregar:** un Expert Advisor (EA) `.mq4` / `.mq5` compilado a `.ex4` / `.ex5`.
4. **Parámetros de entrada del EA** (inputs configurables desde MT):

```mql5
// ── Money Management ──────────────────────────────────────────
input double TakeProfitUSD      = 400;   // Target por trade ($)
input double StopLossUSD        = 300;   // Stop loss por trade ($)
input int    MaxTradesPerDay    = 2;     // Trades máximos por día
input double MaxDrawdownUSD     = 2500;  // Drawdown máximo permitido ($)
input double CommissionPerTrade = 0;     // Costo/comisión por trade ($)
input double LotMultiplier      = 1.0;   // Factor de copiado / multiplicador
input double AccountBalance     = 10000; // Capital de referencia por cuenta

// ── Horario ───────────────────────────────────────────────────
input int    StartHour = 8;   // Hora de inicio (UTC)
input int    EndHour   = 17;  // Hora de cierre (UTC)
input bool   TradeMon  = true;
input bool   TradeTue  = true;
input bool   TradeWed  = true;
input bool   TradeThu  = true;
input bool   TradeFri  = true;
input bool   TradeSat  = false;
input bool   TradeSun  = false;
```

5. **Lógica mínima del EA:**
   - Calcular el tamaño del lote a partir de `StopLossUSD` y el valor del pip del instrumento.
   - Verificar que `tradesHoy < MaxTradesPerDay` antes de abrir posición.
   - Verificar que `drawdownActual < MaxDrawdownUSD` antes de abrir posición.
   - Colocar TP y SL automáticamente en puntos equivalentes a los USD objetivo.
   - Cerrar todas las posiciones y desactivarse si se supera el drawdown máximo.

6. **Copy trading en MT:** usar **MT4/MT5 Signals** del propio MetaTrader, o servicios como **MT Manager**, **Trade Copier** o **FX Blue Trade Copier** para replicar el EA en múltiples cuentas con el factor de copiado deseado.

---

### Opción B — TradingView + Eightcap (Pine Script + Webhooks)

> Esta es tu opción más directa ya que tienes cuentas en **TradingView con Eightcap**.

#### Requisitos para el desarrollador

1. **Plan TradingView:** mínimo **Essential** (para webhooks de alertas). Recomendado: **Plus** o superior para múltiples alertas simultáneas.
2. **Lenguaje:** Pine Script v5 (editor integrado en TradingView).
3. **Broker:** Eightcap — soporta ejecución automática vía **TradingView Broker Integration** (conectar cuenta directamente desde el panel de TradingView) y/o **webhooks**.
4. **Archivos a entregar:**
   - Script de Pine Script (`.pine`) con la estrategia y las alertas.
   - (Opcional) Servidor de webhook para recibir las alertas y enviarlas a la API del broker.

#### Parámetros de entrada del script Pine Script

```pine
//@version=5
strategy("Mi Plan Personalizado", overlay=true, 
         default_qty_type=strategy.fixed, default_qty_value=1)

// ── Money Management ──────────────────────────────────────────
var float TAKE_PROFIT_USD      = input.float(400,  "Target por trade ($)")
var float STOP_LOSS_USD        = input.float(300,  "Stop loss por trade ($)")
var int   MAX_TRADES_PER_DAY   = input.int(2,      "Trades máx. por día")
var float MAX_DRAWDOWN_USD     = input.float(2500, "Drawdown máximo ($)")
var float COMMISSION_PER_TRADE = input.float(0,    "Comisión por trade ($)")
var float LOT_MULTIPLIER       = input.float(1.0,  "Factor de copiado")
var float ACCOUNT_BALANCE      = input.float(10000,"Capital por cuenta ($)")

// ── Horario ───────────────────────────────────────────────────
startHour = input.int(8,  "Hora inicio (UTC)")
endHour   = input.int(17, "Hora cierre (UTC)")
inSession = (hour >= startHour and hour < endHour) and 
            dayofweek != dayofweek.saturday and 
            dayofweek != dayofweek.sunday
```

#### Flujo de ejecución automática con Eightcap

```
TradingView (Pine Script)
        │  Alerta (JSON payload)
        ▼
  Webhook URL  ──────────────────────────────────────────────────────────┐
        │                                                                 │
   Opción 1:                                                         Opción 2:
TradingView Broker                                             Servidor intermedio
Integration (Eightcap)                                       (ej. Autoview, WunderTrading,
— ejecución directa desde                                     3Commas, o script propio)
  el panel de TradingView                                            │
  sin servidor externo                                    API REST de Eightcap / MT5
```

#### Payload de alerta (webhook JSON)

```json
{
  "action":     "{{strategy.order.action}}",
  "symbol":     "{{ticker}}",
  "price":      {{close}},
  "qty":        1,
  "tp_usd":     400,
  "sl_usd":     300,
  "comment":    "GetRichbymyself_bot"
}
```

#### Pasos de configuración en TradingView con Eightcap

1. **Conectar broker:** en TradingView → *Trading Panel* (abajo) → busca **Eightcap** → inicia sesión con tus credenciales.
2. **Agregar el script:** abre el editor Pine Script, pega el código de la estrategia y guárdalo.
3. **Crear alerta:**
   - Haz clic en el botón de alarma ⏰.
   - Condición: *[nombre de tu estrategia] — order fills only*.
   - Activar **"Order fills only"** para que la alerta dispare solo en entradas/salidas reales.
   - En *Notifications* → activar **Webhook URL** y pegar la URL del servidor (si usas intermediario) o dejar vacío si usas la integración directa del broker.
4. **Paper trading primero:** antes de activar dinero real, corre la estrategia en **Paper Trading** (cuenta demo de TradingView) para validar que TP, SL y el límite de trades diarios funcionan correctamente.

---

### Parámetros de riesgo que el bot debe respetar obligatoriamente

Independientemente de la plataforma elegida, el bot **debe implementar** estas reglas de control derivadas de tu plan:

| Regla | Lógica |
|---|---|
| Límite diario de trades | `if tradesHoy >= MAX_TRADES_PER_DAY → no abrir` |
| Drawdown máximo | `if pérdida_acumulada >= MAX_DRAWDOWN_USD → detener bot` |
| Break-even mínimo | Win rate real ≥ `SL / (TP + SL)` — verificar periódicamente |
| Tamaño de lote dinámico | `lote = (MAX_DRAWDOWN_USD * 0.01) / valor_pip_por_lote` (riesgo 1% por trade) |
| Comisiones | Descontar `COMMISSION_PER_TRADE` del P&L esperado antes de decidir abrir |
| Horario operativo | Solo operar en los días y horas configurados |

---

### Resumen: qué entregarle al desarrollador

Para que un programador construya el bot, compártele:

1. ✅ Los valores de tu plan generados por la calculadora (pantallazos o exportación).
2. ✅ La plataforma objetivo: **TradingView (con Eightcap)**, MT4 o MT5.
3. ✅ El instrumento/par a operar (ej. NAS100, EUR/USD, BTC/USD).
4. ✅ La lógica de entrada: indicadores técnicos, niveles de precio, señales que usas.
5. ✅ Timeframe (1m, 5m, 15m, 1H, etc.).
6. ✅ Si deseas copy trading: número de cuentas y factor de copiado.
7. ✅ Credenciales de API del broker (solo al desarrollador de confianza, nunca en código público).

---

## 📱 Usar el bot en iPhone con MetaTrader 4/5 (Eightcap o ICMarkets)

Esta sección explica cómo conectar tu cuenta de broker, monitorear las operaciones del bot y operar manualmente desde tu iPhone.

---

### 1. Descargar MetaTrader en el iPhone

| Plataforma | Enlace App Store |
|---|---|
| **MetaTrader 4 (MT4)** | [Buscar "MetaTrader 4" en App Store](https://apps.apple.com/app/metatrader-4/id496212596) |
| **MetaTrader 5 (MT5)** | [Buscar "MetaTrader 5" en App Store](https://apps.apple.com/app/metatrader-5/id413251709) |

> **¿MT4 o MT5?**  
> - **Eightcap** ofrece cuentas en MT4 y MT5 — usa la plataforma que abriste al registrarte.  
> - **ICMarkets** (IC Markets) opera principalmente en MT4 y MT5 — elige la misma versión que tu cuenta.  
> Si tienes dudas, consulta en el chat de soporte de tu broker cuál plataforma asignaron a tu cuenta.

---

### 2. Conectar tu cuenta Eightcap en MetaTrader iPhone

1. Abre la app **MetaTrader 4** o **MetaTrader 5** en tu iPhone.
2. Toca el ícono de **menú (☰)** → **"Manage Accounts"** → **"+"** (esquina superior derecha).
3. Elige **"Login to an Existing Account"**.
4. En el campo de búsqueda escribe **"Eightcap"** y selecciona el servidor correcto:
   - Demo: `Eightcap-Demo` (para practicar sin dinero real)
   - Real: `Eightcap-Live` (tu cuenta real)
5. Ingresa tu **número de cuenta** y **contraseña de investor o trading** que recibiste al registrarte.
6. Toca **"Sign In"**.

> 📧 Si no tienes los datos de servidor/cuenta, encuéntralos en el correo de bienvenida de Eightcap o en **My Eightcap → My Accounts**.

---

### 3. Conectar tu cuenta ICMarkets en MetaTrader iPhone

1. Abre **MetaTrader 4** o **MetaTrader 5**.
2. Menú **☰ → Manage Accounts → + → Login to an Existing Account**.
3. Busca **"ICMarkets"** y selecciona el servidor:
   - Demo MT4: `ICMarketsSC-Demo`
   - Real MT4: `ICMarketsSC-Live01` (o el número que te indiquen)
   - Demo MT5: `ICMarketsSC-Demo-2`
   - Real MT5: `ICMarketsSC-Live-5`
4. Introduce tu número de cuenta y contraseña.
5. Toca **"Sign In"**.

> 📧 Revisa el correo de bienvenida de IC Markets o entra a **Client Area → My Accounts** para obtener los datos exactos de servidor.

---

### 4. Qué puedes hacer desde el iPhone (y qué no)

| Acción | iPhone MT4/MT5 | Notas |
|---|---|---|
| Ver posiciones abiertas en tiempo real | ✅ | Sección "Trade" en la app |
| Ver historial de operaciones | ✅ | Sección "History" |
| Abrir/cerrar órdenes manualmente | ✅ | Tap en el par → New Order |
| Modificar TP/SL de posiciones abiertas | ✅ | Mantén presionada la orden |
| Ejecutar el bot automático (EA) | ❌ | Los Expert Advisors **no corren** en la app móvil — requieren MetaTrader Desktop (Windows/Mac) o un VPS |
| Recibir notificaciones push del bot | ✅ | Configurar en MT Desktop: *Tools → Options → Notifications → MetaQuotes ID* |

> ⚠️ **Importante:** el bot automatizado (EA o Pine Script) **debe correr en una computadora o servidor 24/7**. El iPhone sirve para **monitorear y gestionar** las posiciones, no para ejecutar el bot.

---

### 5. Cómo recibir alertas del bot en tu iPhone

#### Opción A — Notificaciones push de MetaTrader Desktop al iPhone

1. En la app iPhone, ve a **☰ → Settings → Messages** y copia tu **MetaQuotes ID**.
2. En MetaTrader Desktop (tu PC / VPS): **Tools → Options → Notifications**.
3. Activa **"Enable Push Notifications"** y pega el MetaQuotes ID.
4. El bot (EA) puede enviar alertas con `SendNotification("texto")` en MQL4/MQL5.

#### Opción B — Notificaciones Telegram (recomendado para el bot de TradingView)

Si usas el servidor webhook (`bot/webhook-server.js`), configura Telegram en `.env`:

```
TELEGRAM_BOT_TOKEN=token_de_tu_bot
TELEGRAM_CHAT_ID=tu_chat_id
```

Recibirás en tu iPhone (app Telegram) una notificación por cada orden abierta/cerrada.

#### Opción C — Alertas de TradingView (solo TradingView + Eightcap)

1. En TradingView (web o app móvil) crea la alerta del bot.
2. En *Notifications* activa **"Mobile App"** y **"Email"**.
3. Instala la app **TradingView** en tu iPhone para recibir las notificaciones en tiempo real.

---

### 6. Flujo completo recomendado para iPhone

```
PC / VPS (24/7)                          iPhone
───────────────────────────────          ──────────────────────
MetaTrader Desktop + EA activo    ──→   App MT4/MT5: monitorea trades
  o                                     App Telegram: recibe alertas
TradingView + bot Pine Script     ──→   App TradingView: notificaciones
  + servidor webhook (Node.js)    ──→   App Telegram: log de órdenes
```

---

### 7. Resumen de brokers compatibles

| Broker | MT4 | MT5 | Integración TradingView | Regulación |
|---|---|---|---|---|
| **Eightcap** | ✅ | ✅ | ✅ Directo (panel TradingView) | ASIC, FCA, CySEC |
| **ICMarkets** (IC Markets) | ✅ | ✅ | Vía webhook | ASIC, CySEC, FSA |

> Para la integración directa con TradingView (sin servidor), **Eightcap es la opción más sencilla** ya que aparece en el panel de brokers de TradingView. ICMarkets requiere el servidor webhook.

---

## 🤖 Bot incluido — Archivos en `/bot`

El directorio `/bot` contiene el bot listo para usar:

| Archivo | Descripción |
|---|---|
| `bot/strategy.pine` | Estrategia Pine Script v5 para TradingView (EMA + RSI con money management completo) |
| `bot/webhook-server.js` | Servidor Node.js que recibe alertas de TradingView y las reenvía a Eightcap/MT5 |
| `bot/package.json` | Dependencias del servidor webhook (`express`, `dotenv`) |
| `bot/.env.example` | Plantilla de variables de entorno (copia a `.env` y completa los valores) |

---

### 🚀 Inicio rápido — TradingView + Eightcap (integración directa, sin servidor)

> **Esta es la opción más sencilla.** No requiere desplegar ningún servidor.

1. **Conectar Eightcap en TradingView**
   - En TradingView, abre el *Trading Panel* (barra inferior).
   - Busca **Eightcap** y haz clic en *Connect*.
   - Inicia sesión con tus credenciales de Eightcap.

2. **Agregar la estrategia**
   - Abre el *Pine Script Editor* (botón en la barra inferior).
   - Pega el contenido de `bot/strategy.pine` y haz clic en **Save + Add to chart**.

3. **Configurar los inputs** (panel de configuración del script)

   | Input | Valor recomendado (ajusta según tu calculadora) |
   |---|---|
   | Target por trade ($) | 400 |
   | Stop loss por trade ($) | 300 |
   | Trades máx. por día | 2 |
   | Drawdown máximo ($) | 2500 |
   | Comisión por trade ($) | 0 (ajusta según Eightcap) |
   | Factor de copiado | 1.0 |
   | Tamaño de lote fijo | 1.0 (ver tabla de instrumentos) |
   | Valor del punto ($) | 1.0 para NAS100/US100 |
   | Hora inicio/cierre (UTC) | 8 / 17 |

4. **Crear alerta** para ejecución automática
   - Haz clic en el ícono de alarma ⏰.
   - Condición: `[Bot] GetRichbymyself — order fills only`.
   - En *Notifications* → habilitar **"Create server-side alert"**.
   - Si usas integración directa de broker, las órdenes se ejecutan sin webhook.

5. **Paper trading primero** — corre la estrategia en modo demo antes de usar dinero real.

> ⚠️ **Plan TradingView requerido:** mínimo **Essential** (para alertas en tiempo real y webhooks). Se recomienda **Plus** o superior si vas a tener múltiples alertas activas simultáneamente.

---

### 🖥️ Inicio rápido — Servidor Webhook (multi-cuenta / Telegram / logging)

> Usa esta opción si quieres ejecutar en múltiples cuentas, recibir notificaciones por Telegram, o tener un log completo de todas las órdenes.

#### Requisitos del servidor

- **Node.js** ≥ 18
- Un servidor con IP pública accesible desde internet (ej. VPS, Railway, Render, Fly.io, Heroku)
- **Plan TradingView Essential o superior** (para webhooks)
- Acceso a la API REST de MetaTrader 5 (ver opciones más abajo)

#### Opciones para la API MT5 con Eightcap

| Opción | Descripción | Costo |
|---|---|---|
| **MetaAPI** ([metaapi.cloud](https://metaapi.cloud)) | SaaS: conecta tu cuenta MT5 de Eightcap y expone una API REST. **Recomendado.** | Plan gratis disponible |
| **EA Puente propio** | Expert Advisor en MT5 que levanta un servidor HTTP local | Gratuito (requiere MT5 siempre activo) |
| **TradeLocker API** | Si Eightcap ofrece acceso a TradeLocker | Verificar con Eightcap |

#### Pasos de instalación

```bash
# 1. Ir al directorio del bot
cd bot

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tu editor:
#   WEBHOOK_SECRET = token largo y aleatorio (genera con: openssl rand -hex 32)
#   MT5_API_URL    = URL de tu API MT5 (ej. https://tu-instancia.metaapi.cloud)
#   MT5_API_KEY    = clave de API de MetaAPI u otro proveedor

# 4. Iniciar el servidor
npm start
```

El servidor escuchará en `http://localhost:3000` (o el puerto configurado en `PORT`).

#### URL del webhook para TradingView

```
https://tu-dominio.com/webhook?token=TU_WEBHOOK_SECRET
```

Pega esta URL en el campo **Webhook URL** al crear la alerta en TradingView.

#### Notificaciones Telegram (opcional)

Agrega en tu `.env`:
```
TELEGRAM_BOT_TOKEN=token_de_tu_bot_de_telegram
TELEGRAM_CHAT_ID=tu_chat_id
```

Para obtener un bot de Telegram: habla con [@BotFather](https://t.me/BotFather) en Telegram.

---

### ⚠️ Tabla de Valor del Punto por instrumento (Eightcap)

Ajusta el input **"Valor del punto ($)"** en el script según el instrumento:

| Instrumento | Símbolo TV | Valor del punto | Lote mínimo Eightcap |
|---|---|---|---|
| NASDAQ 100 | `CAPITALCOM:US100` | 1.0 | 0.1 (mini) |
| EUR/USD | `EIGHTCAP:EURUSD` | 1.0 por pip | 0.01 |
| XAU/USD (Oro) | `EIGHTCAP:XAUUSD` | 1.0 | 0.01 |
| GBP/USD | `EIGHTCAP:GBPUSD` | 1.0 por pip | 0.01 |
| BTC/USD | `EIGHTCAP:BTCUSD` | 1.0 | 0.001 |

> Verifica siempre las especificaciones de contrato en tu cuenta Eightcap antes de operar con dinero real.

---

### 🔐 Seguridad

- **Nunca** subas el archivo `.env` a Git (ya está en `.gitignore`).
- El `WEBHOOK_SECRET` protege el endpoint de alertas externas no autorizadas.
- Las credenciales de la API de Eightcap/MT5 solo deben existir en el archivo `.env` del servidor, nunca en el código fuente.
