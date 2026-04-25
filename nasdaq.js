'use strict';

// ─── Interval maps ────────────────────────────────────────────────────────────
// Chart widget uses: '5','15','30','60','240','D'
// TA widget uses:    '5m','15m','30m','1h','4h','1D'
const TA_INTERVAL_MAP = {
  '5':   '5m',
  '15':  '15m',
  '30':  '30m',
  '60':  '1h',
  '240': '4h',
  'D':   '1D',
};

const TF_LABELS = {
  '5': '5 min', '15': '15 min', '30': '30 min',
  '60': '1 hora', '240': '4 horas', 'D': '1 día',
};

// Default symbol and active interval
let currentSymbol   = 'CME_MINI:NQ1!';
let currentInterval = '5';

// ─── Decision guide per timeframe ────────────────────────────────────────────
// Tells the user exactly how to act based on what the live TA widget shows.

const DECISION_GUIDE = {
  '5': {
    strong_buy:  'El NQ tiene <strong>impulso alcista fuerte</strong> en 5 min. Busca una vela de retroceso a EMA o soporte y entra LONG con stop −$300 y target +$400. Confirma que el 30 min también sea alcista.',
    buy:         'Momentum positivo en 5 min. Espera un pullback limpio (1-2 velas) a nivel de soporte o EMA antes de entrar LONG. No persigas la vela.',
    neutral:     'Rango sin dirección. <strong>No hay setup en este momento.</strong> Espera a que el precio rompa el rango (BOS) con volumen antes de entrar. Paciencia.',
    sell:        'Presión bajista en 5 min. Busca rebote a resistencia o EMA para entrar SHORT con stop +$300 y target −$400. Confirma que el 30 min sea bajista.',
    strong_sell: 'El NQ tiene <strong>impulso bajista fuerte</strong> en 5 min. Entra SHORT en el primer rebote a EMA o resistencia. Stop ajustado sobre el último swing.',
    avoid:       '⏱️ Sesiones activas: 09:30–11:30 ET y 14:00–15:30 ET. Evita operar fuera de esas ventanas y en noticias de alto impacto.',
  },
  '15': {
    strong_buy:  '<strong>Setup alcista sólido en 15 min.</strong> Verifica RSI entre 50–65 (no sobrecomprado). Entra LONG en pullback a EMA 9 o EMA 21. Stop bajo el último mínimo.',
    buy:         'Momentum comprador en 15 min. Busca un inside bar o pin bar alcista sobre soporte/EMA para activar tu entrada LONG con R/R 1.33.',
    neutral:     'Sin señal clara. Espera que el RSI 14 salga del rango 40–60 con momentum. Sin confirmación, sin trade.',
    sell:        'Presión bajista en 15 min. Entra SHORT en rebote a EMA 9/21 con vela de rechazo. RSI debe estar bajo 50 y sin divergencia positiva.',
    strong_sell: '<strong>Setup bajista sólido.</strong> Entra SHORT agresivo en el primer rebote. Confirma volumen descendente en el rebote y cierre bajo EMA.',
    avoid:       '📊 Evita entrar cuando RSI > 75 o < 25. Primeros 5 min de apertura NY son trampa.',
  },
  '30': {
    strong_buy:  '<strong>Sesgo alcista dominante en 30 min.</strong> Identifica la zona de demanda más cercana. Entra LONG cuando el precio retorne a esa zona con confirmación en 5/15 min.',
    buy:         'Bias alcista. Espera que el precio llegue a una zona de demanda o pullback al nivel de apertura. Entrada en confluencia con nivel clave.',
    neutral:     'Rango institucional. Identifica los extremos del rango. Opera el RECHAZO de extremos: long en soporte inferior, short en resistencia superior.',
    sell:        'Bias bajista. Espera retroceso a zona de oferta (último impulso bajista) para entrar SHORT. Confirma CHoCH o BOS bajista en 5 min.',
    strong_sell: '<strong>Oferta dominante.</strong> Las zonas de oferta son las mejores entradas SHORT del día. Espera el retesteo de la zona y entra con stop sobre el OB.',
    avoid:       '⚠️ No operes en medio de rango. Espera siempre test de extremos antes de entrar.',
  },
  '60': {
    strong_buy:  '<strong>Tendencia alcista intradiaria confirmada.</strong> SOLO busca longs hoy. Usa VWAP como soporte dinámico de entrada. Fib 50-61.8% del último impulso = zona ideal.',
    buy:         'Momentum comprador en 1H. El sesgo del día es alcista. Cada pullback es oportunidad LONG. Confirma en 15/30 min.',
    neutral:     'Sin tendencia clara en 1H. Día de rango. Reduce tamaño de posición o espera claridad. Operar rangos requiere disciplina máxima.',
    sell:        'Sesgo bajista intradiario. Solo busca shorts hoy. VWAP es resistencia dinámica. Cada rebote a VWAP es oportunidad SHORT.',
    strong_sell: '<strong>Tendencia bajista confirmada en 1H.</strong> SOLO busca shorts. Usa Fib 50-61.8% del rebote + rechazo de VWAP para entrar SHORT.',
    avoid:       '🕐 Niveles clave en horas redondas (9, 10, 14, 15 ET). Cuidado con reversiones en esos momentos.',
  },
  '240': {
    strong_buy:  '<strong>Tendencia alcista multiday activa.</strong> Identifica el Bullish Order Block del 4H más cercano. Cuando el precio lo retestee, entra LONG con confirmación en 1H.',
    buy:         'Contexto macro positivo. Días de corrección son oportunidades de compra. Espera que el precio llegue al OB del 4H y da señal en marcos menores.',
    neutral:     'Rango institucional en 4H. El precio está entre zonas sin dirección macro. Reduce exposición y espera rompimiento de estructura clara.',
    sell:        'Contexto bajista multiday. Busca Bearish Order Blocks del 4H como zonas de short. Confluencia con EMA 50 en 4H = setup de alta probabilidad.',
    strong_sell: '<strong>Presión vendedora institucional.</strong> Los OBs bajistas del 4H son tus mejores zonas de entry SHORT. Confirma con 1H antes de entrar.',
    avoid:       '📅 Semanas de FOMC/NFP: volatilidad extrema. No mantengas posiciones overnight sin hedge.',
  },
  'D': {
    strong_buy:  '<strong>Mercado en tendencia alcista macro.</strong> El sesgo de la semana/mes es UP. Prioriza longs en TODOS los marcos. Pullbacks a EMA 20 diaria son tus mejores entradas.',
    buy:         'Momentum semanal positivo. Busca días de retroceso con bajo volumen para entrar LONG. La EMA 20 diaria es soporte clave.',
    neutral:     'Consolidación macro. El NQ está en rango semanal/mensual. Reduce tamaño y espera rompimiento direccional con volumen antes de comprometerte.',
    sell:        'Presión bajista semanal. El sesgo macro es DOWN. Solo busca posiciones cortas en marcos menores. EMA 20 diaria = resistencia clave.',
    strong_sell: '<strong>Tendencia bajista macro activa.</strong> El NQ está en distribución. Prioriza shorts. Cada rebote a EMA 20 diaria es venta institucional.',
    avoid:       '🗓️ Semanas de OpEx (3ª semana del mes), FOMC, NFP: alta volatilidad y manipulación. Reduce apalancamiento.',
  },
};

// ─── Symbol helpers ──────────────────────────────────────────────────────────

// Returns the ticker without an optional exchange prefix (e.g. "CME_MINI:NQ1!" → "NQ1!").
// TradingView sometimes reports symbols without the exchange prefix in its
// onSymbolChanged events, so comparisons must use this normalised form.
function symBase(s) {
  return (s && s.includes(':')) ? s.split(':').pop() : s;
}

// ─── TradingView chart widget ─────────────────────────────────────────────────

let tvScriptLoaded = false;

function loadTVScript(callback) {
  if (tvScriptLoaded) { callback(); return; }
  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/tv.js';
  script.async = true;
  script.onload = () => { tvScriptLoaded = true; callback(); };
  document.head.appendChild(script);
}

// TradingView chart interval strings → our currentInterval keys
const TV_INTERVAL_MAP = {
  '1': '1', '3': '3', '5': '5', '15': '15', '30': '30',
  '45': '45', '60': '60', '120': '120', '180': '180', '240': '240',
  'D': 'D', '1D': 'D', 'W': 'W', '1W': 'W', 'M': 'M', '1M': 'M',
};

// Milliseconds to wait after onChartReady before accepting toolbar events.
// TradingView fires spurious onSymbolChanged/onIntervalChanged events during
// chart initialisation; this window ensures they are ignored.
const CHART_INIT_SETTLE_MS = 1500;

let tvWidgetInstance = null;
let _settleTimer      = null;   // ID of the active settle timeout (for cleanup)

function renderChart(interval, symbol) {
  const container = document.getElementById('tv-chart-container');
  container.innerHTML = '';
  tvWidgetInstance = null;
  // Cancel any pending settle timer from a previous chart instance so it
  // cannot flip `settled` on a new chart render.
  clearTimeout(_settleTimer);
  _settleTimer = null;

  const inner = document.createElement('div');
  inner.id = 'tv_nasdaq_' + Date.now();
  container.appendChild(inner);

  loadTVScript(() => {
    /* global TradingView */
    const widget = new TradingView.widget({
      width: '100%',
      height: 520,
      symbol: symbol,
      interval: interval,
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1',
      locale: 'es',
      toolbar_bg: '#1a1d27',
      backgroundColor: '#0f1117',
      gridColor: '#2e3350',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      studies: ['RSI@tv-basicstudies', 'VWAP@tv-basicstudies', 'MAExp@tv-basicstudies'],
      container_id: inner.id,
    });

    tvWidgetInstance = widget;

    widget.onChartReady(() => {
      // TradingView fires spurious onSymbolChanged / onIntervalChanged events
      // immediately after the chart finishes initialising (confirming its own
      // symbol/interval, or echoing a previous session's values).  We ignore
      // ALL events for a short window after onChartReady so we only react to
      // deliberate user interactions with the chart toolbar.
      let settled = false;
      _settleTimer = setTimeout(() => {
        // Only mark settled for the currently active chart instance.
        if (widget === tvWidgetInstance) settled = true;
        _settleTimer = null;
      }, CHART_INIT_SETTLE_MS);

      // Sync TA widget when user changes timeframe inside the chart toolbar.
      // Guard 1 (!settled): ignores spurious init events within the settle window.
      // Guard 2 (widget !== tvWidgetInstance): defence-in-depth for superseded instances.
      widget.activeChart().onIntervalChanged().subscribe(null, (newInterval) => {
        if (!settled || widget !== tvWidgetInstance) return;
        const mapped = TV_INTERVAL_MAP[newInterval] || newInterval;
        if (mapped === currentInterval) return;
        currentInterval = mapped;
        // Highlight the matching TF button (if any)
        document.querySelectorAll('.tf-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.interval === mapped);
        });
        renderTAWidget(currentInterval, currentSymbol);
        renderDecisionGuide(currentInterval, currentSymbol);
        renderTips(currentInterval);
      });

      // Sync TA widget when user searches a different symbol inside the chart
      widget.activeChart().onSymbolChanged().subscribe(null, () => {
        if (!settled || widget !== tvWidgetInstance) return;
        try {
          const newSymbol = widget.activeChart().symbol();
          // symBase strips exchange prefix so "FX:EURUSD" === "EURUSD" etc.
          if (!newSymbol || symBase(newSymbol) === symBase(currentSymbol)) return;
          currentSymbol = newSymbol;
          document.getElementById('symbol-input').value = newSymbol;
          document.getElementById('symbol-error').hidden = true;
          renderTAWidget(currentInterval, currentSymbol);
          renderDecisionGuide(currentInterval, currentSymbol);
        } catch (_) { /* chart not ready yet */ }
      });
    });
  });
}

// ─── TradingView Technical Analysis widget (LIVE signals) ────────────────────

function renderTAWidget(interval, symbol) {
  const taInterval = TA_INTERVAL_MAP[interval] || '1h';
  const container = document.getElementById('ta-widget-container');
  container.innerHTML = '';

  const config = {
    interval: taInterval,
    width: '100%',
    isTransparent: true,
    height: 400,
    symbol: symbol,
    showIntervalTabs: false,
    displayMode: 'multiple',
    locale: 'es',
    colorTheme: 'dark',
  };

  // Use iframe.srcdoc to inject a fresh HTML document containing TradingView's
  // official script-based embed code on every call.  The srcdoc is different
  // each time (new symbol/interval), so the browser always executes the script
  // fresh — bypassing the caching that froze the original script-injection approach.
  // This avoids any reliance on an external embed URL that might ignore the config.
  //
  // Note: TradingView's embed script reads the JSON config from the script element's
  // textContent via DOM (e.g. querySelectorAll), NOT from browser script execution,
  // so placing JSON between the <script src=...> tags is intentional and is the
  // pattern documented by TradingView for all their embed widgets.
  const srcdoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>html,body{margin:0;padding:0;background:transparent;height:100%}</style>
</head>
<body>
  <div class="tradingview-widget-container" style="height:100%">
    <div class="tradingview-widget-container__widget"></div>
    <script type="text/javascript"
      src="https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js"
      async>${JSON.stringify(config)}<\/script>
  </div>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.srcdoc = srcdoc;
  iframe.style.cssText = 'display:block;width:100%;height:400px;border:none;';
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('allowtransparency', 'true');
  container.appendChild(iframe);

  // Show the symbol name in the card header
  const shortLabel = symbol.includes(':') ? symbol.split(':')[1] : symbol;
  document.getElementById('live-signal-symbol').textContent = shortLabel;
}

// ─── Decision guide renderer ─────────────────────────────────────────────────

function renderDecisionGuide(interval, symbol) {
  const guide = DECISION_GUIDE[interval];
  if (!guide) return;

  const tfLabel   = TF_LABELS[interval] || interval;
  const shortLabel = symbol
    ? (symbol.includes(':') ? symbol.split(':')[1] : symbol)
    : 'NQ1!';

  document.getElementById('live-signal-tf').textContent     = tfLabel;
  document.getElementById('live-signal-symbol').textContent = shortLabel;
  document.getElementById('tf-tips-label').textContent      = tfLabel;

  // All values (guide.*, TF_TIPS[].text) are static strings defined in this
  // file — they are never populated from user input or external sources.
  // innerHTML is used deliberately to render <strong> tags within those strings.
  document.getElementById('decision-guide').innerHTML = `
    <div class="signal-legend">
      <div class="sig-title">Lee la señal del widget y actúa:</div>
      <div class="sig-row strong-buy">
        <span class="sig-badge">⬆⬆ STRONG BUY</span>
        <span>${guide.strong_buy}</span>
      </div>
      <div class="sig-row buy">
        <span class="sig-badge">⬆ BUY</span>
        <span>${guide.buy}</span>
      </div>
      <div class="sig-row neutral">
        <span class="sig-badge">➡ NEUTRAL</span>
        <span>${guide.neutral}</span>
      </div>
      <div class="sig-row sell">
        <span class="sig-badge">⬇ SELL</span>
        <span>${guide.sell}</span>
      </div>
      <div class="sig-row strong-sell">
        <span class="sig-badge">⬇⬇ STRONG SELL</span>
        <span>${guide.strong_sell}</span>
      </div>
      <div class="sig-row avoid-note">
        <span>${guide.avoid}</span>
      </div>
    </div>
    <div class="dec-note">
      Regla de oro: solo entra si R/R ≥ 1.33 ($400 target / $300 SL) y la señal del widget
      coincide con la dirección del marco superior.
    </div>
  `;
}

// ─── Per-timeframe strategic tips (collapsible) ───────────────────────────────

const TF_TIPS = {
  '5': [
    { icon: '🟢', text: 'Busca <strong>ruptura de estructura (BOS)</strong> en dirección del trend del 30 min. Una vela de cuerpo limpio que cierra por encima/abajo del último swing es señal de entrada.' },
    { icon: '📌', text: 'Identifica <strong>zonas de liquidez</strong> (máximos/mínimos anteriores del día). El precio suele barrer esa liquidez antes de moverse a tu target.' },
    { icon: '⏱️', text: 'Sesión relevante: <strong>09:30–11:30 ET</strong> (apertura NY) y <strong>14:00–15:30 ET</strong> (cierre NY). Evita trades en horario de almuerzo (12–14 ET) por bajo volumen.' },
    { icon: '🚫', text: 'No operes contra el trend del 1 hora. Si el 1H es bajista, solo busca shorts en el 5 min.' },
  ],
  '15': [
    { icon: '📈', text: '<strong>EMA 9 y EMA 21</strong>: cuando la 9 cruza la 21 con volumen confirma cambio de momentum. Entrada en el primer pullback a la EMA 9.' },
    { icon: '🏔️', text: '<strong>Máximos y mínimos del día anterior (PDH/PDL)</strong>: son imanes de precio. Operando el rechazo o la ruptura confirmada de estos niveles ofrece setups de alta probabilidad.' },
    { icon: '🕯️', text: 'Patrones de velas de reversión (engulfing, pin bar, inside bar) sobre niveles de soporte/resistencia + confluencia con EMA = setup válido.' },
    { icon: '📊', text: 'Verifica que el <strong>RSI (14)</strong> no esté en sobrecompra (>70) para longs ni en sobreventa (<30) para shorts.' },
  ],
  '30': [
    { icon: '📦', text: '<strong>Zonas de demanda</strong>: áreas donde el precio dejó velas de impulso alcista sin pullback = donde los institucionales compraron.' },
    { icon: '📦', text: '<strong>Zonas de oferta</strong>: áreas donde el precio dejó velas de impulso bajista sin rebote = donde los institucionales vendieron.' },
    { icon: '🔄', text: '<strong>CHoCH (Change of Character)</strong>: cuando el precio rompe la estructura contraria al trend previo. Señal de cambio de tendencia.' },
    { icon: '⚖️', text: 'Si el 30 min forma <strong>rango lateral</strong>, opera el rechazo de los extremos del rango con stop ajustado.' },
  ],
  '60': [
    { icon: '📉', text: '<strong>Estructura de mercado</strong>: HH/HL = uptrend. LH/LL = downtrend. Opera solo en la dirección de la estructura.' },
    { icon: '📊', text: '<strong>VWAP</strong>: precio sobre VWAP = presión compradora. Bajo VWAP = presión vendedora. Úsalo como filtro de sesgo.' },
    { icon: '🎯', text: '<strong>Fibonacci 50%-61.8%</strong>: tras un impulso en 1H, el retroceso a esta zona = entrada de mayor probabilidad.' },
    { icon: '🕐', text: 'Los <strong>niveles horarios exactos</strong> (09:00, 10:00, 14:00, 15:00 ET) frecuentemente coinciden con reversiones en NQ.' },
  ],
  '240': [
    { icon: '🏛️', text: '<strong>Order Blocks institucionales</strong>: última vela bajista antes de impulso alcista (bullish OB) o última vela alcista antes de impulso bajista (bearish OB).' },
    { icon: '📈', text: '<strong>EMA 50 y EMA 200 en 4H</strong>: sobre ambas = macro alcista. Bajo ambas = macro bajista. Entre las dos = rango institucional.' },
    { icon: '📅', text: 'Semanas de <strong>FOMC, NFP, CPI</strong>: acumulación antes del evento, expansión después. Evita overnight.' },
    { icon: '🔢', text: '<strong>Niveles psicológicos redondos</strong> (18000, 19000, 20000, 21000): imanes de precio y zonas clave.' },
  ],
  'D': [
    { icon: '📅', text: '<strong>Estructura diaria</strong>: HH/HL = sesgo alcista de largo plazo. Prioriza longs en marcos menores.' },
    { icon: '📊', text: '<strong>EMA 20 diaria</strong>: dynamic support en uptrend. Pullback a EMA 20 con reversión = setup de altísimo winrate en NQ.' },
    { icon: '🗓️', text: '<strong>Semanas clave</strong>: NFP (1ª del mes), FOMC (cada 6 semanas), OpEx (3ª semana del trimestre). Mayor volatilidad y fakeouts.' },
    { icon: '🔮', text: '<strong>Estacionalidad</strong>: Enero, Abril, Julio, Octubre = expansión alcista. Septiembre-Octubre = mayor volatilidad bajista.' },
  ],
};

function renderTips(interval) {
  const tips = TF_TIPS[interval];
  if (!tips) return;
  // t.icon and t.text are static strings from this file, not external input.
  document.getElementById('tf-analysis-body').innerHTML = tips.map(t =>
    `<div class="tf-signal"><span class="tf-signal-icon">${t.icon}</span><span>${t.text}</span></div>`
  ).join('');
}

// ─── Symbol input ─────────────────────────────────────────────────────────────

// ─── Symbol validation ─────────────────────────────────────────────────────
// Accepts letters, digits, colon (for exchange prefix), dot, hyphen, underscore,
// and exclamation mark (used in futures symbols like NQ1!, CME_MINI:NQ1!).
const SYMBOL_RE = /^[A-Z0-9:._\-!]{1,30}$/;

function applySymbol() {
  const raw = document.getElementById('symbol-input').value.trim().toUpperCase();
  const errEl = document.getElementById('symbol-error');
  if (!raw) return;
  if (!SYMBOL_RE.test(raw)) {
    errEl.textContent = '⚠️ Símbolo inválido. Usa solo letras, números y ":" para el exchange (ej: AAPL, EURUSD, BINANCE:BTCUSDT, CME_MINI:NQ1!).';
    errEl.hidden = false;
    return;
  }
  errEl.hidden = true;
  currentSymbol = raw;
  renderAll();
}

document.getElementById('symbol-apply-btn').addEventListener('click', applySymbol);

document.getElementById('symbol-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applySymbol();
});

// ─── Timeframe buttons ────────────────────────────────────────────────────────

document.querySelectorAll('.tf-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentInterval = btn.dataset.interval;
    renderAll();
  });
});

function renderAll() {
  renderChart(currentInterval, currentSymbol);
  renderTAWidget(currentInterval, currentSymbol);
  renderDecisionGuide(currentInterval, currentSymbol);
  renderTips(currentInterval);
}

// ─── Init ────────────────────────────────────────────────────────────────────

renderAll();
