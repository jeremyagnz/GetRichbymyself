'use strict';

// ─── Timeframe analysis data ──────────────────────────────────────────────────

const TF_DATA = {
  '5': {
    label: '5 minutos',
    role: '⚡ Ejecución precisa de entrada/salida',
    description: 'El gráfico de 5 min es tu herramienta de <strong>timing exacto</strong>. Úsalo únicamente para confirmar la entrada una vez que el bias direccional ya fue definido en marcos superiores (30 min / 1 h).',
    signals: [
      { icon: '🟢', text: 'Busca <strong>ruptura de estructura (BOS)</strong> en dirección del trend del 30 min. Una vela de cuerpo limpio que cierra por encima/abajo del último swing es señal de entrada.' },
      { icon: '📌', text: 'Identifica <strong>zonas de liquidez</strong> (máximos/mínimos anteriores del día). El precio suele barrer esa liquidez antes de moverse a tu target.' },
      { icon: '⏱️', text: 'Sesión relevante: <strong>09:30–11:30 ET</strong> (apertura NY) y <strong>14:00–15:30 ET</strong> (cierre NY). Evita trades en horario de almuerzo (12–14 ET) por bajo volumen.' },
      { icon: '🚫', text: 'No operes contra el trend del 1 hora. Si el 1H es bajista, solo busca shorts en el 5 min.' },
    ],
    decision: {
      long: 'LONG si: precio hace BOS alcista en 5 min + 30 min en uptrend + volumen creciente + vela de reversión sobre nivel clave.',
      short: 'SHORT si: precio hace BOS bajista en 5 min + 30 min en downtrend + rechazo de resistencia + menor volumen en rebote.',
      avoid: 'EVITAR: Rangos laterales sin dirección, noticias de alto impacto activas (FOMC, CPI), spreads elevados pre-apertura.',
    },
  },
  '15': {
    label: '15 minutos',
    role: '📐 Confirmación de setup y entrada refinada',
    description: 'El 15 min balancea velocidad con contexto. Ideal para ver <strong>patrones de continuación</strong> (flags, triángulos, pullbacks a EMA) que el 5 min fragmenta demasiado.',
    signals: [
      { icon: '📈', text: '<strong>EMA 9 y EMA 21</strong>: cuando la 9 cruza la 21 con volumen confirma cambio de momentum. Entrada en el primer pullback a la EMA 9.' },
      { icon: '🏔️', text: '<strong>Máximos y mínimos del día anterior (PDH/PDL)</strong>: son imanes de precio. Operando el rechazo o la ruptura confirmada de estos niveles ofrece setups de alta probabilidad.' },
      { icon: '🕯️', text: 'Patrones de velas de reversión (engulfing, pin bar, inside bar) sobre niveles de soporte/resistencia + confluencia con EMA = setup válido para tu sistema.' },
      { icon: '📊', text: 'Verifica que el <strong>RSI (14)</strong> no esté en sobrecompra (>70) para longs ni en sobreventa (<30) para shorts al momento de entrar.' },
    ],
    decision: {
      long: 'LONG si: pullback a EMA 21 en uptrend + vela de reversión + RSI entre 40-60 + nivel de soporte clave cercano.',
      short: 'SHORT si: rebote a EMA 21 en downtrend + vela bajista de continuación + RSI entre 40-60 + resistencia clave.',
      avoid: 'EVITAR: Cuando RSI supera 75 o cae bajo 25 (extensión extrema). Primeros 5 min de apertura NY.',
    },
  },
  '30': {
    label: '30 minutos',
    role: '🗺️ Definición de bias y zonas de oferta/demanda',
    description: 'El 30 min es el marco ideal para determinar el <strong>bias del día</strong> (alcista / bajista / rango). Las zonas de oferta y demanda en este timeframe ofrecen niveles con gran ratio de éxito para tu sistema.',
    signals: [
      { icon: '📦', text: '<strong>Zonas de demanda</strong> (para longs): áreas donde el precio dejó velas de impulso alcista sin pullback. Son zonas donde los institucionales compraron.' },
      { icon: '📦', text: '<strong>Zonas de oferta</strong> (para shorts): áreas donde el precio dejó velas de impulso bajista sin rebote. Son zonas donde los institucionales vendieron.' },
      { icon: '🔄', text: '<strong>CHoCH (Change of Character)</strong>: cuando el precio rompe la estructura contraria al trend previo. Señal de cambio de tendencia y oportunidad de alta probabilidad.' },
      { icon: '⚖️', text: 'Si el 30 min forma <strong>rango lateral</strong> (no hay BOS claro), espera a que el precio toque los extremos del rango y opera el rechazo con stop ajustado.' },
    ],
    decision: {
      long: 'LONG si: precio llega a zona de demanda de 30 min + CHoCH o BOS alcista en 5/15 min + sesión activa de NY o Londres.',
      short: 'SHORT si: precio llega a zona de oferta de 30 min + CHoCH o BOS bajista en 5/15 min + divergencia bajista en RSI.',
      avoid: 'EVITAR: Trading en medio de rango sin test de extremos. Días con noticias macro antes de las 10:00 ET.',
    },
  },
  '60': {
    label: '1 hora',
    role: '🧭 Tendencia intradiaria y niveles clave',
    description: 'El 1H define la <strong>tendencia intradiaria</strong> dominante. Es el marco de referencia principal para filtrar todos tus trades del día. Solo opera en la dirección del trend del 1H.',
    signals: [
      { icon: '📉', text: '<strong>Estructura de mercado</strong>: serie de HH/HL (higher highs / higher lows) = uptrend. Serie de LH/LL = downtrend. Opera solo en la dirección de la estructura.' },
      { icon: '📊', text: '<strong>VWAP (Volume Weighted Average Price)</strong>: precio sobre VWAP = presión compradora. Bajo VWAP = presión vendedora. Usar como filtro de sesgo.' },
      { icon: '🎯', text: '<strong>Fibonacci retracement 50%-61.8%</strong>: tras un impulso en 1H, el retroceso a esta zona es la entrada de mayor probabilidad con stop bajo el 78.6%.' },
      { icon: '🕐', text: 'Los <strong>niveles horarios en punto exacto</strong> (09:00, 10:00, 14:00, 15:00 ET) frecuentemente coinciden con reversiones o aceleraciones de precio en NASDAQ.' },
    ],
    decision: {
      long: 'LONG si: 1H en uptrend (HH/HL) + precio retrocede a 50-61.8% Fib o VWAP + señal de entrada en 15/30 min.',
      short: 'SHORT si: 1H en downtrend (LH/LL) + rebote a 50-61.8% Fib o VWAP + señal de entrada en 15/30 min.',
      avoid: 'EVITAR: Cuando el precio está en medio del rango del 1H sin estructura clara. Primeras 2 velas del día (apertura caótica).',
    },
  },
  '240': {
    label: '4 horas',
    role: '🌐 Tendencia multiday y zonas institucionales',
    description: 'El 4H muestra el <strong>contexto de varios días</strong>. Las zonas en este marco tienen el mayor peso institucional. Úsalo para seleccionar solo los días en que el sesgo es favorable.',
    signals: [
      { icon: '🏛️', text: '<strong>Order Blocks institucionales</strong>: busca la última vela bajista antes de un impulso alcista (bullish OB) o la última vela alcista antes de un impulso bajista (bearish OB). Son zonas de alta probabilidad.' },
      { icon: '📈', text: '<strong>EMA 50 y EMA 200 en 4H</strong>: si el precio está sobre ambas EMAs = macro alcista. Si está bajo ambas = macro bajista. Si está entre las dos = rango institucional.' },
      { icon: '📅', text: 'Semanas de <strong>datos macro importantes</strong> (FOMC, NFP, CPI): el 4H suele mostrar acumulación antes del evento y expansión después. Evita posiciones overnight en esas semanas.' },
      { icon: '🔢', text: '<strong>Niveles psicológicos redondos</strong> (18000, 19000, 20000, 21000 etc.): actúan como imanes y resistencias/soportes significativos en el 4H.' },
    ],
    decision: {
      long: 'LONG si: 4H sobre EMA 50 + precio retrocede a Bullish OB sin romperlo + sesión NY activa + RR ≥ 1.33.',
      short: 'SHORT si: 4H bajo EMA 50 + precio rebota a Bearish OB + divergencia en MACD 4H + volumen descendente en rebote.',
      avoid: 'EVITAR: Trading contra el Order Block del 4H. Semana de FOMC / NFP sin sesgo claro post-noticia.',
    },
  },
  'D': {
    label: '1 día',
    role: '🌎 Contexto macro y swing trading',
    description: 'El diario define la <strong>narrativa macro del NASDAQ</strong>. Úsalo para saber si estás en un mercado alcista, bajista o en consolidación, y así filtrar si operar longs, shorts o mantenerte en cash.',
    signals: [
      { icon: '📅', text: '<strong>Estructura diaria</strong>: mientras el precio hace HH/HL en diario, el sesgo de largo plazo es alcista. Prioriza longs en marcos menores.' },
      { icon: '📊', text: '<strong>EMA 20 diaria</strong>: actúa como dynamic support en uptrend. Un pullback a la EMA 20 con vela de reversión es uno de los setups con mayor winrate históricamente en NQ.' },
      { icon: '🗓️', text: '<strong>Semanas clave</strong>: primera semana del mes (NFP), cada 6 semanas (FOMC), tercera semana de cada trimestre (OpEx de opciones). En esas semanas aumenta la volatilidad y los fakeouts.' },
      { icon: '🔮', text: '<strong>Estacionalidad</strong>: Enero, Abril, Julio, Octubre suelen ser meses de expansión alcista. Septiembre-Octubre históricamente es el período de mayor volatilidad bajista.' },
    ],
    decision: {
      long: 'SWING LONG si: precio sobre EMA 20 diaria + pullback a la EMA con vela de reversión + sectores tech líderes (AAPL, MSFT, NVDA) con momentum positivo.',
      short: 'SWING SHORT si: precio bajo EMA 20 diaria + rebote a la EMA con rechazo + VIX en expansión + breadth de mercado deteriorado.',
      avoid: 'EVITAR: Apalancamiento alto en swing trades durante meses de alta estacionalidad negativa. No dejes posiciones abiertas sin stop en semanas de FOMC.',
    },
  },
};

// ─── TradingView widget loader ────────────────────────────────────────────────

let tvScriptLoaded = false;

function loadTVScript(callback) {
  if (tvScriptLoaded) { callback(); return; }
  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/tv.js';
  script.async = true;
  script.onload = () => { tvScriptLoaded = true; callback(); };
  document.head.appendChild(script);
}

function renderChart(interval) {
  const container = document.getElementById('tv-chart-container');
  container.innerHTML = '';

  const inner = document.createElement('div');
  inner.id = 'tv_nasdaq_' + Date.now();
  container.appendChild(inner);

  loadTVScript(() => {
    /* global TradingView */
    new TradingView.widget({
      width: '100%',
      height: 500,
      symbol: 'CME_MINI:NQ1!',
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
  });
}

// ─── Analysis panel renderer ─────────────────────────────────────────────────

function renderAnalysis(interval) {
  const data = TF_DATA[interval];
  if (!data) return;

  document.getElementById('tf-analysis-title').textContent = `Análisis – ${data.label}`;

  const signalsHTML = data.signals.map(s =>
    `<div class="tf-signal"><span class="tf-signal-icon">${s.icon}</span><span>${s.text}</span></div>`
  ).join('');

  document.getElementById('tf-analysis-body').innerHTML = `
    <div class="tf-role">${data.role}</div>
    <p class="tf-desc">${data.description}</p>
    <div class="tf-signals">${signalsHTML}</div>
  `;

  document.getElementById('decision-box').innerHTML = `
    <div class="dec-title">🧠 Decisión más probable – ${data.label}</div>
    <div class="dec-row long"><span class="dec-icon">🟢</span><span>${data.decision.long}</span></div>
    <div class="dec-row short"><span class="dec-icon">🔴</span><span>${data.decision.short}</span></div>
    <div class="dec-row avoid"><span class="dec-icon">⚠️</span><span>${data.decision.avoid}</span></div>
    <div class="dec-note">
      Recuerda: solo toma el trade si el R/R es ≥ 1.33 ($400 target / $300 SL) y la señal aparece
      en la dirección del marco superior.
    </div>
  `;
}

// ─── Timeframe buttons ────────────────────────────────────────────────────────

let currentInterval = '5';

document.querySelectorAll('.tf-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const interval = btn.dataset.interval;
    currentInterval = interval;
    renderChart(interval);
    renderAnalysis(interval);
  });
});

// ─── Init ────────────────────────────────────────────────────────────────────

renderChart(currentInterval);
renderAnalysis(currentInterval);
