const TLC_VERSION = '1.0.5';
const TLC_DEFAULTS = {
  temp: 'sensor.tempest_home_air_temperature', feels: 'sensor.tempest_home_feels_like', dew: 'sensor.tempest_home_dew_point',
  hum: 'sensor.tempest_home_relative_humidity', wind: 'sensor.tempest_home_wind_speed', gust: 'sensor.tempest_home_wind_gust',
  dir: 'sensor.tempest_home_wind_direction', press: 'sensor.tempest_home_sea_level_pressure', trend: 'sensor.tempest_home_pressure_trend',
  pmin: 'sensor.tempest_home_tempest_pressure_24h_min', pmax: 'sensor.tempest_home_tempest_pressure_24h_max',
  uv: 'sensor.tempest_home_uv_index', rate: 'sensor.tempest_home_rain_intensity', rain: 'sensor.tempest_home_rain_accumulation_today',
  raining: 'binary_sensor.rain_currently_raining', since: 'sensor.rain_days_since_last_rain',
  strikes: 'sensor.tempest_home_lightning_detected_last_3_hrs', heat: 'sensor.tempest_home_heat_index',
  ts: 'sensor.tempest_home_timestamp', moon: 'sensor.moon_phase', weather: 'weather.tempest_home', sun: 'sun.sun'
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
.g{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px;padding:12px;max-width:1500px;margin:0 auto;box-sizing:border-box}
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
.scs{display:grid;gap:16px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.st{display:grid;grid-template-columns:2.2fr 1fr 1.6fr;gap:28px}
@container (max-width:900px){.st{grid-template-columns:1fr}}
@container (max-width:520px){.two{grid-template-columns:1fr}}
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
.trow{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:6px;text-align:center;font-size:14px}
.orow{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:6px;text-align:center;font-size:14px;margin:0 4.5%}
.fl{height:10px;border-radius:5px;background:rgba(255,255,255,.2);margin:7px 0}
.fl.on{background:#FAC775}.fl.cur{outline:2px solid #fff;outline-offset:2px}
.fcap{text-align:center;font-size:12px;opacity:.8;margin:6px 0}
.nd{font-size:12px;color:var(--fg2);padding:24px 0;text-align:center}
`;

class TempestLightmapCard extends HTMLElement {
  setConfig(c) {
    this._e = Object.assign({}, TLC_DEFAULTS, (c && c.entities) || {});
    this._title = (c && c.title) || 'Weather station';
    this._fc = { hourly: [], daily: [] };
    this._h = {}; this._rain = []; this._dirty = true;
  }
  static getStubConfig() { return {}; }
  getCardSize() { return 24; }
  set hass(h) {
    this._hass = h;
    if (h.themes && typeof h.themes.darkMode === 'boolean') this.toggleAttribute('dark', h.themes.darkMode);
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${TLC_CSS}</style><div class="w"><div class="g" id="g"></div></div>`;
    }
    if (this.isConnected) this._start();
    const sig = Object.values(this._e).map(id => { const s = h.states[id]; return s ? s.last_updated : ''; }).join('|');
    if (sig !== this._sig) { this._sig = sig; this._dirty = true; }
    this._schedule();
  }
  connectedCallback() { if (this._hass) { this._start(); this._dirty = true; this._schedule(); } }
  disconnectedCallback() {
    (this._unsubs || []).forEach(u => { try { u(); } catch (e) {} });
    this._unsubs = null; clearInterval(this._hi); clearInterval(this._ti); this._hi = this._ti = null;
  }
  _start() {
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
    const ids = [e.temp, e.dew, e.wind, e.gust, e.press];
    try {
      const r = await h.callWS({ type: 'history/history_during_period', start_time: start.toISOString(), end_time: end.toISOString(), entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false });
      const out = {};
      ids.forEach(id => { out[id] = (r[id] || []).map(x => [(x.lu != null ? x.lu : x.lc) * 1000, parseFloat(x.s)]).filter(p => !isNaN(p[1]) && !isNaN(p[0])); });
      this._h = out;
    } catch (err) { this._h = {}; }
    try {
      const s0 = new Date(end); s0.setHours(0, 0, 0, 0); s0.setDate(s0.getDate() - 29);
      const r2 = await h.callWS({ type: 'recorder/statistics_during_period', start_time: s0.toISOString(), end_time: end.toISOString(), statistic_ids: [e.rain], period: 'day', types: ['max'] });
      this._rain = (r2[e.rain] || []).map(x => [typeof x.start === 'number' ? x.start : Date.parse(x.start), (x.max || 0) / 25.4]);
      this._rainStart = s0.getTime();
    } catch (err) { this._rain = []; }
    this._dirty = true; this._schedule();
  }
  _schedule() {
    if (this._t || !this._dirty) return;
    this._t = setTimeout(() => { this._t = null; if (this._dirty) { this._dirty = false; this._render(); } }, 400);
  }
  _s(k) { const s = this._hass.states[this._e[k]]; return s ? s.state : ''; }
  _n(k) { const x = parseFloat(this._s(k)); return isNaN(x) ? null : x; }
  _f(k, d = 0) { const x = this._n(k); return x == null ? '—' : x.toFixed(d); }

  _render() {
    const g = this.shadowRoot.getElementById('g');
    try { g.innerHTML = this._header() + this._next12() + this._days() + this._hum() + this._windDir() + this._scales() + this._status() + this._charts() + this._footer(); }
    catch (err) { g.innerHTML = `<div class="p s12 nd">Tempest card error: ${err.message}</div>`; }
  }

  _time(d, opt) { return d.toLocaleTimeString([], opt || { hour: 'numeric', minute: '2-digit' }); }
  _hr(d) { return d.toLocaleTimeString([], { hour: 'numeric' }).replace(/\s/g, '').toLowerCase(); }

  _header() {
    const w = this._s('weather'), c = TLC_COND[w] || ['mdi:weather-partly-cloudy', w || '—', '#9A9890'];
    const t = this._n('temp');
    const ts = Date.parse(this._s('ts')), m = isNaN(ts) ? null : Math.max(0, Math.round((Date.now() - ts) / 60000));
    const ok = m != null && m < 10;
    const sun = this._hass.states[this._e.sun], up = sun && sun.state === 'above_horizon';
    const sunT = sun ? this._time(new Date(up ? sun.attributes.next_setting : sun.attributes.next_rising)) : '—';
    const rain = this._n('rain'), lt = parseInt(this._s('strikes')) || 0;
    const q = (l, v, col) => `<div><div class="lbl">${l}</div><div class="qv"${col ? ` style="color:${col}"` : ''}>${v}</div></div>`;
    return `<div class="p s12 hdr"><div class="tab"><span>${this._title}</span></div>
<div class="brand"><div class="wm">Tempest<sup>°</sup></div><div class="bar"></div><div class="live"><span class="dot" style="background:${ok ? '#639922' : '#EF9F27'}"></span>${ok ? 'Live' : 'Stale'} · ${m == null ? 'no update' : m < 1 ? 'updated just now' : 'updated ' + m + ' min ago'}</div></div>
<div class="now"><ha-icon icon="${c[0]}" style="color:${c[2]}"></ha-icon><div><div class="big">${t == null ? '—' : t.toFixed(1)}<u>°F</u></div><div class="lbl" style="margin-top:6px">${c[1]} · feels like ${this._f('feels')}°</div></div></div>
<div class="qs">${q('Dew point', this._f('dew') + '°')}${q('Rain today', rain == null ? '—' : (rain / 25.4).toFixed(2) + ' in', rain ? '#378ADD' : '')}${q('Lightning 3h', lt + ' strikes', lt ? '#E5A800' : '')}${q(up ? 'Sunset' : 'Sunrise', sunT, '#D85A30')}</div></div>`;
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
    return `<div class="p s8"><div class="h"><b>Next 12 hours</b><span>forecast</span></div>${body}</div>`;
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
    return `<div class="p s4"><div class="h"><b>10-day forecast</b><span>high · low · rain</span></div>${body}</div>`;
  }

  _hum() {
    const v = this._n('hum'); let s = '';
    for (let i = 0; i <= 10; i++) {
      const a = (225 - i * 27) * Math.PI / 180, lit = v != null && i * 10 <= v + 0.01;
      s += `<line x1="${80 + 42 * Math.cos(a)}" y1="${80 - 42 * Math.sin(a)}" x2="${80 + 54 * Math.cos(a)}" y2="${80 - 54 * Math.sin(a)}" stroke="${lit ? '#D4537E' : 'var(--off)'}" stroke-width="9" stroke-linecap="round"/>`;
      s += `<text x="${80 + 69 * Math.cos(a)}" y="${84 - 69 * Math.sin(a)}" text-anchor="middle" style="font-size:10px;fill:var(--secondary-text-color)">${i * 10}</text>`;
    }
    s += `<text x="80" y="88" text-anchor="middle" style="font-size:28px;font-weight:500;fill:var(--primary-text-color)">${v == null ? '—' : Math.round(v)}<tspan style="font-size:14px;fill:var(--secondary-text-color)">%</tspan></text>`;
    return `<div class="p s3"><div class="h"><b>Humidity</b><span>dew point ${this._f('dew')}°</span></div><div class="dial"><svg viewBox="0 0 160 150">${s}</svg></div></div>`;
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
    return `<div class="p s3"><div class="h"><b>Wind direction</b><span>from ${card}${d == null ? '' : ' · ' + Math.round(d) + '°'}</span></div><div class="dial"><svg viewBox="0 0 160 160">${s}</svg></div></div>`;
  }

  _scale(labels, litFn, extra) {
    return `<div class="sc" style="grid-template-columns:repeat(${labels.length},minmax(0,1fr))">${labels.map((l, i) => { const c = litFn(i); return `<div class="${c ? 'on' : ''}"><div class="led" style="${c ? 'background:' + c : ''}"></div><span>${l}</span></div>`; }).join('')}</div>`;
  }

  _scales() {
    const rate = (this._n('rate') || 0) / 25.4;
    const lvl = rate <= 0 ? 0 : rate < 0.1 ? 1 : rate < 0.3 ? 2 : 3;
    const pi = this._scale(['none', 'light', 'moderate', 'heavy'], i => lvl === 0 ? (i === 0 ? '#9A9890' : '') : (i > 0 && i <= lvl ? ['', '#85B7EB', '#378ADD', '#185FA5'][i] : ''));
    const uv = this._n('uv') || 0, ul = uv < 3 ? 0 : uv < 6 ? 1 : uv < 8 ? 2 : uv < 11 ? 3 : 4, uc = ['#639922', '#E5C100', '#EF9F27', '#E24B4A', '#9B59B6'];
    const uvs = this._scale(['low', 'moderate', 'high', 'very high', 'extreme'], i => i <= ul ? uc[i] : '');
    const r = (this._n('rain') || 0) / 25.4, rt = [0.2, 0.4, 0.6, 0.8, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];
    const acc = this._scale(rt.map(v => v.toFixed(v < 1 || v % 1 ? (v * 100 % 10 ? 2 : 1) : 1)), i => r >= rt[i] ? '#378ADD' : '');
    const w = this._n('wind') || 0, gu = this._n('gust') || 0, wt = [2, 4, 6, 8, 10, 15, 20, 25, 30, 40, 50];
    const wg = this._scale(wt, i => w >= wt[i] ? '#EF9F27' : gu >= wt[i] ? '#FAC775' : '');
    return `<div class="p s6 t12 scs">
<div class="two"><div><div class="h"><b>Precipitation intensity</b><span>${rate.toFixed(2)} in/hr</span></div>${pi}</div><div><div class="h"><b>UV index</b><span>${uv.toFixed(1)}</span></div>${uvs}</div></div>
<div><div class="h"><b>Rain today, in</b><span>${r.toFixed(2)} in · ${this._s('since') || '—'} days since rain</span></div>${acc}</div>
<div><div class="h"><b>Wind and gust, mph</b><span><i class="dot" style="background:#EF9F27"></i> ${w.toFixed(1)} wind · <i class="dot" style="background:#FAC775"></i> ${gu.toFixed(1)} gust</span></div>${wg}</div></div>`;
  }

  _status() {
    const w = this._s('weather'), raining = this._s('raining') === 'on', lt = (parseInt(this._s('strikes')) || 0) > 0;
    const wind = this._n('wind') || 0, heat = this._n('heat');
    const C = [
      ['mdi:weather-sunny', 'sun', w === 'sunny', '#EF9F27'], ['mdi:weather-night', 'clear', w === 'clear-night', '#7F77DD'],
      ['mdi:weather-cloudy', 'cloud', ['cloudy', 'partlycloudy'].includes(w), '#9A9890'], ['mdi:water', 'rain', raining || ['rainy', 'pouring', 'lightning-rainy'].includes(w), '#378ADD'],
      ['mdi:snowflake', 'snow', ['snowy', 'snowy-rainy', 'hail'].includes(w), '#85B7EB'], ['mdi:flash', 'lightning', lt || ['lightning', 'lightning-rainy'].includes(w), '#E24B4A'],
      ['mdi:weather-fog', 'fog', w === 'fog', '#9A9890'], ['mdi:weather-windy', 'wind', wind >= 20 || ['windy', 'windy-variant'].includes(w), '#5DCAA5'],
      ['mdi:thermometer-high', 'heat', heat != null && heat >= 95, '#D85A30'], ['mdi:alert-outline', 'alert', w === 'exceptional', '#E24B4A']
    ];
    const cond = `<div class="cond">${C.map(c => `<div style="color:${c[2] ? c[3] : 'var(--off)'}"><ha-icon icon="${c[0]}"></ha-icon><div style="color:${c[2] ? 'var(--primary-text-color)' : 'var(--secondary-text-color)'}">${c[1]}</div></div>`).join('')}</div>`;
    const tr = this._s('trend'), P = [['falling', 'mdi:chevron-double-down', '#E24B4A'], ['steady', 'mdi:gauge', '#378ADD'], ['rising', 'mdi:chevron-double-up', '#639922']];
    const pt = `<div class="pt">${P.map(p => `<div style="color:${tr === p[0] ? p[2] : 'var(--off)'}"><ha-icon icon="${p[1]}"></ha-icon><span style="color:${tr === p[0] ? 'var(--primary-text-color)' : 'var(--secondary-text-color)'}">${p[0]}</span></div>`).join('')}</div>`;
    const mp = this._s('moon');
    const moon = `<div class="moon">${TLC_MOON.map(m => `<div style="color:${m[0] === mp ? '#7F77DD' : 'var(--off)'}"><ha-icon icon="${m[1]}"></ha-icon><span style="color:${m[0] === mp ? 'var(--primary-text-color)' : 'var(--secondary-text-color)'}">${m[2] || '&nbsp;'}</span></div>`).join('')}</div>`;
    const ml = mp ? mp.replace(/_/g, ' ') : '—';
    return `<div class="p s12 st"><div><div class="h l"><b>Conditions</b><span>${(TLC_COND[w] || [0, w || '—'])[1]}</span></div>${cond}</div><div><div class="h c"><b>Pressure</b><span>${this._f('press', 2)} inHg</span></div>${pt}</div><div><div class="h r"><b>Moon phase</b><span>${ml}</span></div>${moon}</div></div>`;
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

  _charts() {
    const e = this._e, h = this._h, D = 864e5;
    const head = (t, items) => `<div class="h"><b>${t}</b><span>${items.map(i => `<i class="dot" style="background:${i[1]}"></i> ${i[0]}`).join(' &nbsp; ')}</span></div>`;
    const temp = `<div class="p s6">${head('Temperature · 24h', [[`air ${this._f('temp', 1)}°`, '#D85A30'], [`dew point ${this._f('dew')}°`, '#26A3C6']])}${this._line([{ pts: h[e.temp], color: '#D85A30' }, { pts: h[e.dew], color: '#26A3C6', w: 1.5 }], D, 0)}</div>`;
    const wind = `<div class="p s6">${head('Wind and gust · 24h', [[`wind ${this._f('wind', 1)}`, '#EF9F27'], [`gust ${this._f('gust', 1)} mph`, '#E24B4A']])}${this._line([{ pts: h[e.wind], color: '#EF9F27', zero: true }, { pts: h[e.gust], color: '#E24B4A', agg: 'max', w: 1.5 }], D, 0)}</div>`;
    const pr = `<div class="p s6">${head('Pressure · 24h', [[`${this._f('press', 2)} inHg`, '#7F77DD'], [`range ${this._f('pmin', 2)}–${this._f('pmax', 2)}`, 'var(--off)']])}${this._line([{ pts: h[e.press], color: '#7F77DD' }], D, 2)}</div>`;
    return temp + wind + pr + this._rainChart();
  }

  _rainChart() {
    const start = this._rainStart, days = 30;
    let body;
    if (!start) body = `<div class="nd">Loading…</div>`;
    else {
      const v = new Array(days).fill(0);
      this._rain.forEach(([t, x]) => { const i = Math.round((t - start) / 864e5); if (i >= 0 && i < days) v[i] = Math.max(v[i], x); });
      const today = (this._n('rain') || 0) / 25.4; v[days - 1] = Math.max(v[days - 1], today);
      const mx = Math.max(0.25, ...v), total = v.reduce((a, b) => a + b, 0), bw = 554 / days;
      let s = `<line x1="40" x2="594" y1="122" y2="122" stroke="var(--divider-color)"/><text x="34" y="16" text-anchor="end" style="font-size:10px;fill:var(--secondary-text-color)">${mx.toFixed(2)}</text><text x="34" y="125" text-anchor="end" style="font-size:10px;fill:var(--secondary-text-color)">0</text>`;
      v.forEach((x, i) => { const hgt = x > 0 ? Math.max(3, x / mx * 110) : 3; s += `<rect x="${(40 + i * bw + 1.5).toFixed(1)}" y="${122 - hgt}" width="${(bw - 3).toFixed(1)}" height="${hgt}" rx="2" fill="${x > 0 ? '#378ADD' : 'var(--off)'}"/>`; });
      [0, 10, 20, 29].forEach(i => { const d = new Date(start + i * 864e5); s += `<text x="${40 + i * bw + bw / 2}" y="146" text-anchor="middle" style="font-size:10px;fill:var(--secondary-text-color)">${i === 29 ? 'today' : d.toLocaleDateString([], { month: 'short', day: 'numeric' })}</text>`; });
      body = `<svg viewBox="0 0 600 150" width="100%">${s}</svg>`;
      this._rainTotal = total;
    }
    return `<div class="p s6"><div class="h"><b>Daily rain · 30 days</b><span><i class="dot" style="background:#378ADD"></i> ${(this._rainTotal || 0).toFixed(2)} in total</span></div>${body}</div>`;
  }

  _footer() {
    const t = this._n('temp');
    const tens = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110], ft = t == null ? -1 : Math.floor(t / 10) * 10, dg = t == null ? -1 : ((Math.floor(t) % 10) + 10) % 10;
    const tr = tens.map(v => `<div>${v}<div class="fl ${t != null && t >= v ? 'on' : ''} ${v === ft ? 'cur' : ''}"></div></div>`).join('');
    const ones = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(o => `<div><div class="fl ${dg >= 0 && ((o > 0 && o <= dg) || (o === 0 && dg === 0)) ? 'on' : ''}"></div>${o}</div>`).join('');
    return `<div class="s12 ft"><div class="dots"></div><div class="trow">${tr}</div><div class="fcap">temperature, °F · ${t == null ? '—' : t.toFixed(1)} · feels like ${this._f('feels')}°</div><div class="orow">${ones}</div></div>`;
  }
}

if (!customElements.get('tempest-lightmap-card')) customElements.define('tempest-lightmap-card', TempestLightmapCard);
window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'tempest-lightmap-card')) window.customCards.push({ type: 'tempest-lightmap-card', name: 'Tempest LightMap card', description: 'LightMap-inspired Tempest weather dashboard' });
console.info(`%c TEMPEST-LIGHTMAP-CARD %c ${TLC_VERSION} `, 'background:#4B2A5E;color:#fff', 'background:#FAC775;color:#4B2A5E');
