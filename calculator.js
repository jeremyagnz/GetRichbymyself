'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────
const WEEKS_PER_MONTH = 4.33;

// ─── Instrument presets for lot-size calculation ──────────────────────────────
// slPoints : typical stop loss distance in points/pips for that instrument
// ptValue  : USD per point (pip) per 1 standard lot
const PROFILE_INSTRUMENT_PRESETS = {
  NAS100: { label: 'NAS100/US100',     slUnit: 'puntos', slPoints: 300,  ptValue: 1  },
  EURUSD: { label: 'EUR/USD',          slUnit: 'pips',   slPoints: 30,   ptValue: 10 },
  GBPUSD: { label: 'GBP/USD',          slUnit: 'pips',   slPoints: 30,   ptValue: 10 },
  XAUUSD: { label: 'XAU/USD (Oro)',    slUnit: 'pips',   slPoints: 200,  ptValue: 1  },
  BTCUSD: { label: 'BTC/USD (Bitcoin)',slUnit: 'puntos', slPoints: 1000, ptValue: 1  },
};

// Auto-fill SL/ptValue when instrument changes
document.getElementById('profileInstrument').addEventListener('change', function () {
  const preset = PROFILE_INSTRUMENT_PRESETS[this.value];
  const slUnit = document.getElementById('profileSlUnit');
  if (preset) {
    document.getElementById('profileSlPoints').value = preset.slPoints;
    document.getElementById('profilePtValue').value  = preset.ptValue;
    if (slUnit) slUnit.textContent = preset.slUnit;
  } else {
    if (slUnit) slUnit.textContent = 'puntos';
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n, decimals = 2) =>
  n.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtPct = (n, decimals = 2) => fmt(n, decimals) + '%';

const fmtMoney = (n, decimals = 2) => '$' + fmt(n, decimals);

function colorClass(value) {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}

function tag(text, cls) {
  return `<span class="tag ${cls}">${text}</span>`;
}

// ─── Core calculation engine ─────────────────────────────────────────────────

/**
 * @param {object} p  – all validated input parameters
 * @param {number} winRate  – override win rate (0-1)
 */
function calcSingle(p, winRate) {
  const wr = winRate;
  const lr = 1 - wr;

  // Trade counts
  const totalTrades = p.tradesPerDay * p.daysPerWeek * p.totalWeeks;
  const winTrades   = totalTrades * wr;
  const loseTrades  = totalTrades * lr;

  // Per-account monetary flows
  const grossProfit = winTrades  * p.target;
  const grossLoss   = loseTrades * p.stopLoss;
  const totalCosts  = p.costsPerAccount * totalTrades; // cost per trade × trades
  const netProfit   = grossProfit - grossLoss - totalCosts;

  // Metrics
  const expectancy  = (wr * p.target) - (lr * p.stopLoss);
  const rrRatio     = p.target / p.stopLoss;
  const breakEven   = p.stopLoss / (p.target + p.stopLoss);
  const roi         = netProfit / p.capitalPerAccount;

  // Periods
  const netPerWeek  = netProfit / p.totalWeeks;
  const netPerMonth = netProfit / (p.totalWeeks / WEEKS_PER_MONTH);
  const netPerQtr   = netPerMonth * 3;

  // Copy-trading totals
  const totalNetProfit   = netProfit   * p.numAccounts * p.copyFactor;
  const totalGrossProfit = grossProfit * p.numAccounts * p.copyFactor;
  const totalGrossLoss   = grossLoss   * p.numAccounts * p.copyFactor;
  const totalCostsAll    = totalCosts  * p.numAccounts;
  const totalCapital     = p.capitalPerAccount * p.numAccounts;
  const totalROI         = totalNetProfit / totalCapital;

  // Drawdown analysis
  // Max consecutive losses = how many in a row can the account absorb
  const maxConsecLosses = Math.floor(p.maxDrawdown / p.stopLoss);
  // Probability of N consecutive losses
  const probConsecLoss  = Math.pow(lr, maxConsecLosses);
  // Expected losses before drawdown hit (geometric)
  const expectedTradesBeforeRuin = maxConsecLosses > 0
    ? (1 - Math.pow(lr, maxConsecLosses)) / (1 - lr) // E[# trades until N consec losses]
    : Infinity;

  // Potential drawdown: expected worst-case losing streak in totalTrades
  // Using the formula: E[max consecutive losses] ≈ log(totalTrades * lr) / log(1/lr)
  const expectedMaxLoseStreak = lr < 1
    ? Math.ceil(Math.log(totalTrades * lr) / Math.log(1 / lr))
    : totalTrades;
  const potentialDrawdown = expectedMaxLoseStreak * p.stopLoss;

  // Risk-of-ruin (simplified)
  // Fraction bet = stopLoss / capital
  const f = p.stopLoss / p.capitalPerAccount;
  const rorNumerator = lr / wr;
  const ror = rorNumerator >= 1 ? 1 : Math.pow(rorNumerator, p.maxDrawdown / p.stopLoss);

  return {
    wr, lr, totalTrades, winTrades, loseTrades,
    grossProfit, grossLoss, totalCosts, netProfit,
    expectancy, rrRatio, breakEven, roi,
    netPerWeek, netPerMonth, netPerQtr,
    totalNetProfit, totalGrossProfit, totalGrossLoss, totalCostsAll, totalROI,
    totalCapital,
    maxConsecLosses, probConsecLoss, potentialDrawdown,
    expectedMaxLoseStreak, ror,
  };
}

// ─── Render helpers ──────────────────────────────────────────────────────────

function metricHTML(label, valueStr, cls = 'neutral') {
  return `
    <div class="metric">
      <div class="label">${label}</div>
      <div class="value ${cls}">${valueStr}</div>
    </div>`;
}

function scenarioRowHTML(label, value) {
  return `<div class="scenario-row"><span>${label}</span><span>${value}</span></div>`;
}

function scenarioCardHTML(title, cssClass, rows) {
  return `
    <div class="scenario-card ${cssClass}">
      <h3>${title}</h3>
      ${rows.map(([l, v]) => scenarioRowHTML(l, v)).join('')}
    </div>`;
}

// ─── Main render ─────────────────────────────────────────────────────────────

function renderResults(p) {
  const base    = calcSingle(p, p.winRate);
  const conserv = calcSingle(p, Math.max(0.01, p.winRate - 0.10));
  const optimist= calcSingle(p, Math.min(0.99, p.winRate + 0.10));

  // Doubled accounts scenario
  const pDouble = { ...p, numAccounts: p.numAccounts * 2 };
  const doubled = calcSingle(pDouble, p.winRate);

  const totalWeeksLabel = p.totalWeeks >= 4
    ? `${Math.round(p.totalWeeks / WEEKS_PER_MONTH)} mes(es)`
    : `${p.totalWeeks} semana(s)`;

  // ── 1. Executive Summary ──────────────────────────────────────────────────
  const profitable = base.netProfit > 0;
  const systemHealth = profitable
    ? (base.ror < 0.05 ? '✅ Sistema rentable y controlado' : '⚠️ Sistema rentable pero con riesgo elevado')
    : '❌ Sistema NO rentable en la configuración actual';

  const execHTML = `
  <div class="exec-summary">
    <p>
      <strong>${systemHealth}</strong><br>
      Con un win rate de <strong>${fmtPct(p.winRate * 100, 0)}</strong>, target de
      <strong>${fmtMoney(p.target)}</strong> y stop loss de <strong>${fmtMoney(p.stopLoss)}</strong>
      la <strong>expectativa por trade es ${fmtMoney(base.expectancy)}</strong>.
      En <strong>${totalWeeksLabel}</strong> con <strong>${p.numAccounts} cuenta(s)</strong>
      el profit neto total proyectado es
      <strong class="${profitable ? 'positive' : 'negative'}">${fmtMoney(base.totalNetProfit)}</strong>
      (ROI total: <strong>${fmtPct(base.totalROI * 100)}</strong>).
      Break-even win rate: <strong>${fmtPct(base.breakEven * 100)}</strong>.
    </p>
  </div>`;

  // ── 2. Per-account metrics ────────────────────────────────────────────────
  const perAccountHTML = `
  <div class="metrics-grid">
    ${metricHTML('Expectativa / trade', fmtMoney(base.expectancy), colorClass(base.expectancy))}
    ${metricHTML('Total trades', fmt(base.totalTrades, 0), 'neutral')}
    ${metricHTML('Trades ganadores', fmt(base.winTrades, 0), 'positive')}
    ${metricHTML('Trades perdedores', fmt(base.loseTrades, 0), 'negative')}
    ${metricHTML('Ganancia bruta / cuenta', fmtMoney(base.grossProfit), 'positive')}
    ${metricHTML('Pérdida bruta / cuenta', fmtMoney(base.grossLoss), 'negative')}
    ${metricHTML('Costos / cuenta', fmtMoney(base.totalCosts), 'warning')}
    ${metricHTML('Profit neto / cuenta', fmtMoney(base.netProfit), colorClass(base.netProfit))}
    ${metricHTML('ROI / cuenta', fmtPct(base.roi * 100), colorClass(base.netProfit))}
    ${metricHTML('Risk/Reward ratio', fmt(base.rrRatio), 'neutral')}
    ${metricHTML('Break-even WR', fmtPct(base.breakEven * 100), 'warning')}
    ${metricHTML('Ganancia semanal / cuenta', fmtMoney(base.netPerWeek), colorClass(base.netPerWeek))}
  </div>`;

  // ── 3. Consolidated metrics ───────────────────────────────────────────────
  const consolidatedHTML = `
  <div class="metrics-grid">
    ${metricHTML('Profit neto TOTAL', fmtMoney(base.totalNetProfit), colorClass(base.totalNetProfit))}
    ${metricHTML('Ganancia bruta total', fmtMoney(base.totalGrossProfit), 'positive')}
    ${metricHTML('Pérdida bruta total', fmtMoney(base.totalGrossLoss), 'negative')}
    ${metricHTML('Costos totales', fmtMoney(base.totalCostsAll), 'warning')}
    ${metricHTML('Capital total', fmtMoney(base.totalCapital), 'neutral')}
    ${metricHTML('ROI total', fmtPct(base.totalROI * 100), colorClass(base.totalNetProfit))}
    ${metricHTML('Proyección semanal', fmtMoney(base.netPerWeek * p.numAccounts * p.copyFactor), colorClass(base.netPerWeek))}
    ${metricHTML('Proyección mensual', fmtMoney(base.netPerMonth * p.numAccounts * p.copyFactor), colorClass(base.netPerMonth))}
    ${metricHTML('Proyección trimestral', fmtMoney(base.netPerQtr * p.numAccounts * p.copyFactor), colorClass(base.netPerQtr))}
    ${metricHTML(`Proyección ${totalWeeksLabel}`, fmtMoney(base.totalNetProfit), colorClass(base.totalNetProfit))}
    ${metricHTML('Factor de copiado', p.copyFactor + 'x', 'neutral')}
    ${metricHTML('Cuentas × factor', fmt(p.numAccounts * p.copyFactor, 2), 'neutral')}
  </div>`;

  // ── 4-5. Scenarios ────────────────────────────────────────────────────────
  const scenariosHTML = `
  <div class="scenarios">
    ${scenarioCardHTML('📊 Base (' + fmtPct(p.winRate * 100, 0) + ' WR)', 'base', [
      ['Profit / cuenta',   fmtMoney(base.netProfit)],
      ['Profit total',      fmtMoney(base.totalNetProfit)],
      ['ROI',               fmtPct(base.roi * 100)],
      ['Expectativa/trade', fmtMoney(base.expectancy)],
      ['Proyección mensual',fmtMoney(base.netPerMonth * p.numAccounts * p.copyFactor)],
    ])}
    ${scenarioCardHTML('🔴 Conservador (' + fmtPct(conserv.wr * 100, 0) + ' WR)', 'conserv', [
      ['Profit / cuenta',   fmtMoney(conserv.netProfit)],
      ['Profit total',      fmtMoney(conserv.totalNetProfit)],
      ['ROI',               fmtPct(conserv.roi * 100)],
      ['Expectativa/trade', fmtMoney(conserv.expectancy)],
      ['Proyección mensual',fmtMoney(conserv.netPerMonth * p.numAccounts * p.copyFactor)],
    ])}
    ${scenarioCardHTML('🟢 Optimista (' + fmtPct(optimist.wr * 100, 0) + ' WR)', 'optimist', [
      ['Profit / cuenta',   fmtMoney(optimist.netProfit)],
      ['Profit total',      fmtMoney(optimist.totalNetProfit)],
      ['ROI',               fmtPct(optimist.roi * 100)],
      ['Expectativa/trade', fmtMoney(optimist.expectancy)],
      ['Proyección mensual',fmtMoney(optimist.netPerMonth * p.numAccounts * p.copyFactor)],
    ])}
    ${scenarioCardHTML('⚡ Cuentas × 2 (' + p.numAccounts * 2 + ' cuentas)', 'base', [
      ['Profit total',      fmtMoney(doubled.totalNetProfit)],
      ['ROI total',         fmtPct(doubled.totalROI * 100)],
      ['Capital total',     fmtMoney(doubled.totalCapital)],
      ['Proyección mensual',fmtMoney(doubled.netPerMonth * pDouble.numAccounts * p.copyFactor)],
      ['Vs. escenario base', fmtMoney(doubled.totalNetProfit - base.totalNetProfit) + ' más'],
    ])}
  </div>`;

  // ── 6. Risk analysis table ────────────────────────────────────────────────
  const maxDrawdownHit = base.potentialDrawdown > p.maxDrawdown;
  const systemBroken   = !profitable || conserv.netProfit < 0;

  const riskRows = [
    ['Pérd. máx. consecutivas soportables', base.maxConsecLosses + ' trades',
      base.maxConsecLosses >= 5 ? 'ok' : base.maxConsecLosses >= 3 ? 'warn' : 'bad'],
    ['Racha perdedora esperada (peor caso)', base.expectedMaxLoseStreak + ' trades',
      base.expectedMaxLoseStreak <= base.maxConsecLosses ? 'ok' : 'bad'],
    ['Drawdown potencial / cuenta', fmtMoney(base.potentialDrawdown),
      !maxDrawdownHit ? 'ok' : 'bad'],
    ['Drawdown máx. permitido / cuenta', fmtMoney(p.maxDrawdown), 'warn'],
    ['Drawdown consolidado (total cuentas)', fmtMoney(base.potentialDrawdown * p.numAccounts * p.copyFactor),
      !maxDrawdownHit ? 'ok' : 'bad'],
    ['Riesgo de ruina (RoR)', fmtPct(base.ror * 100),
      base.ror < 0.01 ? 'ok' : base.ror < 0.10 ? 'warn' : 'bad'],
    ['Sistema rentable con fees', profitable ? 'Sí' : 'No', profitable ? 'ok' : 'bad'],
    ['Sistema rentable (escenario conserv.)', conserv.netProfit > 0 ? 'Sí' : 'No',
      conserv.netProfit > 0 ? 'ok' : 'bad'],
    ['Break-even win rate', fmtPct(base.breakEven * 100),
      p.winRate > base.breakEven * 1.05 ? 'ok' : 'warn'],
  ].map(([label, value, cls]) => `
    <tr>
      <td>${label}</td>
      <td>${value}</td>
      <td>${tag(cls === 'ok' ? '✓ OK' : cls === 'warn' ? '⚠ Atención' : '✗ Riesgo', cls)}</td>
    </tr>`).join('');

  const riskHTML = `
  <div class="card">
    <table class="risk-table">
      <thead><tr><th>Indicador</th><th>Valor</th><th>Estado</th></tr></thead>
      <tbody>${riskRows}</tbody>
    </table>
  </div>`;

  // ── 7. Scaling recommendations ────────────────────────────────────────────
  const recs = [];

  if (base.expectancy > 0) {
    recs.push({ cls: 'ok', icon: '✅', text: `La expectativa matemática es positiva (${fmtMoney(base.expectancy)}/trade). El sistema tiene ventaja estadística.` });
  } else {
    recs.push({ cls: 'danger', icon: '🚫', text: `La expectativa es negativa (${fmtMoney(base.expectancy)}/trade). No escales hasta corregir win rate, target o stop loss.` });
  }

  if (base.rrRatio >= 1.5) {
    recs.push({ cls: 'ok', icon: '📈', text: `R/R de ${fmt(base.rrRatio)} es sólido. Puedes mantener o mejorar el stop loss para aumentar la relación.` });
  } else if (base.rrRatio >= 1) {
    recs.push({ cls: 'warn', icon: '⚠️', text: `R/R de ${fmt(base.rrRatio)} es aceptable pero ajustado. Considera ampliar el target o reducir el stop loss.` });
  } else {
    recs.push({ cls: 'danger', icon: '🚫', text: `R/R menor a 1 (${fmt(base.rrRatio)}). Necesitas un win rate muy alto para ser rentable. Revisa la estructura de la operativa.` });
  }

  if (base.maxConsecLosses >= 5) {
    recs.push({ cls: 'ok', icon: '🛡️', text: `El drawdown máximo de ${fmtMoney(p.maxDrawdown)} permite absorber ${base.maxConsecLosses} pérdidas consecutivas. Margen de seguridad adecuado.` });
  } else {
    recs.push({ cls: 'warn', icon: '⚠️', text: `Solo puedes soportar ${base.maxConsecLosses} pérdidas consecutivas antes de tocar el drawdown máximo. Considera aumentar el capital o reducir el stop loss.` });
  }

  if (base.potentialDrawdown > p.maxDrawdown) {
    recs.push({ cls: 'danger', icon: '🔴', text: `La racha perdedora esperada (${base.expectedMaxLoseStreak} trades) supera tu drawdown máximo. Existe riesgo real de detención de cuenta.` });
  }

  if (conserv.netProfit < 0) {
    recs.push({ cls: 'warn', icon: '⚠️', text: `En el escenario conservador (WR -10%) el sistema pierde dinero. Asegúrate de tener estadísticas robustas antes de escalar.` });
  }

  if (p.numAccounts > 1) {
    recs.push({ cls: 'ok', icon: '🔁', text: `Con ${p.numAccounts} cuentas y factor de copiado ${p.copyFactor}x el profit total aumenta a ${fmtMoney(base.totalNetProfit)}. Escalar cuentas es el camino de menor riesgo.` });
    recs.push({ cls: 'ok', icon: '⚡', text: `Duplicar a ${p.numAccounts * 2} cuentas generaría ${fmtMoney(doubled.totalNetProfit)} de profit total (${fmtMoney(doubled.totalNetProfit - base.totalNetProfit)} adicional).` });
  }

  if (p.costsPerAccount > 0) {
    const costImpact = base.totalCostsAll / base.totalGrossProfit * 100;
    if (costImpact < 5) {
      recs.push({ cls: 'ok', icon: '💸', text: `Los fees representan solo ${fmtPct(costImpact)} de la ganancia bruta. Impacto bajo.` });
    } else if (costImpact < 15) {
      recs.push({ cls: 'warn', icon: '💸', text: `Los fees representan ${fmtPct(costImpact)} de la ganancia bruta. Negocia mejores condiciones si es posible.` });
    } else {
      recs.push({ cls: 'danger', icon: '💸', text: `Los fees representan ${fmtPct(costImpact)} de la ganancia bruta. Están erosionando seriamente el profit.` });
    }
  }

  const recsHTML = `
  <ul class="recs">
    ${recs.map(r => `<li class="${r.cls}"><span class="rec-icon">${r.icon}</span><span>${r.text}</span></li>`).join('')}
  </ul>`;

  // ── Assemble full output ──────────────────────────────────────────────────
  document.getElementById('exec-summary').innerHTML = execHTML;
  document.getElementById('per-account-metrics').innerHTML = perAccountHTML;
  document.getElementById('consolidated-metrics').innerHTML = consolidatedHTML;
  document.getElementById('scenarios-section').innerHTML = scenariosHTML;
  document.getElementById('risk-section').innerHTML = riskHTML;
  document.getElementById('recs-section').innerHTML = recsHTML;

  const resultsEl = document.getElementById('results');
  resultsEl.classList.add('visible');
  resultsEl.scrollIntoView({ behavior: 'smooth' });
}

// ─── Form submit ─────────────────────────────────────────────────────────────

document.getElementById('calcForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const g = id => parseFloat(document.getElementById(id).value) || 0;

  const timeUnit = document.getElementById('timeUnit').value;
  const timeValue = g('timeValue');
  const totalWeeks = timeUnit === 'months' ? timeValue * WEEKS_PER_MONTH : timeValue;

  const p = {
    target:             g('target'),
    stopLoss:           g('stopLoss'),
    winRate:            g('winRate') / 100,
    tradesPerDay:       g('tradesPerDay'),
    daysPerWeek:        g('daysPerWeek'),
    totalWeeks,
    capitalPerAccount:  g('capitalPerAccount'),
    maxDrawdown:        g('maxDrawdown'),
    numAccounts:        Math.max(1, Math.round(g('numAccounts'))),
    copyFactor:         g('copyFactor') || 1,
    costsPerAccount:    g('costsPerAccount'),
  };

  // Inline validation helpers
  const formErr = document.getElementById('form-error');
  function showError(msg) {
    formErr.textContent = msg;
    formErr.hidden = false;
    formErr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  formErr.hidden = true;

  if (p.target <= 0 || p.stopLoss <= 0) {
    showError('⚠️ Target y Stop Loss deben ser mayores a cero.');
    return;
  }
  if (p.winRate <= 0 || p.winRate >= 1) {
    showError('⚠️ Win rate debe estar entre 1% y 99%.');
    return;
  }
  if (p.capitalPerAccount <= 0) {
    showError('⚠️ El capital por cuenta debe ser mayor a cero.');
    return;
  }

  // Loading state
  const btn = document.getElementById('calc-btn');
  const btnText = btn.querySelector('.btn-text');
  const btnSpinner = btn.querySelector('.btn-spinner');
  btn.disabled = true;
  btnText.hidden = true;
  btnSpinner.hidden = false;

  // Defer rendering so the browser can paint the loading state first
  requestAnimationFrame(() => {
    renderResults(p);
    btn.disabled = false;
    btnText.hidden = false;
    btnSpinner.hidden = true;
    // Update system params panel in the trading guide
    updateSystemParams(p);
  });
});

// ─── Sync system params panel with calculator values ─────────────────────────

function updateSystemParams(p) {
  const rrRatio  = p.target / p.stopLoss;
  const breakEven = p.stopLoss / (p.target + p.stopLoss);

  const spTarget = document.getElementById('sp-target');
  const spSL     = document.getElementById('sp-stoploss');
  const spWR     = document.getElementById('sp-winrate');
  const spRR     = document.getElementById('sp-rr');
  const spBE     = document.getElementById('sp-be');

  if (spTarget) spTarget.textContent = fmtMoney(p.target);
  if (spSL)     spSL.textContent     = fmtMoney(p.stopLoss);
  if (spWR)     spWR.textContent     = fmtPct(p.winRate * 100, 0);
  if (spRR)     spRR.textContent     = fmt(rrRatio);
  if (spBE)     spBE.textContent     = fmtPct(breakEven * 100, 0);

  // Expose params globally so nasdaq.js can use them in the decision guide note.
  // Store rrRatio directly to avoid recalculating it in nasdaq.js.
  window.calcParams = { ...p, rrRatio };

  // Notify nasdaq.js via a custom event so it can refresh the decision guide.
  document.dispatchEvent(new CustomEvent('calcParamsUpdated'));
}

// ─── Profile / Risk Advisor ───────────────────────────────────────────────────

// Sync slider label in real-time
document.getElementById('profileRiskPct').addEventListener('input', function () {
  document.getElementById('profileRiskPctLabel').textContent = parseFloat(this.value).toFixed(1) + '%';
});

document.getElementById('profileForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const capital     = parseFloat(document.getElementById('profileCapital').value)     || 0;
  const riskPct     = parseFloat(document.getElementById('profileRiskPct').value)     || 1;
  const goalMonthly = parseFloat(document.getElementById('profileGoalMonthly').value) || 0;
  const daysPerWeek = parseInt(document.getElementById('profileDaysPerWeek').value)   || 5;
  const hoursPerDay = parseInt(document.getElementById('profileHoursPerDay').value)   || 4;
  const level       = document.getElementById('profileLevel').value;
  const riskType    = document.getElementById('profileRiskType').value;
  const instrument  = document.getElementById('profileInstrument').value;
  const slPoints    = parseFloat(document.getElementById('profileSlPoints').value) || 1;
  const ptValue     = parseFloat(document.getElementById('profilePtValue').value)  || 1;
  const instrPreset = PROFILE_INSTRUMENT_PRESETS[instrument] || null;

  const profileErr = document.getElementById('profile-error');
  profileErr.hidden = true;

  if (capital < 100) {
    profileErr.textContent = '⚠️ El capital disponible debe ser al menos $100.';
    profileErr.hidden = false;
    profileErr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  if (goalMonthly <= 0) {
    profileErr.textContent = '⚠️ El objetivo de ganancia mensual debe ser mayor a cero.';
    profileErr.hidden = false;
    profileErr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  if (daysPerWeek < 1 || daysPerWeek > 7) {
    profileErr.textContent = '⚠️ Los días por semana deben estar entre 1 y 7.';
    profileErr.hidden = false;
    return;
  }

  // Loading state
  const btn = document.getElementById('profile-btn');
  btn.querySelector('.btn-text').hidden = true;
  btn.querySelector('.btn-spinner').hidden = false;
  btn.disabled = true;

  requestAnimationFrame(() => {
    renderProfileAdvice({ capital, riskPct, goalMonthly, daysPerWeek, hoursPerDay, level, riskType,
                          instrument, slPoints, ptValue, instrPreset });
    btn.querySelector('.btn-text').hidden = false;
    btn.querySelector('.btn-spinner').hidden = true;
    btn.disabled = false;
  });
});

function renderProfileAdvice({ capital, riskPct, goalMonthly, daysPerWeek, hoursPerDay, level, riskType,
                               instrument, slPoints, ptValue, instrPreset }) {

  // ── Core calculations ──────────────────────────────────────────────────────

  // Risk per trade in $
  const riskPerTrade = capital * (riskPct / 100);

  // R/R ratio by risk profile
  const rrMap = { conservative: 1.5, moderate: 2.0, aggressive: 2.5 };
  const rrRatio = rrMap[riskType];

  // Stop loss = risk per trade; target = SL × RR
  const stopLoss = riskPerTrade;
  const target   = stopLoss * rrRatio;

  // ── Lot size calculation ───────────────────────────────────────────────────
  // lots = riskUSD / (slPoints × ptValuePerLot)
  const recommendedLots = (slPoints > 0 && ptValue > 0)
    ? riskPerTrade / (slPoints * ptValue)
    : null;

  // Round to 2 decimal places (no artificial floor — show true calculated value)
  const lotsDisplay = recommendedLots !== null
    ? Math.round(recommendedLots * 100) / 100
    : null;

  // Flag if the calculated lots fall below the typical broker minimum of 0.01
  const lotsBelowMin = lotsDisplay !== null && lotsDisplay < 0.01;

  const instrLabel = instrPreset ? instrPreset.label : 'instrumento seleccionado';
  const slUnitLabel = instrPreset ? instrPreset.slUnit : 'puntos';

  // Recommended trades per day (capped by experience level and available hours)
  const maxByLevel = { beginner: 2, intermediate: 3, advanced: 5 };
  const maxByHours = Math.max(1, Math.floor(hoursPerDay / 1.5));
  const tradesPerDay = Math.min(maxByLevel[level], maxByHours);

  // Monthly trade count (WEEKS_PER_MONTH ≈ 4.33)
  const tradesPerMonth = tradesPerDay * daysPerWeek * WEEKS_PER_MONTH;

  // Win rate needed to hit monthly goal:
  //   goal = trades × (WR × target − (1−WR) × SL)
  //   WR   = (goal/trades + SL) / (target + SL)
  const neededWR = tradesPerMonth > 0
    ? (goalMonthly / tradesPerMonth + stopLoss) / (target + stopLoss)
    : 1;

  // Break-even win rate
  const breakEven = stopLoss / (target + stopLoss);

  // Max recommended drawdown per risk profile
  const ddPctMap = { conservative: 0.08, moderate: 0.12, aggressive: 0.18 };
  const maxDrawdown = capital * ddPctMap[riskType];

  // Typical win rate for each experience level
  const typicalWRMap = { beginner: 0.50, intermediate: 0.58, advanced: 0.65 };
  const typicalWR = typicalWRMap[level];

  // Projected monthly profit at typical win rate
  const projectedMonthly = tradesPerMonth * (typicalWR * target - (1 - typicalWR) * stopLoss);

  // Return on capital (monthly)
  const monthlyROC = projectedMonthly / capital;

  // ── Viability banner ──────────────────────────────────────────────────────
  let viabilityClass, viabilityMsg;
  const goalToProjectedRatio = goalMonthly / Math.max(1, projectedMonthly);

  if (neededWR <= breakEven) {
    viabilityClass = 'ok';
    viabilityMsg   = `✅ Tu objetivo de <strong>${fmtMoney(goalMonthly)}/mes</strong> es <strong>muy conservador</strong>. Con cualquier win rate superior al break-even (${fmtPct(breakEven * 100, 0)}) lo alcanzarás.`;
  } else if (neededWR <= 0.50) {
    viabilityClass = 'ok';
    viabilityMsg   = `✅ Tu objetivo de <strong>${fmtMoney(goalMonthly)}/mes</strong> requiere un win rate de <strong>${fmtPct(neededWR * 100, 0)}</strong>. Es <strong>totalmente alcanzable</strong> con disciplina y un sistema probado.`;
  } else if (neededWR <= 0.60) {
    viabilityClass = 'ok';
    viabilityMsg   = `📊 Tu objetivo de <strong>${fmtMoney(goalMonthly)}/mes</strong> requiere un win rate de <strong>${fmtPct(neededWR * 100, 0)}</strong>. Es <strong>alcanzable</strong> para traders con sistema disciplinado. Proyección típica de tu nivel: <strong>${fmtMoney(Math.max(0, projectedMonthly))}/mes</strong>.`;
  } else if (neededWR <= 0.70) {
    viabilityClass = 'warn';
    viabilityMsg   = `⚠️ Tu objetivo de <strong>${fmtMoney(goalMonthly)}/mes</strong> requiere un win rate de <strong>${fmtPct(neededWR * 100, 0)}</strong>, que es <strong>exigente</strong>. Considera reducir el objetivo a <strong>${fmtMoney(Math.max(0, projectedMonthly))}</strong> (proyección real de tu perfil) o aumentar el capital.`;
  } else if (neededWR < 1) {
    viabilityClass = 'bad';
    viabilityMsg   = `🔴 Tu objetivo de <strong>${fmtMoney(goalMonthly)}/mes</strong> requiere un win rate de <strong>${fmtPct(neededWR * 100, 0)}</strong>, lo cual es <strong>muy difícil de sostener</strong>. Recomendamos ajustar el objetivo a <strong>${fmtMoney(Math.max(0, projectedMonthly))}</strong> o aumentar el capital disponible.`;
  } else {
    viabilityClass = 'bad';
    viabilityMsg   = `🚫 Tu objetivo de <strong>${fmtMoney(goalMonthly)}/mes</strong> es <strong>matemáticamente inalcanzable</strong> con los parámetros actuales. Reduce el objetivo o incrementa el capital.`;
  }

  // ── Parameters grid ───────────────────────────────────────────────────────
  const wrNeededDisplay = neededWR < 0
    ? '< 0% ✓'
    : neededWR > 1
      ? '> 100% ✗'
      : fmtPct(neededWR * 100, 0);

  const wrNeededClass = neededWR <= 0.55 ? 'positive' : neededWR <= 0.70 ? 'warning' : 'negative';

  const paramsHTML = `
  <div class="advice-params-grid">
    <div class="advice-param">
      <div class="advice-param-label">Riesgo por trade</div>
      <div class="advice-param-value positive">${fmtMoney(riskPerTrade)}</div>
    </div>
    <div class="advice-param">
      <div class="advice-param-label">Stop Loss</div>
      <div class="advice-param-value negative">${fmtMoney(stopLoss)}</div>
    </div>
    <div class="advice-param">
      <div class="advice-param-label">Target mínimo</div>
      <div class="advice-param-value positive">${fmtMoney(target)}</div>
    </div>
    <div class="advice-param">
      <div class="advice-param-label">R/R ratio</div>
      <div class="advice-param-value neutral">${rrRatio}:1</div>
    </div>
    <div class="advice-param">
      <div class="advice-param-label">Trades / día rec.</div>
      <div class="advice-param-value neutral">${tradesPerDay}</div>
    </div>
    <div class="advice-param">
      <div class="advice-param-label">Drawdown máx.</div>
      <div class="advice-param-value warning">${fmtMoney(maxDrawdown)}</div>
    </div>
    <div class="advice-param">
      <div class="advice-param-label">Break-even WR</div>
      <div class="advice-param-value neutral">${fmtPct(breakEven * 100, 0)}</div>
    </div>
    <div class="advice-param">
      <div class="advice-param-label">WR necesario (meta)</div>
      <div class="advice-param-value ${wrNeededClass}">${wrNeededDisplay}</div>
    </div>
    ${lotsDisplay !== null ? `
    <div class="advice-param advice-param-highlight">
      <div class="advice-param-label">📦 Lotes recomendados / trade</div>
      <div class="advice-param-value ${lotsBelowMin ? 'warning' : 'neutral'}">${fmt(lotsDisplay, 2)} lotes${lotsBelowMin ? ' ⚠️' : ''}</div>
    </div>
    <div class="advice-param advice-param-highlight">
      <div class="advice-param-label">Instrumento</div>
      <div class="advice-param-value neutral" style="font-size:.9rem">${instrLabel}</div>
    </div>` : ''}
  </div>`;

  // ── Risk management rules ────────────────────────────────────────────────
  const dailyRiskLimit = riskPerTrade * tradesPerDay;
  const levelLabel = { beginner: `principiante (${fmtPct(typicalWRMap.beginner * 100, 0)} WR)`, intermediate: `intermedio (${fmtPct(typicalWRMap.intermediate * 100, 0)} WR)`, advanced: `avanzado (${fmtPct(typicalWRMap.advanced * 100, 0)} WR)` }[level];
  const riskLabel  = { conservative: 'conservador', moderate: 'moderado', aggressive: 'agresivo' }[riskType];

  const rules = [
    { icon: '🛑', text: `Nunca arriesgues más del <strong>${riskPct}%</strong> de tu capital por operación (<strong>${fmtMoney(riskPerTrade)}</strong> máx.). Esta es tu regla número uno.` },
    { icon: '📏', text: `Usa un stop loss fijo de <strong>${fmtMoney(stopLoss)}</strong> y un target mínimo de <strong>${fmtMoney(target)}</strong>. Con R/R ${rrRatio}:1 el sistema tiene ventaja matemática desde el break-even.` },
    lotsDisplay !== null
      ? { icon: '📦', text: `Con un SL de <strong>${slPoints} ${slUnitLabel}</strong> en <strong>${instrLabel}</strong> (${fmtMoney(ptValue)}/punto/lote), el tamaño de posición recomendado es <strong>${fmt(lotsDisplay, 2)} lotes</strong> por operación (riesgo real: ${fmtMoney(lotsDisplay * slPoints * ptValue)}).${lotsBelowMin ? ' ⚠️ Este valor es menor al mínimo habitual de 0.01 lotes — considera aumentar el capital o reducir el riesgo por trade.' : ''}` }
      : { icon: '📦', text: `Calcula tu tamaño de lote con la fórmula: <strong>lotes = riesgo USD ÷ (puntos SL × valor punto/lote)</strong>. Selecciona un instrumento en el formulario para obtener el valor calculado automáticamente.` },
    { icon: '📅', text: `Limítate a <strong>${tradesPerDay} trade${tradesPerDay > 1 ? 's' : ''}/día</strong> en <strong>${daysPerWeek} días/semana</strong>. El sobretradeo es el error más costoso de los traders nuevos.` },
    { icon: '🛡️', text: `Establece una pérdida máxima diaria de <strong>${fmtMoney(dailyRiskLimit)}</strong>. Si la alcanzas, cierra la plataforma y retoma mañana.` },
    { icon: '📈', text: `Tu break-even es <strong>${fmtPct(breakEven * 100, 0)}</strong>. Mientras tu win rate supere ese número, el sistema gana dinero a largo plazo. Enfócate en consistencia, no en trades perfectos.` },
    { icon: '⏸️', text: `Después de <strong>3 pérdidas consecutivas</strong>, detente al menos 1 hora. El sesgo de recuperación emocional genera las mayores pérdidas.` },
    { icon: '📒', text: `Lleva un diario de trading. Registra cada operación: activo, motivo de entrada, resultado y estado emocional. Revísalo cada semana.` },
    { icon: '💰', text: `Con tu capital y perfil ${riskLabel}, un trader ${levelLabel} puede proyectar <strong>${fmtMoney(Math.max(0, projectedMonthly))}/mes</strong> (ROC: <strong>${fmtPct(monthlyROC * 100, 1)}</strong>).` },
  ];

  const adviceHTML = `
  <div class="profile-viability ${viabilityClass}">${viabilityMsg}</div>
  ${paramsHTML}
  <div class="advice-section-title">🔑 Reglas de gestión de riesgo para tu perfil</div>
  <ul class="advice-rules">
    ${rules.map(r => `<li><span class="rule-icon">${r.icon}</span><span>${r.text}</span></li>`).join('')}
  </ul>
  <button class="btn-use-params" id="btn-use-params">
    🚀 Usar estos parámetros en la Calculadora avanzada
  </button>`;

  // Show advice card
  const adviceCard = document.getElementById('profileAdviceCard');
  document.getElementById('profileAdviceContent').innerHTML = adviceHTML;
  adviceCard.hidden = false;
  adviceCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // ── Step-by-step plan panel ───────────────────────────────────────────────
  const steps = [
    { title: 'Configura tu cuenta', desc: `Deposita <strong>${fmtMoney(capital)}</strong> y establece tu drawdown máximo en <strong>${fmtMoney(maxDrawdown)}</strong> (${fmtPct(ddPctMap[riskType] * 100, 0)} del capital).` },
    { title: 'Define tu setup', desc: `Elige UN solo sistema de entrada y aplícalo siempre igual. Stop <strong>${fmtMoney(stopLoss)}</strong> — Target <strong>${fmtMoney(target)}</strong>.` },
    { title: 'Empieza en demo', desc: `Opera en demo durante al menos 30 días. Solo pasa a real cuando alcances consistentemente un win rate ≥ <strong>${fmtPct(breakEven * 100 + 5, 0)}</strong> durante 2 semanas seguidas.` },
    { title: 'Controla el riesgo diario', desc: `Máximo <strong>${tradesPerDay} trade${tradesPerDay > 1 ? 's' : ''}/día</strong>. Si pierdes <strong>${fmtMoney(dailyRiskLimit)}</strong> en el día, cierra la sesión.` },
    { title: 'Registra todo', desc: `Completa tu diario de trading después de cada sesión. La mejora continua viene de analizar tus propios datos.` },
    { title: 'Evalúa cada mes', desc: `Revisa tu win rate real y expectativa. Si superas consistentemente el break-even (<strong>${fmtPct(breakEven * 100, 0)}</strong>), considera escalar gradualmente.` },
    { title: 'Escala con prudencia', desc: `Solo aumenta el tamaño de posición cuando hayas demostrado rentabilidad en al menos 100 trades. Nunca subas el riesgo por encima del <strong>${riskPct}%</strong> hasta tener 6 meses de historial positivo.` },
    { title: 'Proyección a 6 meses', desc: `Con disciplina y el perfil ${riskLabel}, la proyección a 6 meses es de <strong>${fmtMoney(Math.max(0, projectedMonthly) * 6)}</strong> adicional sobre tu capital inicial.` },
  ];

  const stepsHTML = `
  <div class="profile-rules-full">
    <h3>��️ Tu hoja de ruta para ser rentable</h3>
    <div class="step-list">
      ${steps.map((s, i) => `
        <div class="step-item">
          <div class="step-num">${i + 1}</div>
          <div class="step-text"><strong>${s.title}</strong><br>${s.desc}</div>
        </div>`).join('')}
    </div>
  </div>`;

  const rulesPanel = document.getElementById('profileRulesPanel');
  rulesPanel.innerHTML = stepsHTML;
  rulesPanel.hidden = false;

  // ── Wire "use params" button (assigned after innerHTML is set) ───────────
  document.getElementById('btn-use-params').onclick = function () {
    document.getElementById('target').value            = target.toFixed(2);
    document.getElementById('stopLoss').value          = stopLoss.toFixed(2);
    document.getElementById('tradesPerDay').value      = tradesPerDay;
    document.getElementById('daysPerWeek').value       = daysPerWeek;
    document.getElementById('capitalPerAccount').value = capital.toFixed(2);
    document.getElementById('maxDrawdown').value       = maxDrawdown.toFixed(2);

    // Also populate the bot section
    const botLotEl = document.getElementById('bot-lot-size');
    const botPvEl  = document.getElementById('bot-point-value');
    if (botLotEl && lotsDisplay !== null && lotsDisplay > 0) botLotEl.value = lotsDisplay.toFixed(2);
    if (botPvEl  && ptValue > 0)                            botPvEl.value  = ptValue;

    document.getElementById('calc-section').scrollIntoView({ behavior: 'smooth' });
  };
}
