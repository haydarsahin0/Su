/* Su Takibi — verileri tarayıcının localStorage'ında tutar. */
(() => {
  'use strict';

  const KEY = 'su-takip-v1';
  const DEFAULTS = { goal: 2500, presets: [200, 250, 330, 500], theme: 'auto', days: {} };
  const DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ---------- Depolama ---------- */
  let state = load();
  let selectedDate = keyOf(new Date());
  let historyLimit = 10;
  let chartRange = '7d';
  let lastAdded = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULTS);
      const parsed = JSON.parse(raw);
      return {
        goal: Number(parsed.goal) > 0 ? Number(parsed.goal) : DEFAULTS.goal,
        presets: Array.isArray(parsed.presets) && parsed.presets.length
          ? parsed.presets.map(Number).filter((n) => n > 0).slice(0, 6)
          : [...DEFAULTS.presets],
        theme: parsed.theme || 'auto',
        days: parsed.days && typeof parsed.days === 'object' ? parsed.days : {},
      };
    } catch (e) {
      console.warn('Kayıtlı veri okunamadı:', e);
      return structuredClone(DEFAULTS);
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      toast('Veri kaydedilemedi (depolama dolu olabilir).');
    }
  }

  /* ---------- Tarih yardımcıları ---------- */
  function keyOf(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  function dateOf(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function addDays(d, n) {
    const c = new Date(d);
    c.setDate(c.getDate() + n);
    return c;
  }
  /* Haftanın başlangıcı: Pazartesi */
  function weekStart(d) {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    c.setDate(c.getDate() - ((c.getDay() + 6) % 7));
    return c;
  }
  function fmtLong(key) {
    const d = dateOf(key);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${DAY_NAMES[d.getDay()]}`;
  }
  function fmtShort(key) {
    const d = dateOf(key);
    return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  }
  function relLabel(key) {
    const today = keyOf(new Date());
    if (key === today) return 'Bugün';
    if (key === keyOf(addDays(new Date(), -1))) return 'Dün';
    return fmtLong(key);
  }
  const nf = new Intl.NumberFormat('tr-TR');

  /* ---------- Veri erişimi ---------- */
  const entriesOf = (key) => (state.days[key] && state.days[key].entries) || [];
  const totalOf = (key) => entriesOf(key).reduce((s, e) => s + e.amount, 0);
  const recordedKeys = () => Object.keys(state.days).filter((k) => totalOf(k) > 0).sort().reverse();

  function addWater(amount, dayKey) {
    amount = Math.round(Number(amount));
    if (!Number.isFinite(amount) || amount <= 0) return false;
    if (amount > 5000) amount = 5000;
    if (!state.days[dayKey]) state.days[dayKey] = { entries: [] };
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amount,
      time: dayKey === keyOf(new Date())
        ? new Date().toTimeString().slice(0, 5)
        : '—',
    };
    state.days[dayKey].entries.push(entry);
    lastAdded = { dayKey, id: entry.id };
    save();
    return true;
  }

  function removeEntry(dayKey, id) {
    if (!state.days[dayKey]) return;
    state.days[dayKey].entries = entriesOf(dayKey).filter((e) => e.id !== id);
    if (!state.days[dayKey].entries.length) delete state.days[dayKey];
    if (lastAdded && lastAdded.id === id) lastAdded = null;
    save();
  }

  /* ---------- İstatistikler ---------- */
  function lastDays(n, endDate = new Date()) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const k = keyOf(addDays(endDate, -i));
      out.push({ key: k, total: totalOf(k) });
    }
    return out;
  }

  /* Son n hafta: her hafta için günlük ortalama (içinde bulunulan haftada
     yalnızca geçen günler sayılır, ortalama şişmesin). */
  function lastWeeks(n) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = weekStart(today);
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const start = addDays(thisWeek, -7 * i);
      let sum = 0;
      let days = 0;
      for (let d = 0; d < 7; d++) {
        const cur = addDays(start, d);
        if (cur > today) break;
        sum += totalOf(keyOf(cur));
        days++;
      }
      out.push({
        start: keyOf(start),
        end: keyOf(addDays(start, Math.max(days - 1, 0))),
        sum,
        days,
        avg: days ? Math.round(sum / days) : 0,
        current: i === 0,
      });
    }
    return out;
  }

  function streak() {
    let n = 0;
    let cur = new Date();
    if (totalOf(keyOf(cur)) < state.goal) cur = addDays(cur, -1); // bugün henüz bitmedi
    while (totalOf(keyOf(cur)) >= state.goal) {
      n++;
      cur = addDays(cur, -1);
    }
    return n;
  }

  /* ---------- Görsel güncelleme ---------- */
  function render() {
    renderToday();
    renderPresets();
    renderStats();
    renderChart();
    renderDayLog();
    renderHistory();
  }

  function renderToday() {
    const todayKey = keyOf(new Date());
    $('#todayLabel').textContent = fmtLong(todayKey);

    const total = totalOf(todayKey);
    const goal = state.goal;
    const pct = goal > 0 ? total / goal : 0;
    const capped = Math.min(pct, 1);

    $('#todayAmount').textContent = nf.format(total);
    $('#todayGoalText').textContent = `hedef ${nf.format(goal)} ml`;
    $('#todayPct').textContent = `%${Math.round(pct * 100)}`;

    const CIRC = 2 * Math.PI * 90;
    const ring = $('#ringFg');
    ring.style.strokeDashoffset = String(CIRC * (1 - capped));
    ring.style.opacity = total > 0 ? '1' : '0';

    // Dalga seviyesi: cam alanı y = 24..176
    const level = 176 - capped * 152;
    $('#waveLevel').setAttribute('transform', `translate(0,${(level - 18).toFixed(1)})`);

    const remain = goal - total;
    $('#remainText').textContent = remain > 0
      ? `Hedefe ${nf.format(remain)} ml kaldı.`
      : `Hedefi ${nf.format(-remain)} ml aştın, harikasın! 🎉`;

    const s = streak();
    $('#streakChip').textContent = s > 0 ? `🔥 ${s} günlük seri` : '🔥 Seri henüz başlamadı';
    $('#undoBtn').disabled = !lastAdded;
  }

  function renderPresets() {
    const box = $('#presets');
    box.textContent = '';
    const icons = ['🥃', '☕', '🥤', '🍶', '🧊', '🫗'];
    state.presets.forEach((amount, i) => {
      const b = el('button', 'preset');
      b.type = 'button';
      b.append(el('span', 'g', icons[i % icons.length]), el('span', null, `${nf.format(amount)} ml`));
      b.addEventListener('click', () => {
        if (addWater(amount, selectedDate)) {
          toast(`${nf.format(amount)} ml eklendi 💧`);
          render();
        }
      });
      box.append(b);
    });
  }

  function renderStats() {
    const days7 = lastDays(7);
    const avg7 = Math.round(days7.reduce((s, d) => s + d.total, 0) / 7);
    $('#avg7').innerHTML = `${nf.format(avg7)} <small>ml</small>`;
    const diff = avg7 - state.goal;
    $('#avg7Sub').textContent = diff >= 0
      ? `hedefin ${nf.format(diff)} ml üstünde`
      : `hedefin ${nf.format(-diff)} ml altında`;

    const weeks = lastWeeks(7);
    const totalDays = weeks.reduce((s, w) => s + w.days, 0);
    const totalSum = weeks.reduce((s, w) => s + w.sum, 0);
    const avgW = totalDays ? Math.round(totalSum / totalDays) : 0;
    $('#avg7w').innerHTML = `${nf.format(avgW)} <small>ml</small>`;
    $('#avg7wSub').textContent = `${totalDays} günün günlük ortalaması`;

    const days30 = lastDays(30);
    const reached = days30.filter((d) => d.total >= state.goal).length;
    $('#goalDays').textContent = `${reached} / 30`;

    const all = recordedKeys();
    if (all.length) {
      const best = all.reduce((a, b) => (totalOf(b) > totalOf(a) ? b : a));
      $('#bestDay').innerHTML = `${nf.format(totalOf(best))} <small>ml</small>`;
      $('#bestDaySub').textContent = relLabel(best);
    } else {
      $('#bestDay').innerHTML = '0 <small>ml</small>';
      $('#bestDaySub').textContent = 'Henüz kayıt yok';
    }
  }

  function renderChart() {
    const box = $('#chart');
    box.textContent = '';

    let items;
    if (chartRange === '7w') {
      items = lastWeeks(7).map((w) => ({
        value: w.avg,
        label: `${fmtShort(w.start)}`,
        title: `${fmtShort(w.start)} – ${fmtShort(w.end)} · toplam ${nf.format(w.sum)} ml`,
        highlight: w.current,
      }));
    } else {
      const n = chartRange === '30d' ? 30 : 7;
      const todayKey = keyOf(new Date());
      items = lastDays(n).map((d) => ({
        value: d.total,
        label: n > 7 ? String(dateOf(d.key).getDate()) : DAY_NAMES[dateOf(d.key).getDay()],
        title: `${fmtLong(d.key)} · ${nf.format(d.total)} ml`,
        highlight: d.key === todayKey,
      }));
    }

    const peak = Math.max(state.goal, ...items.map((i) => i.value));
    const max = peak * 1.15;
    const showValues = items.length <= 10;

    const plot = el('div', 'plot');
    const axis = el('div', 'x-axis');

    const line = el('div', 'goal-line');
    line.dataset.label = `${nf.format(state.goal)} ml`;
    line.style.bottom = `${(state.goal / max) * 100}%`;
    plot.append(line);

    items.forEach((it, idx) => {
      const h = Math.max((it.value / max) * 100, it.value ? 1.5 : 0.6);
      const col = el('div', 'bar-col' + (it.value >= state.goal ? ' reached' : ''));
      col.title = it.title;

      if (showValues) {
        const val = el('div', 'bar-val', it.value ? nf.format(it.value) : '–');
        val.style.bottom = `calc(${h}% + 5px)`;
        col.append(val);
      }
      const bar = el('div', 'bar' + (it.value ? '' : ' empty') + (it.highlight ? ' today' : ''));
      bar.style.height = `${h}%`;
      bar.style.animationDelay = `${idx * 28}ms`;
      col.append(bar);
      plot.append(col);
      axis.append(el('span', null, it.label));
    });

    box.append(plot, axis);
  }

  function renderDayLog() {
    const list = $('#entryList');
    list.textContent = '';
    const isToday = selectedDate === keyOf(new Date());
    $('#dayLogTitle').textContent = isToday ? 'Bugünün kayıtları' : `${relLabel(selectedDate)} kayıtları`;
    $('#dayLogTotal').textContent = `${nf.format(totalOf(selectedDate))} ml`;

    const entries = entriesOf(selectedDate);
    if (!entries.length) {
      list.append(el('li', 'empty-state', 'Bu gün için henüz kayıt yok. Yukarıdan hızlıca ekleyebilirsin.'));
      return;
    }
    [...entries].reverse().forEach((e) => {
      const li = el('li', 'entry');
      li.append(
        el('span', 'e-ico', '💧'),
        el('span', 'e-amt', `${nf.format(e.amount)} ml`),
        el('span', 'e-time', e.time)
      );
      const del = el('button', 'del', '✕');
      del.type = 'button';
      del.title = 'Bu kaydı sil';
      del.setAttribute('aria-label', `${e.amount} ml kaydını sil`);
      del.addEventListener('click', () => {
        removeEntry(selectedDate, e.id);
        toast('Kayıt silindi.');
        render();
      });
      li.append(del);
      list.append(li);
    });
  }

  function renderHistory() {
    const list = $('#historyList');
    list.textContent = '';
    const keys = recordedKeys();
    $('#historyCount').textContent = `${keys.length} gün`;

    if (!keys.length) {
      list.append(el('li', 'empty-state', 'Geçmiş burada birikecek. İlk bardağını ekleyerek başla 💧'));
      $('#moreBtn').hidden = true;
      return;
    }

    keys.slice(0, historyLimit).forEach((k) => {
      const total = totalOf(k);
      const pct = Math.min((total / state.goal) * 100, 100);
      const li = el('li', 'hrow' + (k === selectedDate ? ' sel' : ''));
      li.tabIndex = 0;
      li.setAttribute('role', 'button');
      li.title = 'Bu günün kayıtlarını göster';

      const left = el('div');
      left.append(el('div', 'h-date', relLabel(k)));
      left.append(el('div', 'h-meta',
        `${entriesOf(k).length} kayıt · hedefin %${Math.round((total / state.goal) * 100)}'i`));

      const right = el('div', 'h-amt');
      right.innerHTML = `${nf.format(total)} <small>ml</small>`;

      const barWrap = el('div', 'h-bar');
      const fill = el('i');
      fill.style.width = `${pct}%`;
      barWrap.append(fill);

      li.append(left, right, barWrap);
      const pick = () => {
        selectedDate = k;
        $('#dateInput').value = k;
        renderDayLog();
        renderHistory();
        $('#dayLogTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      li.addEventListener('click', pick);
      li.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); }
      });
      list.append(li);
    });

    $('#moreBtn').hidden = keys.length <= historyLimit;
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------- Tema ---------- */
  function applyTheme() {
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = state.theme === 'dark' || (state.theme === 'auto' && sysDark);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }

  /* ---------- Olaylar ---------- */
  $('#addForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#amountInput');
    const amount = Number(input.value);
    if (!amount || amount <= 0) {
      toast('Geçerli bir miktar gir.');
      input.focus();
      return;
    }
    selectedDate = $('#dateInput').value || keyOf(new Date());
    if (addWater(amount, selectedDate)) {
      input.value = '';
      toast(`${nf.format(Math.round(amount))} ml eklendi 💧`);
      render();
    }
  });

  $('#dateInput').addEventListener('change', (e) => {
    selectedDate = e.target.value || keyOf(new Date());
    renderDayLog();
    renderHistory();
  });

  $('#undoBtn').addEventListener('click', () => {
    if (!lastAdded) return;
    removeEntry(lastAdded.dayKey, lastAdded.id);
    lastAdded = null;
    toast('Son ekleme geri alındı.');
    render();
  });

  $('#moreBtn').addEventListener('click', () => {
    historyLimit += 15;
    renderHistory();
  });

  document.querySelectorAll('.seg').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.seg').forEach((b) => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      chartRange = btn.dataset.range;
      renderChart();
    });
  });

  $('#themeBtn').addEventListener('click', () => {
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = document.documentElement.dataset.theme === 'dark';
    state.theme = isDark ? (sysDark ? 'light' : 'auto') : (sysDark ? 'auto' : 'dark');
    save();
    applyTheme();
  });

  /* Ayarlar */
  const dlg = $('#settingsDlg');
  $('#settingsBtn').addEventListener('click', () => {
    $('#goalInput').value = state.goal;
    $('#presetInput').value = state.presets.join(', ');
    dlg.showModal();
  });

  $('#saveSettings').addEventListener('click', () => {
    const goal = Number($('#goalInput').value);
    if (goal >= 200 && goal <= 10000) state.goal = Math.round(goal);
    const presets = $('#presetInput').value
      .split(',')
      .map((s) => Math.round(Number(s.trim())))
      .filter((n) => Number.isFinite(n) && n > 0 && n <= 5000)
      .slice(0, 6);
    if (presets.length) state.presets = presets;
    save();
    render();
    toast('Ayarlar kaydedildi.');
  });

  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `su-takibi-${keyOf(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || !data.days) throw new Error('bad');
      state = {
        goal: Number(data.goal) > 0 ? Number(data.goal) : state.goal,
        presets: Array.isArray(data.presets) && data.presets.length ? data.presets.map(Number) : state.presets,
        theme: data.theme || state.theme,
        days: data.days,
      };
      save();
      applyTheme();
      render();
      toast('Veriler içe aktarıldı.');
      dlg.close();
    } catch (err) {
      toast('Dosya okunamadı.');
    }
    e.target.value = '';
  });

  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Tüm su kayıtların silinecek. Emin misin?')) return;
    state = structuredClone(DEFAULTS);
    localStorage.removeItem(KEY);
    lastAdded = null;
    selectedDate = keyOf(new Date());
    $('#dateInput').value = selectedDate;
    applyTheme();
    render();
    toast('Tüm veriler silindi.');
    dlg.close();
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

  /* Gece yarısını geçince "bugün" güncellensin */
  setInterval(() => {
    const t = keyOf(new Date());
    if ($('#todayLabel').textContent !== fmtLong(t)) {
      selectedDate = t;
      $('#dateInput').value = t;
      render();
    }
  }, 60000);

  /* ---------- Başlat ---------- */
  const di = $('#dateInput');
  di.max = keyOf(new Date());
  di.value = selectedDate;
  applyTheme();
  render();
})();
