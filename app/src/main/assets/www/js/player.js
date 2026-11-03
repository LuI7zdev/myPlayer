/* player.js — motor de reprodução (HTML5 Audio) + Media Session */
(function () {
  'use strict';
  const a = new Audio();
  a.preload = 'auto';
  let url = null, errs = 0, lastPos = 0;

  const P = {
    audio: a, queue: [], index: -1, shuffle: false, repeat: 'off', hist: [], fn: [],
    on(f) { this.fn.push(f); },
    emit(t, x) { this.fn.forEach(f => { try { f(t, x); } catch (e) { console.error(e); } }); },
    get current() { return MP.library.get(this.queue[this.index]) || null; },
    get playing() { return !a.paused && !a.ended; },

    init() {
      const S = MP.storage;
      this.shuffle = !!S.pref('shuffle', false);
      this.repeat = S.pref('repeat', 'off');
      a.volume = Math.min(1, Math.max(0, S.pref('vol', 0.8)));
      this.bindSession();
      this.emit('mode');
    },
    restore() { // restaura a última música (pausada)
      const s = MP.library.get(MP.storage.pref('last', null));
      if (!s || this.current) return;
      this.queue = MP.library.songs.slice().sort(MP.library.byTitle).map(x => x.id);
      this.index = this.queue.indexOf(s.id);
      this.load(this.index, false);
    },
    setQueue(ids, startId) {
      this.queue = ids.slice(); this.hist = [];
      const i = this.queue.indexOf(startId);
      if (i >= 0) this.load(i, true);
    },
    async load(i, play) {
      const s = MP.library.get(this.queue[i]);
      if (!s || (!s.file && !s.url)) { this.index = i; return this.fail('Arquivo não encontrado'); }
      this.index = i;
      const old = url; url = null;
      if (s.url) a.src = s.url; // arquivo do aparelho (Android)
      else { url = URL.createObjectURL(s.file); a.src = url; }
      if (old) URL.revokeObjectURL(old);
      MP.storage.setPref('last', s.id);
      this.session(s); this.emit('track');
      if (play) await this.play();
    },
    async play() {
      if (!a.getAttribute('src')) return;
      try { await a.play(); } catch (e) { if (e && e.name !== 'AbortError') this.fail('Não foi possível reproduzir'); }
    },
    toggle() { if (a.paused) this.play(); else a.pause(); },
    next(auto) {
      const n = this.queue.length; if (!n) return;
      let i;
      if (this.shuffle && n > 1) { do { i = Math.floor(Math.random() * n); } while (i === this.index); }
      else {
        i = this.index + 1;
        if (i >= n) {
          if (this.repeat === 'all' || !auto) i = 0;
          else { a.pause(); a.currentTime = 0; this.emit('state'); return; }
        }
      }
      if (this.index >= 0) this.hist.push(this.index);
      if (this.hist.length > 100) this.hist.shift();
      this.load(i, true);
    },
    prev() {
      const n = this.queue.length; if (!n) return;
      if (a.currentTime > 3) { a.currentTime = 0; return; }
      let i = this.hist.length ? this.hist.pop() : (this.index - 1 + n) % n;
      if (i >= n) i = 0;
      this.load(i, true);
    },
    seek(t) { if (isFinite(a.duration)) a.currentTime = Math.max(0, Math.min(a.duration, t)); },
    setVolume(v) { a.volume = Math.min(1, Math.max(0, v)); MP.storage.setPref('vol', a.volume); },
    toggleShuffle() { this.shuffle = !this.shuffle; MP.storage.setPref('shuffle', this.shuffle); this.emit('mode'); },
    cycleRepeat() { this.repeat = { off: 'all', all: 'one', one: 'off' }[this.repeat]; MP.storage.setPref('repeat', this.repeat); this.emit('mode'); },
    ended() { if (this.repeat === 'one') { a.currentTime = 0; this.play(); } else this.next(true); },
    fail(msg) {
      const s = this.current;
      this.emit('error', (msg || 'Erro de reprodução') + (s ? ': ' + s.title : ''));
      errs++;
      if (this.queue.length > 1 && errs < this.queue.length) setTimeout(() => this.next(true), 700);
      else { a.pause(); errs = 0; }
    },
    removeId(id) { // música excluída da biblioteca
      const cur = this.queue[this.index];
      this.queue = this.queue.filter(x => x !== id); this.hist = [];
      if (cur === id) {
        a.pause(); a.removeAttribute('src'); a.load();
        if (url) { URL.revokeObjectURL(url); url = null; }
        this.index = -1; this.emit('track'); this.emit('state');
      } else this.index = this.queue.indexOf(cur);
    },
    /* Media Session: controles na notificação/tela bloqueada (depende do WebView) */
    session(s) {
      if (!('mediaSession' in navigator) || !s) return;
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: s.title, artist: s.artist, album: s.album || 'MyPlayer',
          artwork: [{ src: MP.library.coverUrl(s), sizes: '512x512' }]
        });
      } catch (e) { /* ignora */ }
    },
    bindSession() {
      if (!('mediaSession' in navigator)) return;
      const set = (n, f) => { try { navigator.mediaSession.setActionHandler(n, f); } catch (e) { /* não suportado */ } };
      set('play', () => this.play()); set('pause', () => a.pause());
      set('previoustrack', () => this.prev()); set('nexttrack', () => this.next());
      set('seekto', d => { if (d && d.seekTime != null) this.seek(d.seekTime); });
    }
  };

  a.addEventListener('play', () => { P.emit('state'); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; });
  a.addEventListener('pause', () => { P.emit('state'); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; });
  a.addEventListener('playing', () => { errs = 0; });
  a.addEventListener('loadedmetadata', () => P.emit('time'));
  a.addEventListener('ended', () => P.ended());
  a.addEventListener('seeked', () => P.emit('state'));
  a.addEventListener('error', () => { if (a.getAttribute('src')) P.fail('Erro ao decodificar o áudio'); });
  a.addEventListener('timeupdate', () => {
    P.emit('time');
    const now = Date.now();
    if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && now - lastPos > 1000 && isFinite(a.duration) && a.duration > 0) {
      lastPos = now;
      try { navigator.mediaSession.setPositionState({ duration: a.duration, position: Math.min(a.currentTime, a.duration), playbackRate: a.playbackRate }); } catch (e) { /* ignora */ }
    }
  });

  window.MP = window.MP || {};
  MP.player = P;
})();
