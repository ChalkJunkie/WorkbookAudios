(function () {
  'use strict';

  var data = window.AUDIO_DATA || [];
  var root = document.getElementById('sections');
  var player = document.getElementById('player');
  var audio = document.getElementById('audio');
  var whereEl = document.getElementById('player-where');
  var titleEl = document.getElementById('player-title');
  var current = null; // aktuell gewählter Button

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
    player.hidden = false;
    audio.play().catch(function () { /* Nutzer kann im Player auf Play tippen */ });
  }

  audio.addEventListener('play', function () { if (current) current.classList.add('is-playing'); });
  audio.addEventListener('pause', function () { if (current) current.classList.remove('is-playing'); });
  audio.addEventListener('ended', function () { if (current) current.classList.remove('is-playing'); });
})();
