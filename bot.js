'use strict';

// ─── Instrument presets ───────────────────────────────────────────────────────
const INSTRUMENT_PRESETS = {
  'CAPITALCOM:US100': { pointValue: 1, label: 'NAS100/US100' },
  'EIGHTCAP:EURUSD':  { pointValue: 1, label: 'EUR/USD' },
  'EIGHTCAP:GBPUSD':  { pointValue: 1, label: 'GBP/USD' },
  'EIGHTCAP:XAUUSD':  { pointValue: 1, label: 'XAU/USD (Oro)' },
  'BITSTAMP:BTCUSD':  { pointValue: 1, label: 'BTC/USD' },
};

const TIMEFRAME_LABELS = {
  '1': '1 minuto', '5': '5 minutos', '15': '15 minutos',
  '30': '30 minutos', '60': '1 hora', '240': '4 horas', 'D': 'Diario',
};

// ─── Instrument selector ──────────────────────────────────────────────────────
const instrSel       = document.getElementById('bot-instrument');
const customWrap     = document.getElementById('bot-custom-symbol-wrap');
const pointValInput  = document.getElementById('bot-point-value');

instrSel.addEventListener('change', function () {
  const isCustom = this.value === 'custom';
  customWrap.hidden = !isCustom;
  if (!isCustom) {
    const preset = INSTRUMENT_PRESETS[this.value];
    if (preset) pointValInput.value = preset.pointValue;
  }
});

// ─── Sync from calculator ─────────────────────────────────────────────────────
document.addEventListener('calcParamsUpdated', function () {
  const p = window.calcParams;
  if (!p) return;

  document.getElementById('bot-tp').value          = p.target;
  document.getElementById('bot-sl').value          = p.stopLoss;
  document.getElementById('bot-max-trades').value  = p.tradesPerDay;
  document.getElementById('bot-max-dd').value      = p.maxDrawdown;
  document.getElementById('bot-commission').value  = p.costsPerAccount;
  document.getElementById('bot-copy-factor').value = p.copyFactor;

  const note = document.getElementById('bot-sync-note');
  note.innerHTML = '✅ <strong>Sincronizado</strong> desde la Calculadora. Puedes ajustar los valores si lo necesitas.';
  note.classList.add('bot-sync-note--synced');
});

// ─── Pine Script generator ────────────────────────────────────────────────────
function generatePineScript(c) {
  const bool  = v => v ? 'true' : 'false';
  const today = new Date().toISOString().slice(0, 10);

  return `//@version=5
// ════════════════════════════════════════════════════════════════════════════
// GetRichbymyself Bot — Generado automáticamente
// Instrumento: ${c.symbolLabel} | Timeframe: ${c.timeframeLabel} | Fecha: ${today}
// ════════════════════════════════════════════════════════════════════════════
strategy(
     title             = "[Bot] GetRichbymyself — TradingView + Eightcap",
     shorttitle        = "GRB Bot",
     overlay           = true,
     default_qty_type  = strategy.fixed,
     default_qty_value = ${c.lotSize},
     currency          = currency.USD,
     initial_capital   = 10000,
     pyramiding        = 0,
     calc_on_order_fills = false,
     process_orders_on_close = false)

// ─── Grupos de inputs ─────────────────────────────────────────────────────────
var string GRP_MM    = "\uD83D\uDCB0 Money Management"
var string GRP_INST  = "\u2699\uFE0F  Instrumento"
var string GRP_SCHED = "\uD83D\uDD50 Horario (UTC)"
var string GRP_ENTRY = "\uD83D\uDCC8 Estrategia de Entrada"

// ─── Money Management ─────────────────────────────────────────────────────────
i_tp_usd         = input.float(${c.tpUsd},        "Target por trade ($)",    group=GRP_MM, minval=1,   step=10)
i_sl_usd         = input.float(${c.slUsd},        "Stop loss por trade ($)", group=GRP_MM, minval=1,   step=10)
i_max_trades_day = input.int(  ${c.maxTradesDay}, "Trades max. por dia",     group=GRP_MM, minval=1,   maxval=20)
i_max_dd_usd     = input.float(${c.maxDdUsd},     "Drawdown maximo ($)",     group=GRP_MM, minval=100, step=100)
i_commission     = input.float(${c.commission},   "Comision por trade ($)",  group=GRP_MM, minval=0,   step=1)
i_lot_mult       = input.float(${c.lotMult},      "Factor de copiado",       group=GRP_MM, minval=0.1, step=0.1)

// ─── Instrumento ─────────────────────────────────────────────────────────────
i_lot_size    = input.float(${c.lotSize},    "Tamano de lote fijo",  group=GRP_INST, minval=0.001, step=0.01)
i_point_value = input.float(${c.pointValue}, "Valor del punto ($)",  group=GRP_INST, minval=0.0001, step=0.01)

// ─── Horario (UTC) ────────────────────────────────────────────────────────────
i_start_hour = input.int(${c.startHour}, "Hora inicio (UTC)", group=GRP_SCHED, minval=0, maxval=23)
i_end_hour   = input.int(${c.endHour},   "Hora cierre (UTC)", group=GRP_SCHED, minval=1, maxval=24)
i_trade_mon  = input.bool(${bool(c.mon)}, "Lunes",     group=GRP_SCHED)
i_trade_tue  = input.bool(${bool(c.tue)}, "Martes",    group=GRP_SCHED)
i_trade_wed  = input.bool(${bool(c.wed)}, "Miercoles", group=GRP_SCHED)
i_trade_thu  = input.bool(${bool(c.thu)}, "Jueves",    group=GRP_SCHED)
i_trade_fri  = input.bool(${bool(c.fri)}, "Viernes",   group=GRP_SCHED)

// ─── Estrategia de Entrada ────────────────────────────────────────────────────
i_ema_fast  = input.int(${c.emaFast}, "EMA Rapida (periodos)",       group=GRP_ENTRY, minval=2)
i_ema_slow  = input.int(${c.emaSlow}, "EMA Lenta (periodos)",        group=GRP_ENTRY, minval=3)
i_rsi_len   = input.int(${c.rsiLen},  "RSI Periodo",                 group=GRP_ENTRY, minval=2)
i_rsi_ob    = input.int(${c.rsiOb},  "RSI Sobrecompra (no Long)",   group=GRP_ENTRY, minval=51, maxval=100)
i_rsi_os    = input.int(${c.rsiOs},  "RSI Sobreventa (no Short)",   group=GRP_ENTRY, minval=1,  maxval=49)
i_use_long  = input.bool(${bool(c.useLong)},  "Operar Long",  group=GRP_ENTRY)
i_use_short = input.bool(${bool(c.useShort)}, "Operar Short", group=GRP_ENTRY)

// ─── Filtro de sesion ─────────────────────────────────────────────────────────
_day_ok = switch dayofweek
    dayofweek.monday    => i_trade_mon
    dayofweek.tuesday   => i_trade_tue
    dayofweek.wednesday => i_trade_wed
    dayofweek.thursday  => i_trade_thu
    dayofweek.friday    => i_trade_fri
    => false

in_session = _day_ok and (hour >= i_start_hour) and (hour < i_end_hour)

// ─── Indicadores ──────────────────────────────────────────────────────────────
ema_fast = ta.ema(close, i_ema_fast)
ema_slow = ta.ema(close, i_ema_slow)
rsi      = ta.rsi(close, i_rsi_len)

// ─── Contador de trades diarios ───────────────────────────────────────────────
var int trades_today = 0
var int last_day     = na

new_day = na(last_day) or dayofmonth != last_day
if new_day
    trades_today := 0
    last_day     := dayofmonth

// ─── Proteccion de drawdown ───────────────────────────────────────────────────
drawdown_ok = strategy.netprofit > -i_max_dd_usd

// ─── Tamano de lote ajustado ─────────────────────────────────────────────────
effective_lot = i_lot_size * i_lot_mult

// ─── Senales de entrada ──────────────────────────────────────────────────────
long_signal  = ta.crossover( ema_fast, ema_slow) and rsi < i_rsi_ob and rsi > 50
short_signal = ta.crossunder(ema_fast, ema_slow) and rsi > i_rsi_os and rsi < 50

can_trade = in_session and drawdown_ok and (trades_today < i_max_trades_day) and
            strategy.position_size == 0

// ─── Calculo de TP / SL en precio ────────────────────────────────────────────
net_tp_usd    = i_tp_usd - i_commission
net_sl_usd    = i_sl_usd + i_commission
price_per_usd = 1.0 / (effective_lot * i_point_value)
tp_dist       = net_tp_usd * price_per_usd
sl_dist       = net_sl_usd * price_per_usd

// ─── Ejecucion de ordenes ─────────────────────────────────────────────────────
if long_signal and can_trade and i_use_long
    strategy.entry("Long", strategy.long, qty=effective_lot, comment="LONG")
    strategy.exit("Exit Long", from_entry="Long",
                  limit = close + tp_dist,
                  stop  = close - sl_dist)
    trades_today += 1

if short_signal and can_trade and i_use_short
    strategy.entry("Short", strategy.short, qty=effective_lot, comment="SHORT")
    strategy.exit("Exit Short", from_entry="Short",
                  limit = close - tp_dist,
                  stop  = close + sl_dist)
    trades_today += 1

// ─── Detener si se supera el drawdown maximo ─────────────────────────────────
if not drawdown_ok and strategy.position_size != 0
    strategy.close_all(comment="DRAWDOWN_LIMIT")

// ─── Visualizacion ───────────────────────────────────────────────────────────
plot(ema_fast, "EMA Rapida", color=color.new(color.blue,   0), linewidth=1)
plot(ema_slow, "EMA Lenta",  color=color.new(color.orange, 0), linewidth=2)

bgcolor(in_session      ? color.new(color.green, 95) : na, title="Sesion activa")
bgcolor(not drawdown_ok ? color.new(color.red,   85) : na, title="Drawdown alcanzado")

plotshape(long_signal  and can_trade and i_use_long,
          title="Long",  style=shape.triangleup,
          location=location.belowbar, color=color.new(color.lime, 0),
          size=size.small, text="L")

plotshape(short_signal and can_trade and i_use_short,
          title="Short", style=shape.triangledown,
          location=location.abovebar, color=color.new(color.red, 0),
          size=size.small, text="S")

// ─── Alertas (Webhook JSON) ──────────────────────────────────────────────────
alertcondition(long_signal  and can_trade and i_use_long,
               title   = "Senal LONG",
               message = '{"action":"buy","symbol":"{{ticker}}","price":{{close}},"qty":' +
                         str.tostring(effective_lot) +
                         ',"tp_usd":' + str.tostring(i_tp_usd) +
                         ',"sl_usd":' + str.tostring(i_sl_usd) +
                         ',"comment":"GetRichbymyself_LONG"}')

alertcondition(short_signal and can_trade and i_use_short,
               title   = "Senal SHORT",
               message = '{"action":"sell","symbol":"{{ticker}}","price":{{close}},"qty":' +
                         str.tostring(effective_lot) +
                         ',"tp_usd":' + str.tostring(i_tp_usd) +
                         ',"sl_usd":' + str.tostring(i_sl_usd) +
                         ',"comment":"GetRichbymyself_SHORT"}')
`;
}

// ─── Form submit ──────────────────────────────────────────────────────────────
document.getElementById('botForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const botErr = document.getElementById('bot-error');
  botErr.hidden = true;

  function showErr(msg) {
    botErr.textContent = msg;
    botErr.hidden = false;
    botErr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const g   = id => parseFloat(document.getElementById(id).value) || 0;
  const gi  = id => parseInt(document.getElementById(id).value, 10) || 0;
  const gch = id => document.getElementById(id).checked;

  // Instrument
  const sel = document.getElementById('bot-instrument');
  let symbol      = sel.value;
  let symbolLabel = sel.options[sel.selectedIndex].getAttribute('data-label') || '';

  if (symbol === 'custom') {
    symbol      = (document.getElementById('bot-custom-symbol').value || '').trim().toUpperCase();
    symbolLabel = symbol;
    if (!symbol) return showErr('⚠️ Ingresa un símbolo personalizado.');
  }

  const tf             = document.getElementById('bot-timeframe').value;
  const timeframeLabel = TIMEFRAME_LABELS[tf] || tf;

  const config = {
    symbol, symbolLabel, tf, timeframeLabel,
    lotSize:     g('bot-lot-size')    || 1,
    pointValue:  g('bot-point-value') || 1,
    startHour:   gi('bot-start-hour'),
    endHour:     gi('bot-end-hour'),
    mon: gch('bot-mon'), tue: gch('bot-tue'), wed: gch('bot-wed'),
    thu: gch('bot-thu'), fri: gch('bot-fri'),
    tpUsd:        g('bot-tp'),
    slUsd:        g('bot-sl'),
    maxTradesDay: gi('bot-max-trades'),
    maxDdUsd:     g('bot-max-dd'),
    commission:   g('bot-commission'),
    lotMult:      g('bot-copy-factor') || 1,
    emaFast:      gi('bot-ema-fast'),
    emaSlow:      gi('bot-ema-slow'),
    rsiLen:       gi('bot-rsi-len'),
    rsiOb:        gi('bot-rsi-ob'),
    rsiOs:        gi('bot-rsi-os'),
    useLong:      gch('bot-use-long'),
    useShort:     gch('bot-use-short'),
  };

  // Validation
  if (config.tpUsd <= 0 || config.slUsd <= 0) {
    return showErr('⚠️ Target y Stop Loss deben ser mayores a cero.');
  }
  if (config.maxDdUsd <= 0) {
    return showErr('⚠️ El Drawdown máximo debe ser mayor a cero.');
  }
  if (config.startHour >= config.endHour) {
    return showErr('⚠️ La hora de inicio debe ser menor a la hora de cierre.');
  }
  if (!config.useLong && !config.useShort) {
    return showErr('⚠️ Debes habilitar al menos Long o Short.');
  }

  // Loading state
  const btn = document.getElementById('bot-btn');
  btn.querySelector('.btn-text').hidden = true;
  btn.querySelector('.btn-spinner').hidden = false;
  btn.disabled = true;

  requestAnimationFrame(() => {
    const pineScript = generatePineScript(config);

    // Store for download / copy
    window._generatedPineScript = pineScript;

    // Populate result panel
    document.getElementById('bot-instr-display').textContent = config.symbolLabel;
    document.getElementById('bot-tf-display').textContent    = config.timeframeLabel;
    document.getElementById('bot-code-preview').textContent  = pineScript;

    const result = document.getElementById('bot-result');
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth' });

    btn.querySelector('.btn-text').hidden = false;
    btn.querySelector('.btn-spinner').hidden = true;
    btn.disabled = false;
  });
});

// ─── Download Pine Script ─────────────────────────────────────────────────────
document.getElementById('btn-download-pine').addEventListener('click', function () {
  const code = window._generatedPineScript;
  if (!code) return;

  const blob = new Blob([code], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'GetRichbymyself_bot.pine';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ─── Copy to clipboard ────────────────────────────────────────────────────────
document.getElementById('btn-copy-pine').addEventListener('click', async function () {
  const code = window._generatedPineScript;
  if (!code) return;

  const btn = this;
  const orig = btn.textContent;

  try {
    await navigator.clipboard.writeText(code);
  } catch {
    // Fallback for browsers without Clipboard API
    const ta = document.createElement('textarea');
    ta.value = code;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  btn.textContent = '✅ ¡Copiado!';
  setTimeout(() => { btn.textContent = orig; }, 2000);
});
