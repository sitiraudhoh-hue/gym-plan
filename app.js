/* Gym Plan 12 Minggu — vanilla JS, data tersimpan di perangkat (localStorage). */
(() => {
  'use strict';
  const KEY = 'gymplan.v1';
  const DEFAULT_PROFILE = {
    startDate: '2026-09-29', weight: 113, height: 168, age: 40, activity: 1.375, deficit: 500,
    stepsStart: 5000, stepsInc: 1000, stepsCap: 8000, protLow: 1.0, protHigh: 1.2, startWeight: 113,
  };

  // ---------- storage ----------
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && typeof raw === 'object') {
        return { profile: { ...DEFAULT_PROFILE, ...(raw.profile || {}) }, daily: raw.daily || {}, sessions: raw.sessions || {} };
      }
    } catch (e) { /* ignore */ }
    return { profile: { ...DEFAULT_PROFILE }, daily: {}, sessions: {} };
  }
  let S = load();
  let saveOk = true;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); saveOk = true; }
    catch (e) { if (saveOk) toast('Gagal menyimpan — memori browser penuh/diblokir. Export data sekarang.'); saveOk = false; }
  }

  // ---------- date helpers (local time) ----------
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const todayISO = () => iso(new Date());
  const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 86400000);
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const fmtDate = (s, withDay = true) => { const d = parse(s); return `${withDay ? HARI[d.getDay()] + ', ' : ''}${d.getDate()} ${BULAN[d.getMonth()]}`; };
  const fmtShort = s => { const d = parse(s); return `${d.getDate()} ${BULAN[d.getMonth()]}`; };

  function weekOf(dateISO) {
    const d = diffDays(dateISO, S.profile.startDate);
    return d < 0 ? 0 : Math.floor(d / 7) + 1; // 0 = belum mulai
  }
  const phaseOf = w => (w <= 4 ? 1 : w <= 8 ? 2 : 3);
  const dayCodeOf = dateISO => DAY_OF_WEEK[parse(dateISO).getDay()] || null;
  function sessionDate(week, code) {
    const offset = { A: 0, B: 2, C: 4 }[code]; // mulai Selasa
    const startDow = parse(S.profile.startDate).getDay();
    const firstTue = (2 - startDow + 7) % 7;
    return addDays(S.profile.startDate, firstTue + (week - 1) * 7 + offset);
  }

  // ---------- numbers ----------
  const num = v => (v === '' || v == null || isNaN(+v) ? null : +v);
  const fmt = (v, dp = 0) => (v == null ? '–' : Number(v).toLocaleString('id-ID', { minimumFractionDigits: dp, maximumFractionDigits: dp }));
  function targets() {
    const p = S.profile;
    const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
    const tdee = bmr * p.activity;
    return {
      bmi: p.weight / Math.pow(p.height / 100, 2), bmr, tdee,
      kcal: Math.round((tdee - p.deficit) / 10) * 10,
      protLow: Math.round(p.weight * p.protLow), protHigh: Math.round(p.weight * p.protHigh),
      lossLow: +(p.weight * 0.005).toFixed(1), lossHigh: +(p.weight * 0.01).toFixed(1),
    };
  }
  function stepTarget(dateISO) {
    const p = S.profile; const w = Math.max(1, weekOf(dateISO));
    return Math.min(p.stepsStart + Math.floor((w - 1) / 2) * p.stepsInc, p.stepsCap);
  }
  function weightSeries() {
    return Object.keys(S.daily).sort().filter(k => num(S.daily[k].weight) != null).map(k => ({ date: k, w: +S.daily[k].weight }));
  }
  function avg7(dateISO) {
    const vals = [];
    for (let i = 0; i < 7; i++) { const e = S.daily[addDays(dateISO, -i)]; if (e && num(e.weight) != null) vals.push(+e.weight); }
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }

  // ---------- ui helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
  function setTop(title, badge) {
    $('#topTitle').textContent = title;
    $('#topDate').textContent = fmtDate(todayISO()) + ' ' + new Date().getFullYear();
    $('#topBadge').textContent = badge || '';
    $('#topBadge').hidden = !badge;
  }
  function weekBadge(dateISO) {
    const w = weekOf(dateISO);
    if (w === 0) return 'Belum mulai';
    if (w > 12) return 'Program selesai';
    return `Minggu ${w} · Fase ${phaseOf(w)}`;
  }

  // ---------- router ----------
  const routes = { home: renderHome, latihan: renderLatihan, harian: renderHarian, panduan: renderPanduan, setelan: renderSetelan };
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [name, ...rest] = h.split('/');
    const r = routes[name] ? name : 'home';
    document.querySelectorAll('.tabbar a').forEach(a => { if (a.dataset.route === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const v = $('#view'); v.innerHTML = '';
    routes[r](v, rest);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ================= BERANDA =================
  function renderHome(v) {
    const today = todayISO();
    setTop('Beranda', weekBadge(today));
    const t = targets();
    const e = S.daily[today] || {};
    const code = dayCodeOf(today);
    const w = weekOf(today);
    const sess = code && w >= 1 && w <= 12 ? S.sessions[`W${w}-${code}`] : null;
    const steps = stepTarget(today);

    // hero: hari ini
    let hero;
    if (w === 0) {
      hero = `<div class="sub">Program dimulai</div><div class="big">${fmtDate(S.profile.startDate)}</div>
        <p class="sub" style="margin-top:6px">Sambil menunggu: jalan kaki ${fmt(steps)} langkah/hari dan mulai isi log harian.</p>`;
    } else if (code && w <= 12) {
      const done = sess && sess.done;
      hero = `<div class="sub">Hari gym · Sesi ${code}</div><div class="big">${done ? 'Sesi selesai ✓' : 'Full body ' + code}</div>
        <p class="sub" style="margin-top:4px">${PROGRAM[code].length} gerakan + cardio ${CARDIO.t[phaseOf(w) - 1]} · 75–90 menit</p>
        <a class="btn" style="margin-top:12px" href="#/latihan/${w}/${code}">${done ? 'Lihat log sesi' : sess ? 'Lanjutkan sesi' : 'Mulai sesi'}</a>`;
    } else if (w > 12) {
      hero = `<div class="sub">12 minggu selesai</div><div class="big">Saatnya evaluasi</div>
        <p class="sub" style="margin-top:6px">Bandingkan grafik BB & beban latihan, lalu susun program berikutnya.</p>`;
    } else {
      const next = nextSession(today);
      hero = `<div class="sub">Hari istirahat aktif</div><div class="big">Jalan ${fmt(steps)} langkah</div>
        <p class="sub" style="margin-top:4px">${next ? `Sesi berikutnya: ${next.code} · ${fmtDate(next.date)}` : ''}</p>`;
    }

    // tiles
    const a7 = avg7(today);
    const kneeLast = lastKnee();
    const tile = (lbl, val, unit, pct, status, overBad) => `<div class="tile"><div class="lbl">${lbl}</div><div class="val">${val}${unit ? ` <small>${unit}</small>` : ''}</div>${pct != null ? `<div class="bar ${overBad && pct > 1.075 ? 'over' : ''}"><i style="width:${Math.min(100, pct * 100)}%"></i></div>` : ''}${status || ''}</div>`;
    const st = (cls, txt) => `<div class="status ${cls}">${txt}</div>`;
    const kcal = num(e.kcal), prot = num(e.protein), stp = num(e.steps), wt = num(e.weight), sl = num(e.sleep);

    v.innerHTML = `
      <section class="card hero">${hero}</section>
      <section>
        <div class="row between" style="margin-bottom:8px"><h2>Rekap hari ini</h2><a class="ghost sm" href="#/harian/${today}">${Object.keys(e).length ? 'Ubah' : 'Isi data'}</a></div>
        <div class="tiles">
          ${tile('Berat badan', wt != null ? fmt(wt, 1) : '–', 'kg', null, a7 != null ? st('', `<span class="muted">Rata-rata 7 hari ${fmt(a7, 1)} kg</span>`) : '')}
          ${tile('Langkah', stp != null ? fmt(stp) : '–', `/ ${fmt(steps)}`, stp != null ? stp / steps : 0, stp != null ? (stp >= steps ? st('good', '✓ Target tercapai') : st('', `<span class="muted">Kurang ${fmt(steps - stp)}</span>`)) : '')}
          ${tile('Kalori', kcal != null ? fmt(kcal) : '–', `/ ${fmt(t.kcal)}`, kcal != null ? kcal / t.kcal : 0, kcal != null ? (kcal > t.kcal + 150 ? st('warn', '▲ Di atas target') : st('good', '✓ Sesuai target')) : '', true)}
          ${tile('Protein', prot != null ? fmt(prot) : '–', `/ ${t.protLow}–${t.protHigh} g`, prot != null ? prot / t.protLow : 0, prot != null ? (prot >= t.protLow ? st('good', '✓ Cukup') : st('warn', `Kurang ${t.protLow - prot} g`)) : '')}
          ${tile('Tidur', sl != null ? fmt(sl, 1) : '–', 'jam', null, sl != null && sl < 7 ? st('warn', 'Usahakan 7–9 jam') : '')}
          ${tile('Nyeri lutut (sesi terakhir)', kneeLast != null ? kneeLast : '–', '/ 10', null, kneeLast != null ? (kneeLast >= 6 ? st('bad', '● Ganti gerakan pemicu') : kneeLast >= 4 ? st('warn', '● Kurangi rentang/beban') : st('good', '● Aman')) : '')}
        </div>
      </section>
      <section class="card stack" id="chartCard"></section>
    `;
    renderChartCard($('#chartCard', v));
  }

  function nextSession(fromISO) {
    for (let i = 1; i <= 7; i++) { const d = addDays(fromISO, i); const c = dayCodeOf(d); const w = weekOf(d); if (c && w >= 1 && w <= 12) return { date: d, code: c, week: w }; }
    return null;
  }
  function lastKnee() {
    const keys = Object.keys(S.sessions).filter(k => S.sessions[k].date).sort((a, b) => S.sessions[b].date.localeCompare(S.sessions[a].date));
    for (const k of keys) {
      const vals = Object.values(S.sessions[k].knee || {}).map(num).filter(x => x != null);
      if (vals.length) return Math.max(...vals);
    }
    return null;
  }

  // ---------- chart ----------
  let chartRange = 'all';
  function renderChartCard(el) {
    const series = weightSeries();
    const first = series[0], last = series[series.length - 1];
    const startW = num(S.profile.startWeight) ?? (first && first.w);
    const lastAvg = last ? avg7(last.date) : null;
    const lost = lastAvg != null && startW != null ? startW - lastAvg : null;
    el.innerHTML = `
      <div class="row between wrap">
        <div><h2>Berat badan</h2><div class="sub">${lost != null ? (lost >= 0 ? `Turun <b>${fmt(lost, 1)} kg</b> dari ${fmt(startW, 1)} kg (rata-rata 7 hari)` : `Naik ${fmt(-lost, 1)} kg dari ${fmt(startW, 1)} kg`) : 'Isi BB di log harian untuk melihat grafik'}</div></div>
        <div class="chips" role="group" aria-label="Rentang grafik">
          ${[['28', '4 mgg'], ['84', '12 mgg'], ['all', 'Semua']].map(([k, l]) => `<button type="button" class="chip" data-range="${k}" aria-pressed="${chartRange === k}">${l}</button>`).join('')}
        </div>
      </div>
      <div class="legend"><span><i class="ln"></i>Rata-rata 7 hari</span><span><i class="dt"></i>Timbangan harian</span></div>
      <div class="chart-wrap" id="chart"></div>
    `;
    el.querySelectorAll('[data-range]').forEach(b => b.addEventListener('click', () => { chartRange = b.dataset.range; renderChartCard(el); }));
    drawChart($('#chart', el), series);
  }

  function drawChart(host, series) {
    if (chartRange !== 'all' && series.length) {
      const cut = addDays(series[series.length - 1].date, -(+chartRange - 1));
      series = series.filter(p => p.date >= cut);
    }
    if (series.length < 2) { host.innerHTML = `<div class="empty">${series.length ? 'Butuh minimal 2 hari data BB untuk grafik.' : 'Belum ada data berat badan.'}</div>`; return; }
    const W = Math.max(280, host.clientWidth || 320), H = 220, m = { l: 36, r: 10, t: 10, b: 24 };
    const d0 = series[0].date, dN = series[series.length - 1].date, span = Math.max(1, diffDays(dN, d0));
    const avgPts = series.map(p => ({ date: p.date, a: avg7(p.date) }));
    const all = series.map(p => p.w).concat(avgPts.map(p => p.a));
    let lo = Math.min(...all), hi = Math.max(...all);
    const padY = Math.max(0.5, (hi - lo) * 0.15); lo = Math.floor(lo - padY); hi = Math.ceil(hi + padY);
    const x = d => m.l + (diffDays(d, d0) / span) * (W - m.l - m.r);
    const y = v => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);
    const step = niceStep((hi - lo) / 4);
    let grid = '';
    for (let g = Math.ceil(lo / step) * step; g <= hi; g += step) {
      grid += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(g)}" y2="${y(g)}" stroke="var(--line)" stroke-width="1"/>` +
        `<text x="${m.l - 6}" y="${y(g) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${fmt(g, step < 1 ? 1 : 0)}</text>`;
    }
    const nTicks = Math.min(4, series.length);
    let xt = '';
    for (let i = 0; i < nTicks; i++) {
      const d = addDays(d0, Math.round((span * i) / Math.max(1, nTicks - 1)));
      xt += `<text x="${x(d)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === nTicks - 1 ? 'end' : 'middle'}" font-size="11" fill="var(--muted)">${fmtShort(d)}</text>`;
    }
    const dots = series.map(p => `<circle cx="${x(p.date)}" cy="${y(p.w)}" r="3" fill="var(--dot)"/>`).join('');
    const path = avgPts.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.a).toFixed(1)}`).join('');
    const lastA = avgPts[avgPts.length - 1];
    host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik berat badan harian dan rata-rata 7 hari">
      ${grid}${xt}${dots}
      <path d="${path}" fill="none" stroke="var(--teal)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${x(lastA.date)}" cy="${y(lastA.a)}" r="4.5" fill="var(--teal)" stroke="var(--surface)" stroke-width="2"/>
      <g id="hover" style="display:none"><line id="hl" y1="${m.t}" y2="${H - m.b}" stroke="var(--muted)" stroke-dasharray="3 3"/><circle id="hc" r="5" fill="var(--teal)" stroke="var(--surface)" stroke-width="2"/></g>
      <rect x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent" id="hit"/>
    </svg><div class="tt" id="tt" hidden></div>`;
    const svg = host.querySelector('svg'), tt = host.querySelector('#tt'), g = host.querySelector('#hover');
    const move = ev => {
      const r = svg.getBoundingClientRect(); const px = (ev.clientX - r.left) * (W / r.width);
      let best = 0, bd = Infinity; series.forEach((p, i) => { const dd = Math.abs(x(p.date) - px); if (dd < bd) { bd = dd; best = i; } });
      const p = series[best], a = avgPts[best].a;
      g.style.display = ''; host.querySelector('#hl').setAttribute('x1', x(p.date)); host.querySelector('#hl').setAttribute('x2', x(p.date));
      host.querySelector('#hc').setAttribute('cx', x(p.date)); host.querySelector('#hc').setAttribute('cy', y(a));
      tt.hidden = false; tt.innerHTML = `${fmtDate(p.date)}<br>Timbangan <b>${fmt(p.w, 1)} kg</b><br>Rata-rata 7 hari <b>${fmt(a, 1)} kg</b>`;
      const left = Math.min(Math.max(x(p.date) * (r.width / W), 70), r.width - 70);
      tt.style.left = left + 'px'; tt.style.top = (y(a) * (r.height / H)) + 'px';
    };
    const leave = () => { g.style.display = 'none'; tt.hidden = true; };
    svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move); svg.addEventListener('pointerleave', leave);
  }
  function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }

  // ================= LATIHAN =================
  function renderLatihan(v, params) {
    const today = todayISO();
    let w = +params[0], code = params[1];
    if (!(w >= 1 && w <= 12) || !PROGRAM[code]) {
      const tw = Math.min(12, Math.max(1, weekOf(today)));
      const tc = dayCodeOf(today);
      if (tc && weekOf(today) >= 1 && weekOf(today) <= 12) { w = tw; code = tc; }
      else { const n = nextSession(today); w = n ? n.week : tw; code = n ? n.code : 'A'; }
    }
    const ph = phaseOf(w);
    const key = `W${w}-${code}`;
    const sess = S.sessions[key] || (S.sessions[key] = { sets: {}, rpe: {}, knee: {}, notes: '', warm: {}, done: false });
    if (!sess.date) sess.date = sessionDate(w, code);
    setTop('Latihan', `Minggu ${w} · Fase ${ph}`);

    const list = PROGRAM[code].concat([CARDIO]);
    const setsFor = (ex, i) => {
      let n = ex.sets[ph - 1];
      if (w === 1 && ex.unit === 'kg' && ex.t[0].startsWith('2–3')) n = 2;
      return n;
    };
    const prevFor = i => {
      for (let pw = w - 1; pw >= 1; pw--) {
        const s = S.sessions[`W${pw}-${code}`];
        const arr = s && s.sets && s.sets[i];
        if (arr && arr.some(x => x && (num(x.kg) != null || num(x.reps) != null))) return { week: pw, arr };
      }
      return null;
    };
    const fmtSet = (ex, s) => {
      if (!s) return '';
      if (ex.unit === 'kg') return `${s.kg ?? '–'}×${s.reps ?? '–'}`;
      if (ex.unit === 'kg-detik') return `${s.kg ?? '–'}kg·${s.reps ?? '–'}dtk`;
      return `${s.reps ?? '–'}`;
    };
    const cols = ex => ex.unit === 'kg' ? ['kg', 'reps'] : ex.unit === 'kg-detik' ? ['kg/tangan', 'detik'] : [ex.unit];

    const weekChips = Array.from({ length: 12 }, (_, i) => i + 1).map(n => `<button type="button" class="chip" data-w="${n}" aria-pressed="${n === w}">${n}</button>`).join('');
    const dayChips = ['A', 'B', 'C'].map(c => `<button type="button" class="chip ${S.sessions[`W${w}-${c}`]?.done ? 'done' : ''}" data-c="${c}" aria-pressed="${c === code}">${c} · ${DAY_NAME[c]}</button>`).join('');

    v.innerHTML = `
      <section class="card stack">
        <div class="sub">Minggu</div><div class="chips" id="wk">${weekChips}</div>
        <div class="sub">Sesi</div><div class="chips" id="dy">${dayChips}</div>
        <label class="field">Tanggal sesi<input type="date" id="sdate" value="${esc(sess.date)}"></label>
      </section>
      <section class="card">
        <h3>Pemanasan & knee prep</h3>
        <div style="margin-top:6px">${WARMUP.map((t, i) => `<label class="check"><input type="checkbox" data-warm="${i}" ${sess.warm && sess.warm[i] ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div>
      </section>
      ${list.map((ex, i) => {
        const n = setsFor(ex, i); const c = cols(ex); const prev = prevFor(i); const cur = sess.sets[i] || [];
        const tgt = ex.t[ph - 1].replace(/^2–3×/, w === 1 && ex.unit === 'kg' ? '2×' : ph === 1 ? '3×' : '2–3×');
        return `<section class="card ex" data-i="${i}">
          <div class="ex-head"><div class="row" style="align-items:flex-start"><span class="ex-num">${i < list.length - 1 ? i + 1 : '♥'}</span><div><h3>${esc(ex.name)}</h3><div class="target">Target: ${esc(tgt)}</div></div></div></div>
          ${prev ? `<div class="prev">Minggu ${prev.week}: ${prev.arr.map(s => fmtSet(ex, s)).filter(Boolean).join(' · ')}</div>` : ''}
          <div class="set-labels ${c.length === 1 ? 'one' : ''}"><span>Set</span>${c.map(x => `<span>${x}</span>`).join('')}</div>
          <div class="sets">${Array.from({ length: n }, (_, s) => {
            const val = cur[s] || {};
            const inputs = c.length === 2
              ? `<input type="number" inputmode="decimal" step="0.5" min="0" data-s="${s}" data-f="kg" value="${esc(val.kg ?? '')}" aria-label="${esc(ex.name)} set ${s + 1} ${c[0]}"><input type="number" inputmode="numeric" min="0" data-s="${s}" data-f="reps" value="${esc(val.reps ?? '')}" aria-label="${esc(ex.name)} set ${s + 1} ${c[1]}">`
              : `<input type="number" inputmode="numeric" min="0" data-s="${s}" data-f="reps" value="${esc(val.reps ?? '')}" aria-label="${esc(ex.name)} set ${s + 1} ${c[0]}">`;
            return `<div class="set ${c.length === 1 ? 'one' : ''}"><span class="n">${s + 1}</span>${inputs}</div>`;
          }).join('')}</div>
          ${i < list.length - 1 ? `<div class="meta">
            <label class="field">RPE<select data-rpe>${['', 5, 6, 7, 8, 9, 10].map(r => `<option value="${r}" ${String(sess.rpe[i] ?? '') === String(r) ? 'selected' : ''}>${r === '' ? '–' : r}</option>`).join('')}</select></label>
            <label class="field">Nyeri lutut (0–10)<select data-knee class="${kneeCls(sess.knee[i])}">${['', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(r => `<option value="${r}" ${String(sess.knee[i] ?? '') === String(r) ? 'selected' : ''}>${r === '' ? '–' : r}</option>`).join('')}</select></label>
          </div>` : ''}
          <div class="row between">
            ${ex.tip ? `<details class="tip"><summary>Tips</summary><p>${esc(ex.tip)}</p></details>` : '<span></span>'}
            ${i < list.length - 1 ? `<div class="rest-row">${[60, 90, 120].map(s => `<button type="button" class="ghost sm" data-rest="${s}">⏱ ${s}s</button>`).join('')}</div>` : ''}
          </div>
        </section>`;
      }).join('')}
      <section class="card stack">
        <label class="field">Catatan sesi<textarea id="snotes" rows="3" placeholder="Mis. lutut agak kaku di awal, hilang setelah pemanasan">${esc(sess.notes)}</textarea></label>
        <label class="check"><input type="checkbox" id="cool" ${sess.cool ? 'checked' : ''}><span>${esc(COOLDOWN)}</span></label>
        <button type="button" class="btn ${sess.done ? '' : 'peach'} block" id="doneBtn">${sess.done ? 'Sesi selesai ✓ (ketuk untuk batalkan)' : 'Tandai sesi selesai'}</button>
      </section>`;

    const persist = () => { save(); };
    v.querySelectorAll('#wk [data-w]').forEach(b => b.addEventListener('click', () => { location.hash = `#/latihan/${b.dataset.w}/${code}`; }));
    v.querySelectorAll('#dy [data-c]').forEach(b => b.addEventListener('click', () => { location.hash = `#/latihan/${w}/${b.dataset.c}`; }));
    $('#sdate', v).addEventListener('change', e => { sess.date = e.target.value || sessionDate(w, code); persist(); });
    v.querySelectorAll('[data-warm]').forEach(c => c.addEventListener('change', () => { sess.warm = sess.warm || {}; sess.warm[c.dataset.warm] = c.checked; persist(); }));
    v.querySelectorAll('.ex').forEach(card => {
      const i = +card.dataset.i;
      card.querySelectorAll('input[data-s]').forEach(inp => inp.addEventListener('input', () => {
        const s = +inp.dataset.s; sess.sets[i] = sess.sets[i] || [];
        sess.sets[i][s] = sess.sets[i][s] || {};
        sess.sets[i][s][inp.dataset.f] = inp.value === '' ? null : +inp.value;
        persist();
      }));
      const r = card.querySelector('[data-rpe]'); if (r) r.addEventListener('change', () => { sess.rpe[i] = r.value === '' ? null : +r.value; persist(); });
      const k = card.querySelector('[data-knee]'); if (k) k.addEventListener('change', () => {
        sess.knee[i] = k.value === '' ? null : +k.value; k.className = kneeCls(sess.knee[i]); persist();
        if (sess.knee[i] >= 6) toast('Nyeri ≥6: ganti gerakan ini hari ini.'); else if (sess.knee[i] >= 4) toast('Nyeri 4–5: kurangi rentang gerak atau beban.');
      });
      card.querySelectorAll('[data-rest]').forEach(b => b.addEventListener('click', () => startTimer(+b.dataset.rest)));
    });
    $('#snotes', v).addEventListener('input', e => { sess.notes = e.target.value; persist(); });
    $('#cool', v).addEventListener('change', e => { sess.cool = e.target.checked; persist(); });
    $('#doneBtn', v).addEventListener('click', () => { sess.done = !sess.done; persist(); toast(sess.done ? 'Mantap! Sesi tersimpan.' : 'Status selesai dibatalkan.'); route(); });
    persist();
  }
  const kneeCls = k => (k == null || k === '' ? '' : k >= 6 ? 'knee-hi' : k >= 4 ? 'knee-mid' : '');

  // ---------- rest timer ----------
  let timerI, timerEnd;
  function startTimer(sec) {
    clearInterval(timerI); timerEnd = Date.now() + sec * 1000;
    const el = $('#timer'); el.hidden = false; el.classList.remove('done');
    const tick = () => {
      const left = Math.max(0, Math.round((timerEnd - Date.now()) / 1000));
      $('#timerText').textContent = `${Math.floor(left / 60)}:${pad(left % 60)}`;
      if (left <= 0) { clearInterval(timerI); el.classList.add('done'); $('#timerText').textContent = 'Set berikutnya!'; beep(); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); setTimeout(() => { el.hidden = true; }, 4000); }
    };
    tick(); timerI = setInterval(tick, 250);
  }
  $('#timerStop').addEventListener('click', () => { clearInterval(timerI); $('#timer').hidden = true; });
  function beep() {
    try { const C = window.AudioContext || window.webkitAudioContext; const c = new C(); const o = c.createOscillator(); const g = c.createGain(); o.frequency.value = 880; o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(0.2, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6); o.start(); o.stop(c.currentTime + 0.6); } catch (e) { /* ignore */ }
  }

  // ================= HARIAN =================
  function renderHarian(v, params) {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(params[0] || '') ? params[0] : todayISO();
    setTop('Log harian', weekBadge(date));
    const e = S.daily[date] || {};
    const t = targets();
    const recent = Object.keys(S.daily).sort().reverse().slice(0, 21);
    v.innerHTML = `
      <section class="card stack">
        <div class="row between">
          <button type="button" class="ghost" id="prevD" aria-label="Hari sebelumnya">‹</button>
          <input type="date" id="dPick" value="${date}" style="max-width:200px;text-align:center">
          <button type="button" class="ghost" id="nextD" aria-label="Hari berikutnya">›</button>
        </div>
        <div class="sub" style="text-align:center">${fmtDate(date)}${dayCodeOf(date) ? ` · Hari gym (Sesi ${dayCodeOf(date)})` : ''}</div>
        <form id="dForm" class="stack" autocomplete="off">
          <div class="grid2">
            <label class="field">Berat badan (kg)<input type="number" step="0.1" inputmode="decimal" name="weight" value="${esc(e.weight ?? '')}" placeholder="113.0"></label>
            <label class="field">Langkah (target ${fmt(stepTarget(date))})<input type="number" inputmode="numeric" name="steps" value="${esc(e.steps ?? '')}" placeholder="5000"></label>
            <label class="field">Kalori (target ${fmt(t.kcal)})<input type="number" inputmode="numeric" name="kcal" value="${esc(e.kcal ?? '')}" placeholder="${t.kcal}"></label>
            <label class="field">Protein g (${t.protLow}–${t.protHigh})<input type="number" inputmode="numeric" name="protein" value="${esc(e.protein ?? '')}" placeholder="${t.protLow}"></label>
            <label class="field">Tidur (jam)<input type="number" step="0.5" inputmode="decimal" name="sleep" value="${esc(e.sleep ?? '')}" placeholder="7"></label>
            <label class="field">Lingkar pinggang (cm)<input type="number" step="0.5" inputmode="decimal" name="waist" value="${esc(e.waist ?? '')}" placeholder="opsional"></label>
          </div>
          <label class="field">Catatan<input type="text" name="note" value="${esc(e.note ?? '')}" placeholder="Mis. haid hari ke-2, makan di luar"></label>
          <button class="btn block" type="submit">Simpan</button>
        </form>
        <p class="muted">Timbang pagi setelah buang air, sebelum makan/minum.</p>
      </section>
      <section class="card">
        <h2 style="margin-bottom:8px">Riwayat terbaru</h2>
        ${recent.length ? `<div class="tablewrap"><table><thead><tr><th>Tanggal</th><th class="num">BB</th><th class="num">Rata² 7h</th><th class="num">Langkah</th><th class="num">kcal</th><th class="num">Prot</th></tr></thead><tbody>
          ${recent.map(k => { const r = S.daily[k]; const a = avg7(k); return `<tr data-go="${k}" style="cursor:pointer"><td>${fmtShort(k)}</td><td class="num">${fmt(num(r.weight), 1)}</td><td class="num">${a != null ? fmt(a, 1) : '–'}</td><td class="num">${fmt(num(r.steps))}</td><td class="num">${fmt(num(r.kcal))}</td><td class="num">${fmt(num(r.protein))}</td></tr>`; }).join('')}
        </tbody></table></div>` : '<div class="empty">Belum ada data.</div>'}
      </section>`;
    const go = d => { location.hash = `#/harian/${d}`; };
    $('#prevD', v).addEventListener('click', () => go(addDays(date, -1)));
    $('#nextD', v).addEventListener('click', () => go(addDays(date, 1)));
    $('#dPick', v).addEventListener('change', ev => ev.target.value && go(ev.target.value));
    v.querySelectorAll('[data-go]').forEach(tr => tr.addEventListener('click', () => go(tr.dataset.go)));
    $('#dForm', v).addEventListener('submit', ev => {
      ev.preventDefault();
      const fd = new FormData(ev.target); const rec = {};
      for (const [k, val] of fd.entries()) { if (val === '') continue; rec[k] = k === 'note' ? val : +val; }
      if (Object.keys(rec).length) S.daily[date] = rec; else delete S.daily[date];
      save(); toast('Tersimpan'); if (date === todayISO()) location.hash = '#/'; else route();
    });
  }

  // ================= PANDUAN =================
  function renderPanduan(v) {
    setTop('Panduan', weekBadge(todayISO()));
    const t = targets();
    const menuK = MENU.reduce((a, r) => a + r[3], 0), menuP = MENU.reduce((a, r) => a + r[4], 0);
    const cur = Math.min(3, Math.max(1, phaseOf(Math.max(1, weekOf(todayISO())))));
    v.innerHTML = `
      <section class="card stack">
        <h2>Target kamu</h2>
        <div class="tiles">
          <div class="tile"><div class="lbl">Kalori harian</div><div class="val">${fmt(t.kcal)} <small>kcal</small></div></div>
          <div class="tile"><div class="lbl">Protein</div><div class="val">${t.protLow}–${t.protHigh} <small>g</small></div></div>
          <div class="tile"><div class="lbl">Perkiraan TDEE</div><div class="val">${fmt(t.tdee)} <small>kcal</small></div></div>
          <div class="tile"><div class="lbl">Turun realistis</div><div class="val">${fmt(t.lossLow, 1)}–${fmt(t.lossHigh, 1)} <small>kg/mgg</small></div></div>
        </div>
        <p class="note">Dihitung dengan rumus Mifflin-St Jeor (BMR ${fmt(t.bmr)} kcal) × faktor aktivitas ${S.profile.activity} − defisit ${S.profile.deficit} kcal, dari BB ${fmt(S.profile.weight, 1)} kg. Ini estimasi dan bisa meleset ±10% — sesuaikan dari tren BB 2–3 minggu. Ubah angka di Setelan.</p>
      </section>
      ${GUIDE.map((g, i) => `<details class="acc" ${i === 2 ? 'open' : ''}><summary>${esc(g.title)}</summary><div><ul class="clean">${g.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></details>`).join('')}
      <details class="acc"><summary>Program lengkap (fase ${cur} ditandai)</summary><div class="stack">
        ${['A', 'B', 'C'].map(c => `<div><h3 style="margin-bottom:6px">Sesi ${c} · ${DAY_NAME[c]}</h3><div class="tablewrap"><table><thead><tr><th>Gerakan</th>${[1, 2, 3].map(p => `<th ${p === cur ? 'style="color:var(--teal)"' : ''}>F${p}</th>`).join('')}</tr></thead><tbody>
          ${PROGRAM[c].concat([CARDIO]).map(ex => `<tr><td>${esc(ex.name)}</td>${ex.t.map((x, p) => `<td ${p + 1 === cur ? 'style="font-weight:600"' : ''}>${esc(x)}</td>`).join('')}</tr>`).join('')}
        </tbody></table></div></div>`).join('')}
      </div></details>
      <details class="acc"><summary>Nutrisi — defisit sederhana</summary><div class="stack">
        <ul class="clean">${NUTRI_RULES.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <h3>Contoh menu sehari</h3>
        <div class="tablewrap"><table><thead><tr><th>Menu</th><th>Porsi</th><th class="num">kcal</th><th class="num">Prot (g)</th></tr></thead><tbody>
          ${MENU.map(r => `<tr><td><span class="muted">${esc(r[0])}</span><br>${esc(r[1])}</td><td>${esc(r[2])}</td><td class="num">${r[3]}</td><td class="num">${r[4]}</td></tr>`).join('')}
          <tr><td colspan="2"><b>Total</b></td><td class="num"><b>${fmt(menuK)}</b></td><td class="num"><b>${menuP}</b></td></tr>
        </tbody></table></div>
        <p class="note">Selisih dengan target: ${fmt(t.kcal - menuK)} kcal (bisa untuk nasi/buah tambahan). Angka makanan adalah <b>perkiraan kasar</b> — cek di Tabel Komposisi Pangan Indonesia (panganku.org) atau aplikasi seperti FatSecret/MyFitnessPal.</p>
      </div></details>
      <p class="note warnbox">Aplikasi ini berisi panduan umum, bukan saran medis. Dengan BMI ${fmt(t.bmi, 1)} dan keluhan lutut, sebaiknya konsultasi dengan dokter di awal program (mis. cek tekanan darah). Hentikan dan periksakan bila ada nyeri dada, sesak berlebihan, pusing, atau lutut bengkak/terkunci.</p>`;
  }

  // ================= SETELAN =================
  function renderSetelan(v) {
    setTop('Setelan', '');
    const p = S.profile;
    const f = (name, label, step = 'any', note = '') => `<label class="field">${label}<input type="number" step="${step}" inputmode="decimal" name="${name}" value="${esc(p[name])}">${note ? `<span class="muted">${note}</span>` : ''}</label>`;
    const latest = weightSeries().slice(-1)[0];
    const a7 = latest ? avg7(latest.date) : null;
    v.innerHTML = `
      <section class="card stack">
        <h2>Profil & target</h2>
        <form id="pForm" class="stack">
          <label class="field">Tanggal mulai program (Selasa)<input type="date" name="startDate" value="${esc(p.startDate)}"></label>
          <div class="grid2">
            ${f('weight', 'BB untuk hitung kalori (kg)', '0.1')}
            ${f('startWeight', 'BB awal program (kg)', '0.1')}
            ${f('height', 'Tinggi (cm)', '1')}
            ${f('age', 'Usia', '1')}
            ${f('activity', 'Faktor aktivitas', '0.025', '1,375 ringan · 1,45 bila ≥8.000 langkah')}
            ${f('deficit', 'Defisit (kcal)', '50', 'Maks. ±750 tanpa pendampingan')}
            ${f('stepsStart', 'Langkah awal', '500')}
            ${f('stepsInc', 'Tambah tiap 2 mgg', '500')}
            ${f('stepsCap', 'Batas langkah', '500')}
            ${f('protLow', 'Protein bawah (g/kg)', '0.1')}
          </div>
          ${a7 != null ? `<button type="button" class="ghost" id="useAvg">Pakai rata-rata 7 hari terakhir (${fmt(a7, 1)} kg) untuk hitung kalori</button>` : ''}
          <button class="btn block" type="submit">Simpan profil</button>
        </form>
      </section>
      <section class="card stack">
        <h2>Backup data</h2>
        <p class="sub">Data hanya tersimpan di browser HP ini. Export rutin (mis. tiap minggu) supaya tidak hilang saat ganti HP atau hapus data browser.</p>
        <button type="button" class="btn block" id="expJson">Export backup (.json)</button>
        <button type="button" class="ghost" id="expCsv">Export log harian (.csv)</button>
        <button type="button" class="ghost" id="expCsv2">Export log latihan (.csv)</button>
        <label class="ghost" style="text-align:center;cursor:pointer">Import backup (.json)<input type="file" id="imp" accept="application/json,.json" hidden></label>
      </section>
      <section class="card stack">
        <h2>Reset</h2>
        <p class="sub">Menghapus semua data di perangkat ini. Export dulu bila perlu.</p>
        <button type="button" class="ghost" id="reset" style="color:var(--bad);border-color:var(--bad)">Hapus semua data</button>
      </section>
      <p class="muted" style="text-align:center">Gym Plan 12 Minggu · v1.0 · berjalan offline</p>`;

    $('#pForm', v).addEventListener('submit', ev => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      for (const [k, val] of fd.entries()) { if (k === 'startDate') { if (val) p.startDate = val; } else if (val !== '' && !isNaN(+val)) p[k] = +val; }
      p.protHigh = +(p.protLow + 0.2).toFixed(2);
      save(); toast('Profil tersimpan'); route();
    });
    const ua = $('#useAvg', v); if (ua) ua.addEventListener('click', () => { p.weight = +a7.toFixed(1); save(); toast(`BB hitung kalori: ${fmt(p.weight, 1)} kg`); route(); });
    $('#expJson', v).addEventListener('click', () => download(`gymplan-backup-${todayISO()}.json`, JSON.stringify({ app: 'gymplan', version: 1, exported: new Date().toISOString(), ...S }, null, 2), 'application/json'));
    $('#expCsv', v).addEventListener('click', () => {
      const rows = [['tanggal', 'minggu', 'bb_kg', 'rata7_kg', 'langkah', 'target_langkah', 'kalori', 'protein_g', 'tidur_jam', 'pinggang_cm', 'catatan']];
      Object.keys(S.daily).sort().forEach(k => { const r = S.daily[k]; const a = avg7(k); rows.push([k, weekOf(k), r.weight, a != null ? a.toFixed(2) : '', r.steps, stepTarget(k), r.kcal, r.protein, r.sleep, r.waist, r.note]); });
      download(`gymplan-harian-${todayISO()}.csv`, toCSV(rows), 'text/csv');
    });
    $('#expCsv2', v).addEventListener('click', () => {
      const rows = [['minggu', 'sesi', 'tanggal', 'gerakan', 'set', 'kg', 'reps_detik_menit', 'rpe', 'nyeri_lutut', 'selesai']];
      Object.keys(S.sessions).sort((a, b) => (S.sessions[a].date || '').localeCompare(S.sessions[b].date || '')).forEach(k => {
        const [, wk, c] = k.match(/^W(\d+)-([ABC])$/) || []; if (!c) return;
        const s = S.sessions[k]; const list = PROGRAM[c].concat([CARDIO]);
        Object.keys(s.sets || {}).forEach(i => (s.sets[i] || []).forEach((st, j) => { if (!st) return; rows.push([wk, c, s.date, list[i] ? list[i].name : i, j + 1, st.kg ?? '', st.reps ?? '', s.rpe?.[i] ?? '', s.knee?.[i] ?? '', s.done ? 'ya' : '']); }));
      });
      download(`gymplan-latihan-${todayISO()}.csv`, toCSV(rows), 'text/csv');
    });
    $('#imp', v).addEventListener('change', async ev => {
      const file = ev.target.files[0]; if (!file) return;
      try {
        const d = JSON.parse(await file.text());
        if (!d || typeof d !== 'object' || !('daily' in d) || !('sessions' in d)) throw new Error('format');
        if (!confirm('Import akan MENGGANTI semua data di perangkat ini dengan isi file backup. Lanjutkan?')) return;
        S = { profile: { ...DEFAULT_PROFILE, ...(d.profile || {}) }, daily: d.daily || {}, sessions: d.sessions || {} };
        save(); toast('Backup berhasil di-import'); route();
      } catch (e) { toast('File bukan backup Gym Plan yang valid'); }
    });
    $('#reset', v).addEventListener('click', () => {
      if (!confirm('Hapus SEMUA data (log harian, log latihan, profil)? Tindakan ini tidak bisa dibatalkan.')) return;
      S = { profile: { ...DEFAULT_PROFILE }, daily: {}, sessions: {} }; save(); toast('Semua data dihapus'); location.hash = '#/';
    });
  }
  function toCSV(rows) { return '﻿' + rows.map(r => r.map(c => { const s = c == null ? '' : String(c); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n'); }
  function download(name, text, type) {
    const blob = new Blob([text], { type }); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // re-render chart on resize (home only)
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { const c = $('#chartCard'); if (c) renderChartCard(c); }, 200); });

  // service worker (offline + installable)
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  route();
})();
