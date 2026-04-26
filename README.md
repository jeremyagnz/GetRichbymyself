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

## 🤖 Crear un Bot Automático a partir de tu Plan Personalizado

Una vez que la calculadora haya generado tu plan óptimo, los parámetros resultantes sirven directamente como especificación técnica para programar un bot de trading. A continuación se detalla qué necesita el desarrollador y cómo llevarlo a las plataformas disponibles.

### Parámetros que el bot necesita (salida de la calculadora)

| Parámetro | Variable en el bot | Descripción |
|---|---|---|
| **Target por trade** | `TAKE_PROFIT` | Puntos/pips o monto en USD de ganancia objetivo por operación |
| **Stop loss por trade** | `STOP_LOSS` | Puntos/pips o monto en USD de pérdida máxima por operación |
| **Win rate objetivo (%)** | _(referencia)_ | Usado para validar la estrategia de entrada; no se programa directamente |
| **Trades por día** | `MAX_TRADES_PER_DAY` | Límite de operaciones diarias que el bot puede abrir |
| **Días de trading / semana** | `TRADING_DAYS` | Días en que el bot opera (ej. lunes a viernes) |
| **Capital por cuenta** | `ACCOUNT_BALANCE` | Balance de referencia para calcular el tamaño del lote |
| **Drawdown máximo ($)** | `MAX_DRAWDOWN_USD` | Si la pérdida diaria/total alcanza este valor, el bot se detiene |
| **Costos / comisiones** | `COMMISSION_PER_TRADE` | Deducción por operación (spread + comisión del broker) |
| **Factor de copiado** | `LOT_MULTIPLIER` | Multiplicador de tamaño de posición para cuentas copiadas |
| **Número de cuentas** | _(gestión externa)_ | Administrado desde la herramienta de copy trading |

> **Importante:** el desarrollador también necesita definir la **lógica de entrada** (señal de compra/venta). La calculadora optimiza el *money management*; la señal es responsabilidad de la estrategia técnica (indicadores, price action, etc.).

---

### Opción A — MetaTrader 4 / MetaTrader 5 (MQL4 / MQL5)

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
