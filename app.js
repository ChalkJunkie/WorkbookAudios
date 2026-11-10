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
    var lastPage = null;
    section.tracks.forEach(function (t) {
      if (t.page !== lastPage) {
        pages.appendChild(el('h3', 'page-head', 'Seite ' + t.page));
        lastPage = t.page;
      }
      var btn = el('button', 'track');
      btn.type = 'button';
      var icon = el('span', 'icon');
      icon.innerHTML = ICONS;
      btn.appendChild(icon);
      var txt = el('span');
      txt.appendChild(el('span', 'ex', t.exercise));
      txt.appendChild(el('span', 'title', t.title));
      btn.appendChild(txt);
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
})();
