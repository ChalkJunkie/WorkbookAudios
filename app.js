(function () {
  'use strict';

  var data = window.AUDIO_DATA || [];
  var root = document.getElementById('sections');
  var player = document.getElementById('player');
  var audio = document.getElementById('audio');
  var whereEl = document.getElementById('player-where');
  var titleEl = document.getElementById('player-title');
  var current = null; // aktuell gewählter Button
  var seek = document.getElementById('seek');
  var timeNow = document.getElementById('time-now');
  var timeTotal = document.getElementById('time-total');
  var btnPlay = document.getElementById('btn-play');
  var seeking = false;
  // Offline-Speicherung (siehe unten)
  var AUDIO_CACHE = 'audio-v1';
  var canOffline = 'serviceWorker' in navigator && 'caches' in window;
  var bars = [];
  var msgEl = document.getElementById('player-msg');

  // Farben wie im Inhaltsverzeichnis des Schülerbuchs
  // (MyBook hat dort keine eigene Farbe, daher ein neutrales Grau)
  var COLORS = {
    mybook: '#6f6765',
    herewego: '#00558c',
    unit1: '#f36624',
    unit2: '#00b3b0',
    unit3: '#7e3f98',
    unit4: '#74bf43',
    unit5: '#e11057'
  };

  var ICONS =
    '<svg class="play" viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>' +
    '<svg class="pause" viewBox="0 0 24 24"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/></svg>';

  // Welche Bereiche aufgeklappt sind, merkt sich das iPad.
  var STORE_KEY = 'open-sections';
  function loadOpen() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }
  function saveOpen() {
    try {
      var ids = Array.prototype.map.call(document.querySelectorAll('details.section[open]'), function (d) { return d.id; });
      localStorage.setItem(STORE_KEY, JSON.stringify(ids));
    } catch (e) { /* egal */ }
  }
  var openIds = loadOpen();

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  data.forEach(function (section) {
    var det = el('details', 'section');
    det.id = section.id;
    if (COLORS[section.id]) det.style.setProperty('--c', COLORS[section.id]);
    if (openIds.indexOf(section.id) !== -1) det.open = true;

    var sum = el('summary');
    sum.appendChild(el('span', 'chev'));
    var names = el('span');
    names.appendChild(el('span', 'sec-name', section.name));
    if (section.subtitle) {
      names.appendChild(document.createElement('br'));
      names.appendChild(el('span', 'sec-sub', section.subtitle));
    }
    sum.appendChild(names);
    var n = section.tracks.length;
    sum.appendChild(el('span', 'sec-count', n + (n === 1 ? ' Audio' : ' Audios')));
    det.appendChild(sum);

    var pages = el('div', 'pages');
    pages.appendChild(makeOfflineBar(section));
    var lastPage = null;
    section.tracks.forEach(function (t) {
      if (t.page !== lastPage) {
        pages.appendChild(el('h3', 'page-head', 'Seite ' + t.page));
        lastPage = t.page;
      }
      var btn = el('button', 'track');
      btn.type = 'button';
      btn.setAttribute('data-url', t.url);
      var icon = el('span', 'icon');
      icon.innerHTML = ICONS;
      btn.appendChild(icon);
      var txt = el('span');
      txt.appendChild(el('span', 'ex', t.exercise));
      txt.appendChild(el('span', 'title', t.title));
      btn.appendChild(txt);
      btn.appendChild(el('span', 'saved-mark', '✓ offline'));
      btn.addEventListener('click', function () { play(btn, section, t); });
      pages.appendChild(btn);
    });
    det.appendChild(pages);
    det.addEventListener('toggle', saveOpen);
    root.appendChild(det);
  });

  function play(btn, section, t) {
    // Gleiche Übung nochmal antippen = Pause / weiter
    if (current === btn) {
      if (audio.paused) audio.play(); else audio.pause();
      return;
    }
    if (current) current.classList.remove('playing', 'is-playing');
    current = btn;
    btn.classList.add('playing');
    msgEl.hidden = true;
    audio.src = t.url;
    whereEl.textContent = section.name + ' · S. ' + t.page + ' · ' + t.exercise;
    titleEl.textContent = t.title;
    player.style.setProperty('--c', COLORS[section.id] || '');
    player.hidden = false;
    setTime(0, 0);
    audio.play().catch(function () { /* Nutzer kann im Player auf Play tippen */ });
  }

  function setPlaying(on) {
    if (current) current.classList.toggle('is-playing', on);
    player.classList.toggle('is-playing', on);
    btnPlay.setAttribute('aria-label', on ? 'Pause' : 'Abspielen');
  }
  audio.addEventListener('play', function () { setPlaying(true); });
  audio.addEventListener('pause', function () { setPlaying(false); });
  audio.addEventListener('ended', function () { setPlaying(false); });
  audio.addEventListener('error', function () {
    setPlaying(false);
    var saved = current && current.classList.contains('saved');
    msgEl.textContent = navigator.onLine
      ? 'Das Audio konnte nicht geladen werden.'
      : saved
        ? 'Dieses Gerät kann das gespeicherte Audio ohne Internet leider nicht abspielen.'
        : 'Kein Internet – dieses Audio ist nicht offline gespeichert.';
    msgEl.hidden = false;
  });

  // Wiedergabegeschwindigkeit bleibt immer bei 1x.
  audio.addEventListener('ratechange', function () {
    if (audio.playbackRate !== 1) audio.playbackRate = 1;
  });

  // --- Große Bedienknöpfe ---
  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0;
    s = Math.floor(s);
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function setTime(now, total) {
    timeNow.textContent = fmt(now);
    timeTotal.textContent = fmt(total);
    seek.max = total || 0;
    if (!seeking) seek.value = now;
    var pct = total ? (seek.value / total) * 100 : 0;
    seek.style.setProperty('--p', pct + '%');
  }
  function refresh() { setTime(audio.currentTime, audio.duration); }
  audio.addEventListener('timeupdate', refresh);
  audio.addEventListener('loadedmetadata', refresh);
  audio.addEventListener('durationchange', refresh);

  seek.addEventListener('input', function () {
    seeking = true;
    timeNow.textContent = fmt(seek.value);
    seek.style.setProperty('--p', (audio.duration ? seek.value / audio.duration * 100 : 0) + '%');
  });
  seek.addEventListener('change', function () {
    seeking = false;
    audio.currentTime = Number(seek.value);
  });

  btnPlay.addEventListener('click', function () {
    if (!audio.src) return;
    if (audio.paused) audio.play(); else audio.pause();
  });
  function skip(sec) {
    if (!audio.src || !isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + sec));
  }
  document.getElementById('btn-back').addEventListener('click', function () { skip(-10); });
  document.getElementById('btn-fwd').addEventListener('click', function () { skip(10); });
  // =====================================================================
  // Offline-Speicherung (Test). Die Audios landen im internen Speicher
  // der WebApp (Cache "audio-v1"), nicht in einem sichtbaren Ordner.
  // =====================================================================

  if (canOffline) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* egal */ });
  }

  function makeOfflineBar(section) {
    var bar = el('div', 'offline-bar');
    if (!canOffline) { bar.hidden = true; return bar; }
    var main = el('button', 'offline-btn');
    main.type = 'button';
    var info = el('span', 'offline-info');
    var del = el('button', 'offline-del', 'Entfernen');
    del.type = 'button';
    bar.appendChild(main); bar.appendChild(info); bar.appendChild(del);
    var state = { section: section, main: main, info: info, del: del, busy: false };
    main.addEventListener('click', function () { if (!state.busy) saveSection(state); });
    del.addEventListener('click', function () { if (!state.busy) removeSection(state); });
    bars.push(state);
    return bar;
  }

  function cachedUrls() {
    return caches.open(AUDIO_CACHE).then(function (c) { return c.keys(); })
      .then(function (reqs) {
        var set = {};
        reqs.forEach(function (r) { set[r.url] = true; });
        return set;
      });
  }

  function updateAll() {
    if (!canOffline) return Promise.resolve();
    return cachedUrls().then(function (set) {
      Array.prototype.forEach.call(document.querySelectorAll('.track'), function (b) {
        b.classList.toggle('saved', !!set[b.getAttribute('data-url')]);
      });
      bars.forEach(function (st) { if (!st.busy) renderBar(st, set); });
      updateOnline();
    });
  }

  function renderBar(st, set) {
    var tracks = st.section.tracks;
    var have = tracks.filter(function (t) { return set[t.url]; }).length;
    var all = tracks.length;
    st.main.disabled = false;
    st.main.classList.toggle('done', have === all);
    if (have === all) {
      st.main.textContent = '✓ Offline gespeichert';
      st.main.disabled = true;
      st.info.textContent = '';
    } else if (have > 0) {
      st.main.textContent = '⬇ Rest offline speichern';
      st.info.textContent = have + ' von ' + all + ' gespeichert';
    } else {
      st.main.textContent = '⬇ Für offline speichern';
      st.info.textContent = '';
    }
    st.del.hidden = have === 0;
  }

  function saveSection(st) {
    if (!navigator.onLine) { st.info.textContent = 'Zum Speichern wird Internet benötigt.'; return; }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
    st.busy = true;
    st.main.disabled = true;
    st.del.hidden = true;
    var done = 0, failed = 0, total = st.section.tracks.length;
    function show() { st.main.textContent = 'Wird gespeichert … ' + done + ' / ' + total; }
    show();
    caches.open(AUDIO_CACHE).then(function (cache) {
      return cachedUrls().then(function (set) {
        var queue = st.section.tracks.slice();
        function next() {
          var t = queue.shift();
          if (!t) return Promise.resolve();
          var job = set[t.url] ? Promise.resolve() :
            fetchAudio(t.url).then(function (res) { return cache.put(t.url, res); })
              .catch(function () { failed++; });
          return job.then(function () { done++; show(); return next(); });
        }
        return Promise.all([next(), next(), next()]); // drei gleichzeitig
      });
    }).catch(function () { failed = total; }).then(function () {
      st.busy = false;
      return updateAll().then(function () {
        if (failed) st.info.textContent = failed + ' Audio(s) konnten nicht gespeichert werden.';
      });
    });
  }

  // Cornelsen leitet jede Audio-Adresse auf seinen Speicherserver weiter.
  // Eine weitergeleitete Antwort lässt sich offline nicht abspielen, daher wird
  // die Datei direkt dort abgeholt (und nur im Notfall über die Weiterleitung).
  var STORAGE_HOST = 'https://webcodes-data-prod.obs-website.eu-de.otc.t-systems.com';
  function fetchAudio(url) {
    var direct = url.replace('https://codes.cornelsen.de', STORAGE_HOST);
    return fetch(direct, { mode: 'no-cors' }).catch(function () {
      return fetch(url, { mode: 'no-cors' });
    });
  }

  function removeSection(st) {
    caches.open(AUDIO_CACHE).then(function (cache) {
      return Promise.all(st.section.tracks.map(function (t) { return cache.delete(t.url); }));
    }).then(updateAll);
  }

  // Hinweis oben, wenn kein Internet da ist
  var banner = document.getElementById('offline-banner');
  function updateOnline() {
    var off = !navigator.onLine;
    banner.hidden = !off;
    document.body.classList.toggle('is-offline', off);
  }
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();
  updateAll();
})();
