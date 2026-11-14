const TLC_VERSION = '1.1.0';
// Development builds use 'tempest-lightmap-card-dev' / '(dev)' so they can run
// beside an installed release; CI refuses a -dev tag on main.
const TLC_TAG = 'tempest-lightmap-card';
const TLC_NAME = 'Tempest LightMap Card';

// Sensors are discovered on the weather entity's device by entity_id suffix.
// The Tempest integration names its entities in fixed English, so the suffix
// is stable regardless of what the station/device is called.
const TLC_SUFFIX = {
  temp: '_air_temperature', feels: '_feels_like', dew: '_dew_point', hum: '_relative_humidity',
  wind: '_wind_speed', gust: '_wind_gust', dir: '_wind_direction', press: '_sea_level_pressure',
  trend: '_pressure_trend', uv: '_uv_index', rate: '_rain_intensity', rain: '_rain_accumulation_today',
  strikes: '_lightning_detected_last_3_hrs', heat: '_heat_index', ts: '_timestamp'
};
// Derived by the card unless the user overrides them with an entity.
const TLC_DERIVED = ['raining', 'since', 'pmin', 'pmax'];
const TLC_WIND = {
  'mph': [[2, 4, 6, 8, 10, 15, 20, 25, 30, 40, 50], 1], 'km/h': [[5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80], 0.621371],
  'm/s': [[1, 2, 3, 4, 5, 7, 10, 12, 15, 20, 25], 2.23694], 'kn': [[2, 4, 6, 8, 10, 15, 20, 25, 30, 35, 45], 1.15078],
  'ft/s': [[3, 6, 9, 12, 15, 22, 30, 37, 44, 59, 73], 0.681818]
};
// Panels in default order: [id, editor label, entity keys the panel needs, items].
// Items are [id, label, entity keys] and can be reordered or hidden only
// within their own panel.
const TLC_PANELS = [
  ['header', 'Header', [], [['dew_point', 'Dew point', ['dew']], ['rain_today', 'Rain today', ['rain']], ['lightning', 'Lightning (3h)', ['strikes']], ['sun', 'Sunrise / sunset', ['sun']]]],
  ['hourly_forecast', '12-hour forecast', [], []],
  ['daily_forecast', '10-day forecast', [], []],
  ['humidity', 'Humidity dial', ['hum'], []],
  ['wind_direction', 'Wind direction dial', ['dir'], []],
  ['scales', 'Scales', [], [['precipitation', 'Precipitation intensity', ['rate']], ['uv', 'UV index', ['uv']], ['rain_today', 'Rain today', ['rain']], ['wind', 'Wind and gust', ['wind']]]],
  ['conditions', 'Conditions row', [], [['conditions', 'Conditions', []], ['pressure', 'Pressure trend', ['trend']], ['moon', 'Moon phase', ['moon']]]],
  ['temperature_chart', 'Temperature · 24h', ['temp'], []],
  ['wind_chart', 'Wind and gust · 24h', ['wind'], []],
  ['pressure_chart', 'Pressure · 24h', ['press'], []],
  ['rain_chart', 'Daily rain · 30 days', ['rain'], []],
  ['temperature_bar', 'Temperature bar', ['temp'], []]
];
const TLC_HALF_ITEMS = ['precipitation', 'uv'];
const TLC_COND_WIDTH = { conditions: '2.2fr', pressure: '1fr', moon: '1.6fr' };
const TLC_ENTITY_LABELS = {
  temp: 'Air temperature', feels: 'Feels like', dew: 'Dew point', hum: 'Humidity', wind: 'Wind speed', gust: 'Wind gust',
  dir: 'Wind direction', press: 'Sea-level pressure', trend: 'Pressure trend', uv: 'UV index', rate: 'Rain intensity',
  rain: 'Rain today', strikes: 'Lightning (3h)', heat: 'Heat index', ts: 'Last update', moon: 'Moon phase', sun: 'Sun'
};
const TLC_MAX_MARKS = 13;

// Ordered panels/items with hidden flags, from config. Unknown ids are
// dropped; ids missing from a saved order are appended in default order.
const tlcLayout = cfg => {
  const c = cfg || {}, hp = c.hide_panels || [], hi = c.hide_items || [], io = c.items || {};
  const byId = Object.fromEntries(TLC_PANELS.map(p => [p[0], p]));
  const order = [...(c.panels || []).filter(id => byId[id]), ...TLC_PANELS.map(p => p[0]).filter(id => !(c.panels || []).includes(id))];
  return order.filter((id, i) => order.indexOf(id) === i).map(id => {
    const p = byId[id], ids = p[3].map(it => it[0]), saved = (io[id] || []).filter(x => ids.includes(x));
    const iorder = [...saved, ...ids.filter(x => !saved.includes(x))].filter((x, i, a) => a.indexOf(x) === i);
    return { id, label: p[1], needs: p[2], hidden: hp.includes(id),
      items: iorder.map(x => { const it = p[3].find(q => q[0] === x); return { id: x, label: it[1], needs: it[2], hidden: hi.includes(id + '.' + x) }; }) };
  });
};
// Evenly spaced scale marks, or null if the range is unusable.
const tlcMarks = r => {
  if (!r || [r.min, r.max, r.step].some(v => typeof v !== 'number' || isNaN(v)) || r.step <= 0 || r.max < r.min) return null;
  const out = []; for (let v = r.min; v <= r.max + r.step * 1e-6 && out.length < TLC_MAX_MARKS; v += r.step) out.push(Math.round(v * 1e6) / 1e6);
  return out.length > 1 ? out : null;
};
const tlcDec = v => { const s = String(v); return s.includes('.') ? s.split('.')[1].length : 0; };
// User scale = { min, max, bars }; any blank field uses the default.
// Returns null when nothing is set (use the built-in list).
const tlcRange = (user, def) => {
  if (!user || !['min', 'max', 'bars'].some(k => typeof user[k] === 'number')) return null;
  const min = typeof user.min === 'number' ? user.min : def.min, max = typeof user.max === 'number' ? user.max : def.max;
  const bars = Math.round(Math.min(TLC_MAX_MARKS, Math.max(2, typeof user.bars === 'number' ? user.bars : def.bars)));
  return max > min ? { min, max, bars } : null;
};
// Graduated round numbers (2, 4, 6, 8, 10, 15, 20, 25, 30, 40, 50 …): a ladder that
// steps by 2 below 10, 5 to 30, 10 to 100, 25 to 300 and 50 above, scaled to the
// range's size (0.02, 0.04 … 0.1, 0.15 … for small rain totals), sampled with
// gently growing gaps. Uses the coarsest ladder with enough values; always keeps min and max.
const tlcGraduated = r => {
  const build = f => {
    const at = v => (v < 10 * f ? 2 : v < 30 * f ? 5 : v < 100 * f ? 10 : v < 300 * f ? 25 : 50) * f, L = [];
    for (let v = 0; v <= r.max + 1e-9; v = +(v + at(v)).toFixed(6)) if (v >= r.min - 1e-9) L.push(v);
    if (L[0] !== r.min) L.unshift(r.min);
    if (L[L.length - 1] !== r.max) L.push(r.max);
    return L;
  };
  let e = Math.floor(Math.log10(r.max * 0.999)) - 1, L = build(Math.pow(10, e));
  for (let n = 0; n < 2 && L.length < r.bars; n++) L = build(Math.pow(10, --e));
  if (L.length <= r.bars) return L;
  const out = [L[0]]; let j = 0;
  for (let i = 1; i < r.bars - 1; i++) {
    const target = r.min + (r.max - r.min) * Math.pow(i / (r.bars - 1), 1.2);
    let best = -1;
    for (let k = j + 1; k < L.length - (r.bars - 1 - i); k++) if (best < 0 || Math.abs(L[k] - target) < Math.abs(L[best] - target)) best = k;
    out.push(L[best]); j = best;
  }
  out.push(L[L.length - 1]);
  return out;
};

const TLC_PRESS_DEC = { inHg: 2, hPa: 0, mbar: 0, kPa: 1, cbar: 1, mmHg: 0, psi: 2, Pa: 0 };
const tlcEsc = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const tlcFindWeather = hass => {
  const hit = Object.values((hass && hass.entities) || {}).find(r => r.platform === 'tempest' && r.entity_id.startsWith('weather.') && hass.states[r.entity_id]);
  return hit ? hit.entity_id : null;
};
const TLC_COND = {
  'sunny': ['mdi:weather-sunny', 'Sunny', '#EF9F27'], 'clear-night': ['mdi:weather-night', 'Clear', '#7F77DD'],
  'partlycloudy': ['mdi:weather-partly-cloudy', 'Partly cloudy', '#9A9890'], 'cloudy': ['mdi:weather-cloudy', 'Cloudy', '#9A9890'],
  'fog': ['mdi:weather-fog', 'Fog', '#9A9890'], 'rainy': ['mdi:weather-rainy', 'Rain', '#378ADD'],
  'pouring': ['mdi:weather-pouring', 'Heavy rain', '#378ADD'], 'lightning': ['mdi:weather-lightning', 'Lightning', '#E24B4A'],
  'lightning-rainy': ['mdi:weather-lightning-rainy', 'Thunderstorms', '#E24B4A'], 'snowy': ['mdi:weather-snowy', 'Snow', '#85B7EB'],
  'snowy-rainy': ['mdi:weather-snowy-rainy', 'Sleet', '#85B7EB'], 'hail': ['mdi:weather-hail', 'Hail', '#85B7EB'],
  'windy': ['mdi:weather-windy', 'Windy', '#9A9890'], 'windy-variant': ['mdi:weather-windy-variant', 'Windy', '#9A9890'],
  'exceptional': ['mdi:alert-circle-outline', 'Exceptional', '#E24B4A']
};
const TLC_MOON = [['new_moon', 'mdi:moon-new', 'new'], ['waxing_crescent', 'mdi:moon-waxing-crescent', ''], ['first_quarter', 'mdi:moon-first-quarter', 'quarter'], ['waxing_gibbous', 'mdi:moon-waxing-gibbous', ''], ['full_moon', 'mdi:moon-full', 'full'], ['waning_gibbous', 'mdi:moon-waning-gibbous', ''], ['last_quarter', 'mdi:moon-last-quarter', 'quarter'], ['waning_crescent', 'mdi:moon-waning-crescent', '']];

const TLC_CSS = `
:host{display:block;--off:color-mix(in srgb,var(--primary-text-color) 11%,transparent);--plum:#4B2A5E;--wm:#5B3570;--card:var(--ha-card-background,var(--card-background-color,#fff));--fg:var(--primary-text-color);--fg2:var(--secondary-text-color);--line:var(--divider-color,rgba(0,0,0,.12))}
:host([dark]){--wm:#CDB0E0}
.w{container-type:inline-size}
.g{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-flow:row dense;gap:12px;padding:12px;max-width:1500px;margin:0 auto;box-sizing:border-box}
.p{background:var(--card);border:1px solid var(--line);border-radius:var(--ha-card-border-radius,16px);padding:14px 16px;min-width:0;box-sizing:border-box}
.s12{grid-column:span 12}.s8{grid-column:span 8}.s6{grid-column:span 6}.s4{grid-column:span 4}.s3{grid-column:span 3}
@container (max-width:1100px){.s8,.s4,.t12{grid-column:span 12}.s3{grid-column:span 6}}
@container (max-width:640px){.s6,.s3{grid-column:span 12}.g{padding:8px;gap:8px}}
.h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:0 0 10px;font-size:13px;color:var(--fg2)}
.h b{font-weight:500;color:var(--fg)}
.h.c{justify-content:center;gap:10px}.h.l{justify-content:flex-start;gap:10px}.h.r{justify-content:flex-end;gap:10px}
.lbl{font-size:12px;color:var(--fg2)}
.led{height:9px;border-radius:5px;background:var(--off)}
.sc{display:grid;gap:5px;text-align:center;font-size:11px;color:var(--fg2)}
.sc .on{color:var(--fg)}
.sc span{display:block;margin-top:4px;white-space:nowrap}
.hdr{display:grid;grid-template-columns:28px auto 1fr auto;gap:20px;align-items:center;padding:0;overflow:hidden}
.tab{background:var(--plum);align-self:stretch;display:flex;align-items:center;justify-content:center;min-height:130px}
.tab span{writing-mode:vertical-rl;transform:rotate(180deg);color:#fff;font-size:11px;letter-spacing:.05em;padding:10px 0;white-space:nowrap}
.brand{padding:16px 0}
.wm{font-size:40px;font-weight:600;color:var(--wm);letter-spacing:-.02em;line-height:1}
.wm sup{font-size:20px;margin-left:1px}
.bar{height:5px;width:120px;background:#378ADD;border-radius:3px;margin:9px 0}
.live{font-size:12px;color:var(--fg2);display:flex;align-items:center;gap:6px}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex:none}
.now{display:flex;align-items:center;gap:16px;justify-content:center}
.now ha-icon{--mdc-icon-size:68px}
.big{font-size:54px;font-weight:300;line-height:1;color:var(--fg);font-variant-numeric:tabular-nums}
.big u{text-decoration:none;font-size:20px;color:var(--fg2);vertical-align:top;margin-left:2px}
.qs{display:grid;grid-template-columns:repeat(2,minmax(90px,auto));gap:10px 22px;padding:16px 22px 16px 0}
.qv{font-size:18px;font-weight:500;color:var(--fg);margin-top:2px;white-space:nowrap}
@container (max-width:900px){.hdr{grid-template-columns:28px 1fr;gap:12px 16px}.tab{grid-row:1/span 3}.now{justify-content:flex-start}.qs{grid-template-columns:repeat(4,minmax(0,1fr));padding:0 16px 16px 0}.brand{padding-bottom:0}}
@container (max-width:520px){.qs{grid-template-columns:repeat(2,minmax(0,1fr))}.big{font-size:44px}.now ha-icon{--mdc-icon-size:52px}.wm{font-size:32px}}
.leg{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;color:var(--fg2);margin-top:6px}
.leg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;vertical-align:0}
.d10{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:2px;text-align:center;font-size:11px;color:var(--fg2)}
.d10 ha-icon{--mdc-icon-size:20px;display:block;margin:5px auto}
.d10 .hi{font-size:13px;color:var(--fg)}
.rng{margin:5px auto;width:6px;height:54px;border-radius:3px;background:var(--off);position:relative}
.rng div{position:absolute;left:0;right:0;border-radius:3px;background:#D85A30}
.dial{display:flex;flex-direction:column;align-items:center}
.dial svg{width:100%;max-width:190px}
.scs{display:grid;grid-template-columns:1fr 1fr;gap:16px 20px;align-content:start}
.scs .full{grid-column:1/-1}
.st{display:grid;grid-template-columns:2.2fr 1fr 1.6fr;gap:28px}
@container (max-width:900px){.st{grid-template-columns:1fr!important}}
@container (max-width:520px){.scs{grid-template-columns:1fr}}
.cond{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));text-align:center}
.cond ha-icon{--mdc-icon-size:26px}
.cond div{font-size:10px;color:var(--fg2);margin-top:2px}
.pt{display:flex;justify-content:center;gap:18px;text-align:center;font-size:11px;color:var(--fg2)}
.pt ha-icon{--mdc-icon-size:26px;display:block;margin:0 auto 2px}
.moon{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));text-align:center;font-size:10px;color:var(--fg2)}
.moon ha-icon{--mdc-icon-size:24px;display:block;margin:0 auto 3px}
svg{display:block}
svg text{font-family:inherit}
.ft{background:var(--plum);border-radius:var(--ha-card-border-radius,16px);color:#fff;padding:0 20px 16px;overflow:hidden}
.dots{height:14px;margin:0 -20px 14px;background:radial-gradient(circle,rgba(255,255,255,.22) 3px,transparent 3.6px) 4px 2px/18px 14px repeat-x}
.trow{display:grid;gap:6px;text-align:center;font-size:14px}
.orow{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:6px;text-align:center;font-size:14px;margin:0 4.5%}
.fl{height:10px;border-radius:5px;background:rgba(255,255,255,.2);margin:7px 0}
.fl.on{background:#FAC775}.fl.cur{outline:2px solid #fff;outline-offset:2px}
.fcap{text-align:center;font-size:12px;opacity:.8;margin:6px 0}
.nd{font-size:12px;color:var(--fg2);padding:24px 0;text-align:center}
[data-mi]{cursor:pointer;border-radius:8px;transition:background-color .15s}
[data-mi]:hover{background-color:color-mix(in srgb,var(--primary-text-color) 5%,transparent)}
.ft [data-mi]:hover,.ft[data-mi]:hover{background-color:rgba(255,255,255,.06)}
`;

class TempestLightmapCard extends HTMLElement {
  setConfig(c) {
    this._cfg = Object.assign({}, c || {});
    this._title = this._cfg.title || 'Weather station';
    if (!this._fc) { this._fc = { hourly: [], daily: [] }; this._h = {}; this._rain = []; }
    this._dirty = true;
    // Keep forecasts/history across edits; _resolve only resets them when the
    // entities the card uses actually change.
    if (this._hass && this.shadowRoot) { this._resolve(); if (this.isConnected) this._start(); this._schedule(); }
  }
  static getStubConfig(hass) { const w = tlcFindWeather(hass); return w ? { weather: w } : {}; }
  static async getConfigElement() { await tlcLoadEditorDeps(); return document.createElement(TLC_TAG + '-editor'); }
  getGridOptions() { return { columns: 'full', min_columns: 12 }; }

  // Works out which entity feeds each part of the card. Runs on first hass and
  // whenever the entity registry changes; restarts data loading if the
  // resolved entities changed.
  _resolve() {
    const h = this._hass, c = this._cfg, ov = c.entities || {}, reg = h.entities || {};
    const weather = c.weather || ov.weather || tlcFindWeather(h);
    const e = { weather: weather || null, sun: ov.sun || 'sun.sun' };
    const dev = weather && reg[weather] ? reg[weather].device_id : null;
    const onDev = dev ? Object.values(reg).filter(r => r.device_id === dev && r.entity_id.startsWith('sensor.')).map(r => r.entity_id) : [];
    const base = weather ? 'sensor.' + weather.split('.')[1] : null;
    Object.entries(TLC_SUFFIX).forEach(([k, suf]) => {
      e[k] = ov[k] || onDev.find(id => id.endsWith(suf)) || (base && h.states[base + suf] ? base + suf : null);
    });
    const moonReg = Object.values(reg).find(r => r.platform === 'moon' && r.entity_id.startsWith('sensor.'));
    e.moon = ov.moon || (moonReg ? moonReg.entity_id : (h.states['sensor.moon_phase'] ? 'sensor.moon_phase' : null));
    TLC_DERIVED.forEach(k => { e[k] = ov[k] || null; });
    (c.exclude || []).forEach(k => { if (k !== 'weather' && k in e) e[k] = null; });
    this._regRef = h.entities;
    // Only drop loaded data the change actually affects: forecasts depend on
    // the weather entity, history/statistics on the charted sensors.
    const old = this._e || {}, chg = ks => ks.some(k => old[k] !== e[k]);
    if (JSON.stringify(e) !== JSON.stringify(this._e)) {
      if (chg(['weather'])) { this._stop(); this._fc = { hourly: [], daily: [] }; }
      if (chg(['temp', 'dew', 'wind', 'gust', 'press', 'rain'])) {
        this._h = {}; this._rain = []; this._rainStart = null;
        clearInterval(this._hi); this._hi = null;       // _start() refetches for the new sensors
      }
      this._e = e; this._dirty = true;
    }
  }
  getCardSize() { return 24; }
  set hass(h) {
    this._hass = h;
    if (h.themes && typeof h.themes.darkMode === 'boolean') this.toggleAttribute('dark', h.themes.darkMode);
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${TLC_CSS}</style><div class="w"><div class="g" id="g"></div></div>`;
      // Tapping anything tagged with an entity opens HA's more-info dialog for
      // it; the innermost tagged element wins (e.g. gust inside the wind scale).
      this.shadowRoot.addEventListener('click', ev => {
        const el = ev.composedPath().find(n => n.dataset && n.dataset.mi);
        if (el) this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: el.dataset.mi }, bubbles: true, composed: true }));
      });
    }
    if (!this._e || h.entities !== this._regRef) this._resolve();
    if (this.isConnected) this._start();
    const sig = Object.values(this._e).map(id => { const s = h.states[id]; return s ? s.last_updated : ''; }).join('|');
    if (sig !== this._sig) { this._sig = sig; this._dirty = true; }
    this._schedule();
  }
  connectedCallback() { if (this._hass) { this._start(); this._dirty = true; this._schedule(); } }
  disconnectedCallback() { this._stop(); }
  _stop() {
    (this._unsubs || []).forEach(u => { try { u(); } catch (e) {} });
    this._unsubs = null; clearInterval(this._hi); clearInterval(this._ti); this._hi = this._ti = null;
  }
  _start() {
    if (!this._e || !this._e.weather) return;
    if (!this._unsubs) {
      this._unsubs = [];
      ['hourly', 'daily'].forEach(t => {
        this._hass.connection.subscribeMessage(m => { this._fc[t] = (m && m.forecast) || []; this._dirty = true; this._schedule(); },
          { type: 'weather/subscribe_forecast', entity_id: this._e.weather, forecast_type: t })
          .then(u => { if (this._unsubs) this._unsubs.push(u); else u(); }).catch(() => {});
      });
    }
    if (!this._hi) { this._fetch(); this._hi = setInterval(() => this._fetch(), 300000); }
    if (!this._ti) this._ti = setInterval(() => { this._dirty = true; this._schedule(); }, 60000);
  }
  async _fetch() {
    const h = this._hass, e = this._e, end = new Date(), start = new Date(end.getTime() - 864e5);
    const ids = [e.temp, e.dew, e.wind, e.gust, e.press].filter(Boolean);
    try {
      const r = await h.callWS({ type: 'history/history_during_period', start_time: start.toISOString(), end_time: end.toISOString(), entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false });
      const out = {};
      ids.forEach(id => { out[id] = (r[id] || []).map(x => [(x.lu != null ? x.lu : x.lc) * 1000, parseFloat(x.s)]).filter(p => !isNaN(p[1]) && !isNaN(p[0])); });
      this._h = out;
    } catch (err) { this._h = {}; }
    if (e.rain) try {
      const s0 = new Date(end); s0.setHours(0, 0, 0, 0); s0.setDate(s0.getDate() - 29);
      const r2 = await h.callWS({ type: 'recorder/statistics_during_period', start_time: s0.toISOString(), end_time: end.toISOString(), statistic_ids: [e.rain], period: 'day', types: ['max'] });
      this._rain = (r2[e.rain] || []).map(x => [typeof x.start === 'number' ? x.start : Date.parse(x.start), this._toRain(x.max || 0, this._u('rain'))]);
      this._rainStart = s0.getTime();
    } catch (err) { this._rain = []; }
    this._dirty = true; this._schedule();
  }
  _schedule() {
    if (this._t || !this._dirty) return;
    this._t = setTimeout(() => { this._t = null; if (this._dirty) { this._dirty = false; this._render(); } }, 400);
  }
  _st(k) { const id = this._e && this._e[k]; return id ? this._hass.states[id] : undefined; }
  _s(k) { const s = this._st(k); return s ? s.state : ''; }
  _u(k) { const s = this._st(k); return (s && s.attributes.unit_of_measurement) || ''; }
  _tu() { return this._u('temp') || (this._st('weather') && this._st('weather').attributes.temperature_unit) || '°F'; }
  _isF() { return this._tu().includes('F'); }
  _pu() { return this._u('press') || 'inHg'; }
  _pd() { const d = TLC_PRESS_DEC[this._pu()]; return d == null ? 1 : d; }
  _wu() { return TLC_WIND[this._u('wind')] ? this._u('wind') : 'mph'; }
  // Rain sensors carry no device class, so HA never converts them; follow the
  // HA unit system instead (inches for imperial, millimetres otherwise).
  _rainIn() { const us = this._hass.config && this._hass.config.unit_system; return us && us.length ? us.length === 'mi' : this._isF(); }
  _ru() { return this._rainIn() ? 'in' : 'mm'; }
  _toRain(v, unit) { if (v == null) return null; const src = /in/.test(unit || 'mm') ? 'in' : 'mm', dst = this._ru(); return src === dst ? v : dst === 'in' ? v / 25.4 : v * 25.4; }
  _rainNow(k) { return this._toRain(this._n(k), this._u(k)); }
  _rd() { return this._rainIn() ? 2 : 1; }
  _isRaining() { return this._e.raining ? this._s('raining') === 'on' : (this._n('rate') || 0) > 0; }
  _sinceRain() {
    if (this._e.since) return this._s('since') || '—';
    if (!this._rainStart) return '—';
    if ((this._rainNow('rain') || 0) > 0) return '0';
    let last = -1; this._rain.forEach(([t, x]) => { const i = Math.round((t - this._rainStart) / 864e5); if (x > 0 && i > last && i < 30) last = i; });
    return last < 0 ? '30+' : String(29 - last);
  }
  _pRange() {
    if (this._e.pmin || this._e.pmax) return [this._f('pmin', this._pd()), this._f('pmax', this._pd())];
    const v = (this._h[this._e.press] || []).map(p => p[1]);
    return v.length ? [Math.min(...v).toFixed(this._pd()), Math.max(...v).toFixed(this._pd())] : ['—', '—'];
  }
  _n(k) { const x = parseFloat(this._s(k)); return isNaN(x) ? null : x; }
  // Attribute that makes an element open the more-info dialog for entity key k.
  _mi(k) { const id = this._e && this._e[k]; return id ? ` data-mi="${tlcEsc(id)}"` : ''; }
  _f(k, d = 0) { const x = this._n(k); return x == null ? '—' : x.toFixed(d); }

  _render() {
    const g = this.shadowRoot.getElementById('g');
    if (!this._e || !this._e.weather || !this._st('weather')) {
      g.innerHTML = `<div class="p s12 nd">No Tempest weather entity found. Install the Tempest integration, or set <code>weather:</code> in the card config.</div>`;
      return;
    }
    const has = keys => keys.every(k => this._e[k] && this._st(k));
    const R = {
      header: it => this._header(it), hourly_forecast: () => this._next12(), daily_forecast: () => this._days(),
      humidity: () => this._hum(), wind_direction: () => this._windDir(), scales: it => this._scales(it),
      conditions: it => this._status(it), temperature_chart: () => this._tempChart(), wind_chart: () => this._windChart(),
      pressure_chart: () => this._pressChart(), rain_chart: () => this._rainChart(), temperature_bar: () => this._footer()
    };
    try {
      g.innerHTML = tlcLayout(this._cfg).filter(p => !p.hidden && has(p.needs)).map(p => {
        const items = p.items.filter(i => !i.hidden && has(i.needs)).map(i => i.id);
        return p.items.length && !items.length ? '' : R[p.id](items);
      }).join('');
    }
    catch (err) { g.innerHTML = `<div class="p s12 nd">Tempest card error: ${tlcEsc(err.message)}</div>`; }
  }

  _time(d, opt) { return d.toLocaleTimeString([], opt || { hour: 'numeric', minute: '2-digit' }); }
  _hr(d) { return d.toLocaleTimeString([], { hour: 'numeric' }).replace(/\s/g, '').toLowerCase(); }

  _header(items) {
    const w = this._s('weather'), c = TLC_COND[w] || ['mdi:weather-partly-cloudy', tlcEsc(w) || '—', '#9A9890'];
    const t = this._n('temp'), tu = tlcEsc(this._tu());
    const ts = Date.parse(this._s('ts')), m = isNaN(ts) ? null : Math.max(0, Math.round((Date.now() - ts) / 60000));
    const ok = m != null && m < 10;
    const sun = this._hass.states[this._e.sun], up = sun && sun.state === 'above_horizon';
    const sunT = sun ? this._time(new Date(up ? sun.attributes.next_setting : sun.attributes.next_rising)) : '—';
    const rain = this._rainNow('rain'), lt = parseInt(this._s('strikes')) || 0;
    const q = (k, l, v, col) => `<div${this._mi(k)}><div class="lbl">${l}</div><div class="qv"${col ? ` style="color:${col}"` : ''}>${v}</div></div>`;
    const Q = {
      dew_point: () => q('dew', 'Dew point', this._f('dew') + '°'),
      rain_today: () => q('rain', 'Rain today', rain == null ? '—' : rain.toFixed(this._rd()) + ' ' + this._ru(), rain ? '#378ADD' : ''),
      lightning: () => q('strikes', 'Lightning 3h', lt + ' strikes', lt ? '#E5A800' : ''),
      sun: () => q('sun', up ? 'Sunset' : 'Sunrise', sunT, '#D85A30')
    };
    const feels = this._e.feels ? `<span${this._mi('feels')}> · feels like ${this._f('feels')}°</span>` : '';
    return `<div class="p s12 hdr"><div class="tab"><span>${tlcEsc(this._title)}</span></div>
<div class="brand"><div class="wm">Tempest<sup>°</sup></div><div class="bar"></div><div class="live"${this._mi('ts')}><span class="dot" style="background:${ok ? '#639922' : '#EF9F27'}"></span>${ok ? 'Live' : 'Stale'} · ${m == null ? 'no update' : m < 1 ? 'updated just now' : 'updated ' + m + ' min ago'}</div></div>
<div class="now"><ha-icon icon="${c[0]}" style="color:${c[2]}"${this._mi('weather')}></ha-icon><div><div class="big"${this._mi('temp')}>${t == null ? '—' : t.toFixed(1)}<u>${tu}</u></div><div class="lbl" style="margin-top:6px"><span${this._mi('weather')}>${c[1]}</span>${feels}</div></div></div>
${items.length ? `<div class="qs">${items.map(i => Q[i]()).join('')}</div>` : '<div></div>'}</div>`;
  }

  _next12() {
    const now = Date.now() - 3600e3;
    const H = (this._fc.hourly || []).filter(f => Date.parse(f.datetime) >= now).slice(0, 12);
    let body;
    if (!H.length) body = `<div class="nd">Waiting for forecast…</div>`;
    else {
      const W = 720, n = H.length, x = i => 26 + i * (W - 52) / Math.max(1, n - 1);
      const ts = H.map(f => f.temperature), lo = Math.min(...ts), hi = Math.max(...ts), rg = Math.max(4, hi - lo);
      const y = v => 50 + (hi - v) / rg * 44;
      let s = '';
      H.forEach((f, i) => { const c = TLC_COND[f.condition] || TLC_COND.cloudy; s += `<circle cx="${x(i)}" cy="13" r="7" fill="${c[2]}"/>`; });
      const pts = H.map((f, i) => `${x(i).toFixed(1)},${y(f.temperature).toFixed(1)}`).join(' ');
      s += `<polygon points="${x(0)},100 ${pts} ${x(n - 1)},100" fill="#D85A30" opacity=".1"/><polyline points="${pts}" fill="none" stroke="#D85A30" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      const maxP = Math.max(...H.map(f => f.precipitation_probability || 0));
      const lblY = maxP ? 156 : 120, vbH = maxP ? 162 : 126;
      H.forEach((f, i) => {
        const p = f.precipitation_probability || 0, bh = Math.max(3, p / 100 * 24);
        s += `<circle cx="${x(i)}" cy="${y(f.temperature)}" r="3.5" fill="#D85A30"/><text x="${x(i)}" y="${y(f.temperature) - 9}" text-anchor="middle" style="font-size:12px;fill:var(--primary-text-color)">${Math.round(f.temperature)}°</text>`;
        if (maxP) {
          s += `<rect x="${x(i) - 11}" y="${136 - bh}" width="22" height="${bh}" rx="3" fill="${p ? '#378ADD' : 'var(--off)'}"/>`;
          if (p) s += `<text x="${x(i)}" y="${136 - bh - 4}" text-anchor="middle" style="font-size:10px;fill:#378ADD">${p}%</text>`;
        }
        s += `<text x="${x(i)}" y="${lblY}" text-anchor="middle" style="font-size:11px;fill:var(--secondary-text-color)">${i === 0 ? 'now' : this._hr(new Date(f.datetime))}</text>`;
      });
      body = `<svg viewBox="0 0 ${W} ${vbH}" width="100%">${s}</svg><div class="leg"><span><i style="background:#EF9F27"></i>sun</span><span><i style="background:#7F77DD"></i>clear night</span><span><i style="background:#9A9890"></i>cloud</span><span><i style="background:#378ADD"></i>rain</span><span><i style="background:#E24B4A"></i>storm</span><span>${maxP ? 'bars = rain chance' : 'no rain expected'}</span></div>`;
    }
    return `<div class="p s8"${this._mi('weather')}><div class="h"><b>Next 12 hours</b><span>forecast</span></div>${body}</div>`;
  }

  _days() {
    const D = (this._fc.daily || []).slice(0, 10);
    let body;
    if (!D.length) body = `<div class="nd">Waiting for forecast…</div>`;
    else {
      const lo = Math.min(...D.map(d => d.templow != null ? d.templow : d.temperature)), hi = Math.max(...D.map(d => d.temperature)), rg = Math.max(1, hi - lo);
      const today = new Date().toDateString();
      body = `<div class="d10">${D.map(d => {
        const dt = new Date(d.datetime), c = TLC_COND[d.condition] || TLC_COND.cloudy, l = d.templow != null ? d.templow : d.temperature, p = d.precipitation_probability || 0;
        return `<div>${dt.toDateString() === today ? 'Today' : dt.toLocaleDateString([], { weekday: 'short' })}<ha-icon icon="${c[0]}" style="color:${c[2]}"></ha-icon><div class="hi">${Math.round(d.temperature)}°</div><div class="rng"><div style="top:${(hi - d.temperature) / rg * 54}px;bottom:${(l - lo) / rg * 54}px"></div></div><div>${Math.round(l)}°</div><div style="color:${p ? '#378ADD' : 'var(--secondary-text-color)'};margin-top:3px">${p}%</div></div>`;
      }).join('')}</div>`;
    }
    return `<div class="p s4"${this._mi('weather')}><div class="h"><b>10-day forecast</b><span>high · low · rain</span></div>${body}</div>`;
  }

  _hum() {
    const v = this._n('hum'); let s = '';
    for (let i = 0; i <= 10; i++) {
      const a = (225 - i * 27) * Math.PI / 180, lit = v != null && i * 10 <= v + 0.01;
      s += `<line x1="${80 + 42 * Math.cos(a)}" y1="${80 - 42 * Math.sin(a)}" x2="${80 + 54 * Math.cos(a)}" y2="${80 - 54 * Math.sin(a)}" stroke="${lit ? '#D4537E' : 'var(--off)'}" stroke-width="9" stroke-linecap="round"/>`;
      s += `<text x="${80 + 69 * Math.cos(a)}" y="${84 - 69 * Math.sin(a)}" text-anchor="middle" style="font-size:10px;fill:var(--secondary-text-color)">${i * 10}</text>`;
    }
    s += `<text x="80" y="88" text-anchor="middle" style="font-size:28px;font-weight:500;fill:var(--primary-text-color)">${v == null ? '—' : Math.round(v)}<tspan style="font-size:14px;fill:var(--secondary-text-color)">%</tspan></text>`;
    return `<div class="p s3"${this._mi('hum')}><div class="h"><b>Humidity</b><span${this._mi('dew')}>dew point ${this._f('dew')}°</span></div><div class="dial"><svg viewBox="0 0 160 150">${s}</svg></div></div>`;
  }

  _windDir() {
    const d = this._n('dir'), names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const prim = d == null ? -1 : Math.round(d / 45) % 8;
    const diff = d == null ? 0 : ((d - prim * 45) + 540) % 360 - 180;
    const sec = d == null || Math.abs(diff) < 11.25 ? -1 : (prim + (diff > 0 ? 1 : 7)) % 8;
    let s = '';
    names.forEach((n, i) => {
      const a = (90 - i * 45) * Math.PI / 180, col = i === prim ? '#EF9F27' : i === sec ? '#FAC775' : 'var(--off)';
      s += `<line x1="${80 + 18 * Math.cos(a)}" y1="${80 - 18 * Math.sin(a)}" x2="${80 + 48 * Math.cos(a)}" y2="${80 - 48 * Math.sin(a)}" stroke="${col}" stroke-width="9" stroke-linecap="round"/>`;
      if (i % 2 === 0) s += `<text x="${80 + 64 * Math.cos(a)}" y="${85 - 64 * Math.sin(a)}" text-anchor="middle" style="font-size:13px;font-weight:500;fill:var(--secondary-text-color)">${n}</text>`;
    });
    s += `<circle cx="80" cy="80" r="5" fill="var(--off)"/>`;
    const card = d == null ? '—' : ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(d / 22.5) % 16];
    return `<div class="p s3"${this._mi('dir')}><div class="h"><b>Wind direction</b><span>from ${card}${d == null ? '' : ' · ' + Math.round(d) + '°'}</span></div><div class="dial"><svg viewBox="0 0 160 160">${s}</svg></div></div>`;
  }

  _scale(labels, litFn, extra) {
    return `<div class="sc" style="grid-template-columns:repeat(${labels.length},minmax(0,1fr))">${labels.map((l, i) => { const c = litFn(i); return `<div class="${c ? 'on' : ''}"><div class="led" style="${c ? 'background:' + c : ''}"></div><span>${l}</span></div>`; }).join('')}</div>`;
  }

  _scales(items) {
    const ri = this._rainIn(), ru = this._ru(), rd = this._rd(), c = this._cfg;
    const out = {};
    out.precipitation = () => {
      const rate = this._rainNow('rate') || 0, th = c.rain_intensity || {};
      const rl = [th.moderate != null ? th.moderate : ri ? 0.1 : 2.5, th.heavy != null ? th.heavy : ri ? 0.3 : 7.6];
      const lvl = rate <= 0 ? 0 : rate < rl[0] ? 1 : rate < rl[1] ? 2 : 3;
      const pi = this._scale(['none', 'light', 'moderate', 'heavy'], i => lvl === 0 ? (i === 0 ? '#9A9890' : '') : (i > 0 && i <= lvl ? ['', '#85B7EB', '#378ADD', '#185FA5'][i] : ''));
      return `<div class="h"><b>Precipitation intensity</b><span>${rate.toFixed(rd)} ${ru}/hr</span></div>${pi}`;
    };
    out.uv = () => {
      const uv = this._n('uv') || 0, ul = uv < 3 ? 0 : uv < 6 ? 1 : uv < 8 ? 2 : uv < 11 ? 3 : 4, uc = ['#639922', '#E5C100', '#EF9F27', '#E24B4A', '#9B59B6'];
      return `<div class="h"><b>UV index</b><span>${uv.toFixed(1)}</span></div>${this._scale(['low', 'moderate', 'high', 'very high', 'extreme'], i => i <= ul ? uc[i] : '')}`;
    };
    out.rain_today = () => {
      const rs = tlcRange(c.rain_scale, ri ? { min: 0.2, max: 3, bars: 10 } : { min: 5, max: 75, bars: 10 });
      const r = this._rainNow('rain') || 0, custom = rs && tlcGraduated(rs);
      const rt = custom || (ri ? [0.2, 0.4, 0.6, 0.8, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0] : [5, 10, 15, 20, 25, 30, 40, 50, 65, 75]);
      // Custom marks share one decimal count (0.01, 0.15, 0.30 …) so the row reads evenly.
      const dec = custom ? Math.min(3, Math.max(...custom.map(v => tlcDec(+v.toFixed(3))))) : null;
      const labels = rt.map(v => custom ? v.toFixed(dec) : ri ? v.toFixed(v < 1 || v % 1 ? (v * 100 % 10 ? 2 : 1) : 1) : String(v));
      return `<div class="h"><b>Rain today, ${ru}</b><span>${r.toFixed(rd)} ${ru} · ${tlcEsc(this._sinceRain())} days since rain</span></div>${this._scale(labels, i => r >= rt[i] ? '#378ADD' : '')}`;
    };
    out.wind = () => {
      const wu = this._wu(), wl = TLC_WIND[wu][0], ws = tlcRange(c.wind_scale, { min: wl[0], max: wl[wl.length - 1], bars: wl.length });
      const w = this._n('wind') || 0, gu = this._n('gust') || 0, wt = (ws && tlcGraduated(ws)) || wl;
      return `<div class="h"><b>Wind and gust, ${tlcEsc(wu)}</b><span><i class="dot" style="background:#EF9F27"></i> ${w.toFixed(1)} wind${this._e.gust ? ` · <span${this._mi('gust')}><i class="dot" style="background:#FAC775"></i> ${gu.toFixed(1)} gust</span>` : ''}</span></div>${this._scale(wt.map(v => String(+v.toFixed(2))), i => w >= wt[i] ? '#EF9F27' : gu >= wt[i] ? '#FAC775' : '')}`;
    };
    const ent = { precipitation: 'rate', uv: 'uv', rain_today: 'rain', wind: 'wind' };
    return `<div class="p s6 t12 scs">${items.map(i => `<div${TLC_HALF_ITEMS.includes(i) ? '' : ' class="full"'}${this._mi(ent[i])}>${out[i]()}</div>`).join('')}</div>`;
  }

  _status(items) {
    const w = this._s('weather'), raining = this._isRaining(), lt = (parseInt(this._s('strikes')) || 0) > 0;
    const al = this._cfg.alerts || {}, wf = TLC_WIND[this._wu()][1];
    const hot = al.heat != null ? al.heat : this._isF() ? 95 : 35, windy = al.wind != null ? al.wind : Math.round(20 / wf);
    const wind = this._n('wind') || 0, heat = this._n('heat');
    const C = [
      ['mdi:weather-sunny', 'sun', w === 'sunny', '#EF9F27'], ['mdi:weather-night', 'clear', w === 'clear-night', '#7F77DD'],
      ['mdi:weather-cloudy', 'cloud', ['cloudy', 'partlycloudy'].includes(w), '#9A9890'], ['mdi:water', 'rain', raining || ['rainy', 'pouring', 'lightning-rainy'].includes(w), '#378ADD'],
      ['mdi:snowflake', 'snow', ['snowy', 'snowy-rainy', 'hail'].includes(w), '#85B7EB'], ['mdi:flash', 'lightning', lt || ['lightning', 'lightning-rainy'].includes(w), '#E24B4A'],
      ['mdi:weather-fog', 'fog', w === 'fog', '#9A9890'], ['mdi:weather-windy', 'wind', wind >= windy || ['windy', 'windy-variant'].includes(w), '#5DCAA5'],
      ['mdi:thermometer-high', 'heat', heat != null && heat >= hot, '#D85A30'], ['mdi:alert-outline', 'alert', w === 'exceptional', '#E24B4A']
    ];
    const cond = `<div class="cond">${C.map(c => `<div style="color:${c[2] ? c[3] : 'var(--off)'}"><ha-icon icon="${c[0]}"></ha-icon><div style="color:${c[2] ? 'var(--primary-text-color)' : 'var(--secondary-text-color)'}">${c[1]}</div></div>`).join('')}</div>`;
    const tr = this._s('trend').toLowerCase(), P = [['falling', 'mdi:chevron-double-down', '#E24B4A'], ['steady', 'mdi:gauge', '#378ADD'], ['rising', 'mdi:chevron-double-up', '#639922']];
    const pt = `<div class="pt">${P.map(p => `<div style="color:${tr === p[0] ? p[2] : 'var(--off)'}"><ha-icon icon="${p[1]}"></ha-icon><span style="color:${tr === p[0] ? 'var(--primary-text-color)' : 'var(--secondary-text-color)'}">${p[0]}</span></div>`).join('')}</div>`;
    const mp = this._s('moon');
    const moon = `<div class="moon">${TLC_MOON.map(m => `<div style="color:${m[0] === mp ? '#7F77DD' : 'var(--off)'}"><ha-icon icon="${m[1]}"></ha-icon><span style="color:${m[0] === mp ? 'var(--primary-text-color)' : 'var(--secondary-text-color)'}">${m[2] || '&nbsp;'}</span></div>`).join('')}</div>`;
    const ml = mp ? tlcEsc(mp.replace(/_/g, ' ')) : '—';
    const cl = tlcEsc((TLC_COND[w] || [0, w || '—'])[1]);
    const out = {
      conditions: a => `<div${this._mi('weather')}><div class="h ${a}"><b>Conditions</b><span>${cl}</span></div>${cond}</div>`,
      pressure: a => `<div${this._mi('trend')}><div class="h ${a}"><b>Pressure</b><span${this._mi('press')}>${this._f('press', this._pd())} ${tlcEsc(this._pu())}</span></div>${pt}</div>`,
      moon: a => `<div${this._mi('moon')}><div class="h ${a}"><b>Moon phase</b><span>${ml}</span></div>${moon}</div>`
    };
    const n = items.length, align = i => n === 1 ? 'c' : i === 0 ? 'l' : i === n - 1 ? 'r' : 'c';
    return `<div class="p s12 st" style="grid-template-columns:${items.map(i => TLC_COND_WIDTH[i]).join(' ')}">${items.map((i, k) => out[i](align(k))).join('')}</div>`;
  }

  _line(series, span, dec) {
    const end = Date.now(), start = end - span, N = 96, bw = span / N;
    const S = series.map(sr => {
      const b = new Array(N).fill(null), cnt = new Array(N).fill(0);
      (sr.pts || []).forEach(([t, v]) => { const i = Math.floor((t - start) / bw); if (i < 0 || i >= N) return; if (sr.agg === 'max') b[i] = b[i] == null ? v : Math.max(b[i], v); else { b[i] = (b[i] || 0) + v; cnt[i]++; } });
      if (sr.agg !== 'max') b.forEach((v, i) => { if (cnt[i]) b[i] = v / cnt[i]; });
      let last = null; const before = (sr.pts || []).filter(p => p[0] < start).pop(); if (before) last = before[1];
      for (let i = 0; i < N; i++) { if (b[i] == null) b[i] = last; else last = b[i]; }
      return Object.assign({}, sr, { b });
    });
    const all = S.flatMap(s => s.b.filter(v => v != null));
    if (!all.length) return `<div class="nd">No history yet</div>`;
    let lo = Math.min(...all), hi = Math.max(...all); if (hi - lo < 1e-9) { hi += 1; lo -= 1; } const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
    if (series[0].zero) lo = Math.min(0, lo);
    const X = i => 40 + i * (594 - 40) / (N - 1), Y = v => 10 + (hi - v) / (hi - lo) * 112;
    let s = '';
    [hi - pad, (hi + lo) / 2, lo + (series[0].zero && lo === 0 ? 0 : pad)].forEach(v => { s += `<line x1="40" x2="594" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--divider-color)" stroke-dasharray="3 4"/><text x="34" y="${Y(v) + 4}" text-anchor="end" style="font-size:10px;fill:var(--secondary-text-color)">${v.toFixed(dec)}</text>`; });
    for (let k = 0; k <= 4; k++) { const t = start + k * span / 4; s += `<text x="${40 + k * 554 / 4}" y="146" text-anchor="${k === 0 ? 'start' : k === 4 ? 'end' : 'middle'}" style="font-size:10px;fill:var(--secondary-text-color)">${k === 4 ? 'now' : this._hr(new Date(t))}</text>`; }
    S.forEach((sr, si) => {
      const pts = sr.b.map((v, i) => v == null ? null : `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).filter(Boolean);
      if (!pts.length) return;
      if (si === 0) s += `<polygon points="${pts[0].split(',')[0]},122 ${pts.join(' ')} ${pts[pts.length - 1].split(',')[0]},122" fill="${sr.color}" opacity=".13"/>`;
      s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${sr.color}" stroke-width="${sr.w || 2}" stroke-linejoin="round" stroke-linecap="round"/>`;
    });
    return `<svg viewBox="0 0 600 150" width="100%">${s}</svg>`;
  }

  _head(t, items) { return `<div class="h"><b>${t}</b><span>${items.map(i => `<span${i[2] ? this._mi(i[2]) : ''}><i class="dot" style="background:${i[1]}"></i> ${i[0]}</span>`).join(' &nbsp; ')}</span></div>`; }
  _tempChart() {
    const e = this._e, h = this._h, dew = e.dew ? [[`dew point ${this._f('dew')}°`, '#26A3C6', 'dew']] : [];
    return `<div class="p s6"${this._mi('temp')}>${this._head('Temperature · 24h', [[`air ${this._f('temp', 1)}°`, '#D85A30'], ...dew])}${this._line([{ pts: h[e.temp], color: '#D85A30' }, { pts: h[e.dew], color: '#26A3C6', w: 1.5 }], 864e5, 0)}</div>`;
  }
  _windChart() {
    const e = this._e, h = this._h, wu = tlcEsc(this._wu());
    const items = e.gust ? [[`wind ${this._f('wind', 1)}`, '#EF9F27'], [`gust ${this._f('gust', 1)} ${wu}`, '#E24B4A', 'gust']] : [[`wind ${this._f('wind', 1)} ${wu}`, '#EF9F27']];
    return `<div class="p s6"${this._mi('wind')}>${this._head('Wind and gust · 24h', items)}${this._line([{ pts: h[e.wind], color: '#EF9F27', zero: true }, { pts: h[e.gust], color: '#E24B4A', agg: 'max', w: 1.5 }], 864e5, 0)}</div>`;
  }
  _pressChart() {
    const e = this._e, h = this._h, pd = this._pd(), [pmin, pmax] = this._pRange();
    return `<div class="p s6"${this._mi('press')}>${this._head('Pressure · 24h', [[`${this._f('press', pd)} ${tlcEsc(this._pu())}`, '#7F77DD'], [`range ${pmin}–${pmax}`, 'var(--off)']])}${this._line([{ pts: h[e.press], color: '#7F77DD' }], 864e5, pd)}</div>`;
  }

  _rainChart() {
    const start = this._rainStart, days = 30;
    let body;
    if (!start) body = `<div class="nd">Loading…</div>`;
    else {
      const v = new Array(days).fill(0);
      this._rain.forEach(([t, x]) => { const i = Math.round((t - start) / 864e5); if (i >= 0 && i < days) v[i] = Math.max(v[i], x); });
      const today = this._rainNow('rain') || 0; v[days - 1] = Math.max(v[days - 1], today);
      const mx = Math.max(this._rainIn() ? 0.25 : 5, ...v), total = v.reduce((a, b) => a + b, 0), bw = 554 / days;
      let s = `<line x1="40" x2="594" y1="122" y2="122" stroke="var(--divider-color)"/><text x="34" y="16" text-anchor="end" style="font-size:10px;fill:var(--secondary-text-color)">${mx.toFixed(this._rd())}</text><text x="34" y="125" text-anchor="end" style="font-size:10px;fill:var(--secondary-text-color)">0</text>`;
      v.forEach((x, i) => { const hgt = x > 0 ? Math.max(3, x / mx * 110) : 3; s += `<rect x="${(40 + i * bw + 1.5).toFixed(1)}" y="${122 - hgt}" width="${(bw - 3).toFixed(1)}" height="${hgt}" rx="2" fill="${x > 0 ? '#378ADD' : 'var(--off)'}"/>`; });
      [0, 10, 20, 29].forEach(i => { const d = new Date(start + i * 864e5); s += `<text x="${40 + i * bw + bw / 2}" y="146" text-anchor="middle" style="font-size:10px;fill:var(--secondary-text-color)">${i === 29 ? 'today' : d.toLocaleDateString([], { month: 'short', day: 'numeric' })}</text>`; });
      body = `<svg viewBox="0 0 600 150" width="100%">${s}</svg>`;
      this._rainTotal = total;
    }
    return `<div class="p s6"${this._mi('rain')}><div class="h"><b>Daily rain · 30 days</b><span><i class="dot" style="background:#378ADD"></i> ${(this._rainTotal || 0).toFixed(this._rd())} ${this._ru()} total</span></div>${body}</div>`;
  }

  _footer() {
    const t = this._n('temp'), isF = this._isF();
    // Always steps by 10: the second row shows the ones digit within the current ten.
    const def = isF ? { min: 10, max: 110 } : { min: -10, max: 40 }, tb = this._cfg.temperature_bar || {};
    const lo = Math.floor((typeof tb.min === 'number' ? tb.min : def.min) / 10) * 10;
    const hi = Math.ceil((typeof tb.max === 'number' ? tb.max : def.max) / 10) * 10;
    const marks = tlcMarks({ min: lo, max: hi, step: 10 }) || tlcMarks({ min: def.min, max: def.max, step: 10 });
    const cur = t == null ? NaN : marks.filter(v => t >= v).pop(), dg = t == null ? -1 : ((Math.floor(t) % 10) + 10) % 10;
    const tr = marks.map(v => `<div>${v}<div class="fl ${t != null && t >= v ? 'on' : ''} ${v === cur ? 'cur' : ''}"></div></div>`).join('');
    const ones = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(o => `<div><div class="fl ${dg >= 0 && ((o > 0 && o <= dg) || (o === 0 && dg === 0)) ? 'on' : ''}"></div>${o}</div>`).join('');
    const feels = this._e.feels ? ` · feels like ${this._f('feels')}°` : '';
    return `<div class="s12 ft"${this._mi('temp')}><div class="dots"></div><div class="trow" style="grid-template-columns:repeat(${marks.length},minmax(0,1fr))">${tr}</div><div class="fcap">temperature, ${tlcEsc(this._tu())} · ${t == null ? '—' : t.toFixed(1)}${feels}</div><div class="orow">${ones}</div></div>`;
  }
}

// ---------------------------------------------------------------- editor
// ha-form and the entity picker are lazy-loaded by HA. Opening a built-in
// card's editor registers them. createCardElement can hand back an element
// whose class is still loading, so wait for the class itself, and resolve
// only once ha-form is really registered (or give up after a timeout).
const tlcWait = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);
const tlcLoadEditorDeps = async () => {
  if (customElements.get('ha-form') && customElements.get('ha-entity-picker')) return true;
  try {
    const helpers = await window.loadCardHelpers();
    helpers.createCardElement({ type: 'entities', entities: ['sun.sun'] });
    await tlcWait(customElements.whenDefined('hui-entities-card'), 5000);
    const cls = customElements.get('hui-entities-card');
    if (cls && cls.getConfigElement) await cls.getConfigElement();
  } catch (e) { /* fall through to the wait below */ }
  await tlcWait(customElements.whenDefined('ha-form'), 5000);
  return !!customElements.get('ha-form');
};

const TLC_SCALE_FIELDS = [
  ['temperature_bar', 'Temperature bar', ['min', 'max']],
  ['rain_scale', 'Rain today scale', ['min', 'max', 'bars']],
  ['wind_scale', 'Wind scale', ['min', 'max', 'bars']],
  ['rain_intensity', 'Rain intensity thresholds (per hour)', ['moderate', 'heavy']],
  ['alerts', 'Condition alerts', ['heat', 'wind']]
];

// Flat ha-form data <-> card config. Keys equal to defaults are left out of
// the config so the saved YAML stays minimal.
const tlcToForm = cfg => {
  const c = cfg || {}, d = { title: c.title || '', weather: c.weather || '' };
  TLC_SCALE_FIELDS.forEach(([k, , f]) => f.forEach(x => { const v = (c[k] || {})[x]; if (v != null) d[k + '__' + x] = v; }));
  Object.keys(TLC_ENTITY_LABELS).forEach(k => { d['inc__' + k] = !(c.exclude || []).includes(k); d['ent__' + k] = (c.entities || {})[k] || ''; });
  return d;
};
const tlcFromForm = (cfg, d) => {
  const c = Object.assign({}, cfg);
  ['title', 'weather'].forEach(k => { if (d[k]) c[k] = d[k]; else delete c[k]; });
  TLC_SCALE_FIELDS.forEach(([k, , f]) => {
    const o = {}; f.forEach(x => { const v = d[k + '__' + x]; if (v !== undefined && v !== null && v !== '' && !isNaN(Number(v))) o[x] = Number(v); });
    if (Object.keys(o).length) c[k] = o; else delete c[k];
  });
  const ex = Object.keys(TLC_ENTITY_LABELS).filter(k => d['inc__' + k] === false);
  if (ex.length) c.exclude = ex; else delete c.exclude;
  const ov = Object.assign({}, c.entities || {});
  Object.keys(TLC_ENTITY_LABELS).forEach(k => { if (d['ent__' + k]) ov[k] = d['ent__' + k]; else delete ov[k]; });
  if (Object.keys(ov).length) c.entities = ov; else delete c.entities;
  return c;
};
// Layout list -> config keys (panels, items, hide_panels, hide_items).
const tlcLayoutToCfg = (cfg, layout) => {
  const c = Object.assign({}, cfg), def = TLC_PANELS.map(p => p[0]);
  const order = layout.map(p => p.id), items = {}, hp = [], hi = [];
  layout.forEach(p => {
    if (p.hidden) hp.push(p.id);
    const io = p.items.map(i => i.id), di = TLC_PANELS.find(q => q[0] === p.id)[3].map(i => i[0]);
    if (io.join() !== di.join()) items[p.id] = io;
    p.items.forEach(i => { if (i.hidden) hi.push(p.id + '.' + i.id); });
  });
  if (order.join() !== def.join()) c.panels = order; else delete c.panels;
  if (Object.keys(items).length) c.items = items; else delete c.items;
  if (hp.length) c.hide_panels = hp; else delete c.hide_panels;
  if (hi.length) c.hide_items = hi; else delete c.hide_items;
  return c;
};

const TLC_EDITOR_CSS = `
.sec{margin:16px 0 4px;font-weight:500;font-size:15px}
.hint{color:var(--secondary-text-color);font-size:12px;margin:0 0 8px}
.lay{border:1px solid var(--divider-color);border-radius:8px;overflow:hidden}
.row{display:flex;align-items:center;gap:8px;padding:6px 10px;border-top:1px solid var(--divider-color)}
.row:first-child{border-top:0}
.row.sub{padding-left:38px;background:color-mix(in srgb,var(--primary-text-color) 3%,transparent)}
.row.off .lab{opacity:.45}
.lab{flex:1}
.row button{background:none;border:1px solid var(--divider-color);border-radius:6px;color:var(--primary-text-color);width:28px;height:26px;cursor:pointer;font-size:11px}
.row button:disabled{opacity:.3;cursor:default}
.cust{display:flex;align-items:center;gap:8px;margin:4px 0 8px;cursor:pointer}
.grp{margin:12px 0 4px;font-size:13px;font-weight:500;color:var(--secondary-text-color)}
.reset{margin-top:8px;background:none;border:1px solid var(--divider-color);border-radius:6px;color:var(--primary-color);padding:4px 10px;cursor:pointer}
`;

class TempestLightmapCardEditor extends HTMLElement {
  setConfig(c) {
    this._cfg = Object.assign({}, c || {});
    if (this._built) { this._syncForms(); this._renderLayout(); }
  }
  set hass(h) {
    this._hass = h;
    (this._forms || []).forEach(f => { f.hass = h; });
    if (!this._built && this._cfg) this._build();
    else if (this._built) this._syncForms();
  }
  connectedCallback() { if (!this._built && this._cfg && this._hass) this._build(); }

  _emit(c) {
    this._cfg = c;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: c }, bubbles: true, composed: true }));
  }

  _schemas() {
    const tu = this._unit('temp', '°F'), wu = this._unit('wind', 'mph');
    const us = this._hass && this._hass.config && this._hass.config.unit_system, ri = us ? us.length === 'mi' : tu.includes('F');
    const ru = ri ? 'in' : 'mm', isF = tu.includes('F');
    const defaults = {
      temperature_bar: isF ? { min: 10, max: 110 } : { min: -10, max: 40 },
      rain_scale: ri ? { min: 0.2, max: 3, bars: 10 } : { min: 5, max: 75, bars: 10 },
      wind_scale: TLC_WIND[wu] ? { min: TLC_WIND[wu][0][0], max: TLC_WIND[wu][0].slice(-1)[0], bars: TLC_WIND[wu][0].length } : { min: 2, max: 50, bars: 11 },
      rain_intensity: ri ? { moderate: 0.1, heavy: 0.3 } : { moderate: 2.5, heavy: 7.6 },
      alerts: { heat: isF ? 95 : 35, wind: Math.round(20 / (TLC_WIND[wu] ? TLC_WIND[wu][1] : 1)) }
    };
    this._defaults = defaults; this._units = { temperature_bar: tu, rain_scale: ru, wind_scale: wu, rain_intensity: ru + '/hr', alerts: { heat: tu, wind: wu } };
    const num = { number: { mode: 'box', step: 'any' } };
    return {
      general: [{ name: 'title', selector: { text: {} } }, { name: 'weather', selector: { entity: { domain: 'weather' } } }],
      // One plain form per group: several same-named expandables in one ha-form render nothing.
      scales: TLC_SCALE_FIELDS.map(([k, , f]) => [{ type: 'grid', name: k, flatten: true, schema: f.map(x => ({ name: k + '__' + x, selector: num })) }]),
      entities: Object.keys(TLC_ENTITY_LABELS).map(k => ({ type: 'grid', name: 'row__' + k, flatten: true, schema: [
        { name: 'inc__' + k, selector: { boolean: {} } },
        { name: 'ent__' + k, selector: { entity: { domain: k === 'sun' ? 'sun' : 'sensor' } } }
      ] }))
    };
  }
  _unit(k, fb) {
    const r = this._resolved(), s = r && r[k] && this._hass.states[r[k]];
    return (s && s.attributes.unit_of_measurement) || fb;
  }
  // What the card would auto-detect (ignoring exclusions), cached per config/registry.
  _resolved() {
    if (!this._hass) return null;
    const key = JSON.stringify([this._cfg.weather, this._cfg.entities]);
    if (this._rMemo && this._rMemo.key === key && this._rMemo.reg === this._hass.entities) return this._rMemo.e;
    const probe = Object.create(TempestLightmapCard.prototype);
    probe._hass = this._hass; probe._cfg = Object.assign({}, this._cfg, { exclude: [] }); probe._e = null; probe._stop = () => {};
    probe._resolve();
    this._rMemo = { key, reg: this._hass.entities, e: probe._e };
    return probe._e;
  }
  // HA calls computeLabel/computeHelper for grid containers too, not only for
  // fields, so anything that isn't one of our field names must return nothing
  // (a throw here aborts the whole form's render).
  _field(n) {
    const [k, x] = String(n || '').split('__');
    return x && this._units && k in this._units ? [k, x] : null;
  }
  _label(s) {
    const n = (s && s.name) || '';
    if (n === 'title') return 'Title';
    if (n === 'weather') return 'Weather entity';
    if (n.startsWith('inc__')) return 'Show ' + TLC_ENTITY_LABELS[n.slice(5)];
    if (n.startsWith('ent__')) return TLC_ENTITY_LABELS[n.slice(5)] + ' entity';
    const f = this._field(n);
    if (!f) return '';
    const [k, x] = f, u = this._units[k];
    if (x === 'bars') return 'Number of bars';
    return x.charAt(0).toUpperCase() + x.slice(1) + ' (' + (typeof u === 'object' ? u[x] : u) + ')';
  }
  _helper(s) {
    const n = (s && s.name) || '', r = this._resolved() || {};
    if (n === 'title') return 'Text on the side tab. Default: Weather station';
    if (n === 'weather') return r.weather ? 'Blank = auto: ' + r.weather : 'No Tempest weather entity found; pick one';
    if (n.startsWith('ent__')) { const a = r[n.slice(5)]; return a ? 'Blank = auto: ' + a : 'Not found automatically'; }
    if (n.startsWith('inc__')) return '';
    const f = this._field(n), d = f && this._defaults && this._defaults[f[0]];
    if (!f || d == null) return '';
    const v = d[f[1]];
    if (v == null) return '';
    if (f[0] === 'temperature_bar') return 'Default: ' + v + ' (rounded to tens)';
    if (f[1] === 'bars') return 'Default: ' + v + ' (2–' + TLC_MAX_MARKS + '). Round numbers with gaps that grow along the scale' + (f[0] === 'rain_scale' ? ', e.g. 0.01, 0.15, 0.30 … 1.50, 1.75, 2.00' : ', e.g. 2, 4, 6 … 10, 15, 20 … 30, 40, 50');
    return 'Default: ' + v;
  }

  _build() {
    this._built = true;
    this._buildAsync();
  }
  async _buildAsync() {
    const sr = this.shadowRoot || this.attachShadow({ mode: 'open' });
    sr.innerHTML = `<style>${TLC_EDITOR_CSS}</style>
<div id="general"></div>
<div class="sec">Layout</div><div class="hint">Toggle and reorder panels, and the items inside a panel.</div>
<div class="lay" id="lay"></div><button class="reset" id="reset">Reset layout to default</button>
<div class="sec">Scales and thresholds</div><div class="hint">Leave blank to use the defaults for your units.</div>
${TLC_SCALE_FIELDS.map(([k, title]) => `<div class="grp">${tlcEsc(title)}</div><div id="sc_${k}"></div>`).join('')}
<div class="sec">Entities</div><div class="hint">Off: every entity is detected automatically. On: each one can be hidden or replaced; hiding an entity hides every part of the card that uses it.</div>
<label class="cust"><input type="checkbox" id="custEnt"> Customize entities</label>
<div id="entities"></div>`;
    // Setting properties on an <ha-form> before its class is registered
    // stores them on the bare element and hides the class's own setters, so
    // the form would stay blank forever. Create forms only after it exists.
    this._renderLayout();
    const cust = sr.getElementById('custEnt');
    cust.addEventListener('change', () => this._setCustomize(cust.checked));
    this._syncCustomize();
    sr.getElementById('reset').addEventListener('click', () => {
      const c = Object.assign({}, this._cfg); ['panels', 'items', 'hide_panels', 'hide_items'].forEach(k => delete c[k]);
      this._emit(c); this._renderLayout();
    });
    if (!(await tlcLoadEditorDeps())) {
      sr.querySelectorAll('#general,[id^="sc_"],#entities').forEach(el => { el.innerHTML = '<div class="hint">Home Assistant\'s form fields did not load. Use "Show code editor" for these settings.</div>'; });
      return;
    }
    const sch = this._schemas();
    this._formIds = ['general', ...TLC_SCALE_FIELDS.map(g => 'sc_' + g[0]), 'entities'];
    this._forms = this._formIds.map(id => {
      const f = document.createElement('ha-form');
      f.hass = this._hass; f.schema = this._schemaFor(sch, id); f.data = tlcToForm(this._cfg);
      f.computeLabel = s => this._label(s); f.computeHelper = s => this._helper(s);
      f.addEventListener('value-changed', ev => { ev.stopPropagation(); this._emit(tlcFromForm(this._cfg, Object.assign(tlcToForm(this._cfg), ev.detail.value))); });
      sr.getElementById(id).appendChild(f);
      return f;
    });
  }
  // Customizing is on whenever the config carries entity overrides or
  // exclusions (or the user just switched it on in this session).
  _custOn() { return !!(this._entOn || this._cfg.entities || this._cfg.exclude); }
  _syncCustomize() {
    const sr = this.shadowRoot; if (!sr) return;
    const on = this._custOn(), cb = sr.getElementById('custEnt'), box = sr.getElementById('entities');
    if (cb) cb.checked = on;
    if (box) box.style.display = on ? '' : 'none';
  }
  _setCustomize(on) {
    const c = Object.assign({}, this._cfg);
    if (on) {
      // Start from what is detected now so every row shows a value.
      const r = this._resolved() || {}, ov = Object.assign({}, c.entities || {});
      Object.keys(TLC_ENTITY_LABELS).forEach(k => { if (!ov[k] && r[k]) ov[k] = r[k]; });
      if (Object.keys(ov).length) c.entities = ov;
      this._entOn = true;
    } else {
      delete c.entities; delete c.exclude; this._entOn = false;
    }
    this._emit(c); this._syncForms(); this._syncCustomize();
  }
  _syncForms() {
    this._syncCustomize();
    if (!this._forms) return;
    const d = tlcToForm(this._cfg), sch = this._schemas();
    this._forms.forEach((f, i) => { f.data = d; f.schema = this._schemaFor(sch, this._formIds[i]); });
  }
  _schemaFor(sch, id) { return id.startsWith('sc_') ? sch.scales[TLC_SCALE_FIELDS.findIndex(g => 'sc_' + g[0] === id)] : sch[id]; }
  _renderLayout() {
    const box = this.shadowRoot && this.shadowRoot.getElementById('lay');
    if (!box) return;
    const L = tlcLayout(this._cfg), row = (label, hidden, sub, up, down, keys) =>
      `<div class="row${sub ? ' sub' : ''}${hidden ? ' off' : ''}"><input type="checkbox" data-k="${keys}" data-a="t" ${hidden ? '' : 'checked'}><span class="lab">${tlcEsc(label)}</span>` +
      `<button data-k="${keys}" data-a="u" ${up ? '' : 'disabled'} title="Move up">▲</button><button data-k="${keys}" data-a="d" ${down ? '' : 'disabled'} title="Move down">▼</button></div>`;
    box.innerHTML = L.map((p, pi) => row(p.label, p.hidden, false, pi > 0, pi < L.length - 1, pi) +
      p.items.map((it, ii) => row(it.label, it.hidden, true, ii > 0, ii < p.items.length - 1, pi + '.' + ii)).join('')).join('');
    box.querySelectorAll('[data-a]').forEach(el => el.addEventListener(el.tagName === 'INPUT' ? 'change' : 'click', () => {
      const L2 = tlcLayout(this._cfg), [pi, ii] = el.dataset.k.split('.').map(Number), a = el.dataset.a;
      const list = ii == null || isNaN(ii) ? L2 : L2[pi].items, i = ii == null || isNaN(ii) ? pi : ii;
      if (a === 't') list[i].hidden = !el.checked;
      else { const j = a === 'u' ? i - 1 : i + 1; [list[i], list[j]] = [list[j], list[i]]; }
      this._emit(tlcLayoutToCfg(this._cfg, L2)); this._renderLayout();
    }));
  }
}

if (!customElements.get(TLC_TAG)) customElements.define(TLC_TAG, class extends TempestLightmapCard {});
if (!customElements.get(TLC_TAG + '-editor')) customElements.define(TLC_TAG + '-editor', class extends TempestLightmapCardEditor {});
window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === TLC_TAG)) window.customCards.push({
  type: TLC_TAG, name: TLC_NAME, description: 'LightMap-inspired Tempest weather station dashboard', preview: true,
  documentationURL: 'https://github.com/trevnologies/ha-tempest-lightmap-card',
  // HA 2026.6+: offer this card in the picker's Community section for Tempest weather entities.
  // Matches the Tempest weather entity or any Tempest entity on the same device.
  getEntitySuggestion: (hass, entityId) => {
    const reg = (hass && hass.entities) || {}, r = reg[entityId];
    if (!r || r.platform !== 'tempest') return null;
    const w = entityId.startsWith('weather.') ? entityId
      : (Object.values(reg).find(x => x.platform === 'tempest' && x.entity_id.startsWith('weather.') && r.device_id && x.device_id === r.device_id) || {}).entity_id;
    return w ? { config: { type: 'custom:' + TLC_TAG, weather: w } } : null;
  }
});
console.info(`%c ${TLC_TAG.toUpperCase()} %c ${TLC_VERSION} `, 'background:#4B2A5E;color:#fff', 'background:#FAC775;color:#4B2A5E');
