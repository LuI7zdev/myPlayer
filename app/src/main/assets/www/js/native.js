/* native.js — ponte opcional com o app Android: lê músicas do aparelho (MediaStore),
   capas embutidas e controles na notificação. No navegador comum, N.available = false. */
(function () {
  'use strict';
  const A = window.Android, L = MP.library, P = MP.player;
  const toUrl = p => 'file://' + p.split('/').map(encodeURIComponent).join('/');
  const N = {
    available: !!(A && A.requestScan), scanning: false, active: false, hooks: {},
    scan() { A.requestScan(); },
    ready() { // chamado pelo Android quando a varredura termina
      let raw = []; try { raw = JSON.parse(A.getSongs()); } catch (e) { /* lista vazia */ }
      const favs = new Set(MP.storage.pref('favs', []));
      L.setNative(raw.map(x => ({
        id: 'n' + x.id, title: x.title, artist: x.artist, album: x.album, duration: x.dur / 1000, added: x.added * 1000,
        fav: favs.has('n' + x.id), url: toUrl(x.path), cover: null, coverUrl: '', coverPath: ''
      })));
      if (N.hooks.loaded) N.hooks.loaded(raw.length);
      A.loadCovers();
    },
    covers(map) { // lote de capas extraídas: { idOriginal: caminhoDoArquivo }
      Object.keys(map).forEach(k => {
        const s = L.get('n' + k); if (!s) return;
        s.coverPath = map[k]; s.coverUrl = toUrl(map[k]); if (N.hooks.cover) N.hooks.cover(s);
      });
    },
    denied() { if (N.hooks.denied) N.hooks.denied(); },
    cmd(c) { // comandos vindos da notificação / tela de bloqueio / fone
      if (c === 'play') P.play(); else if (c === 'pause') P.audio.pause(); else if (c === 'toggle') P.toggle();
      else if (c === 'next') P.next(); else if (c === 'prev') P.prev(); else if (c.indexOf('seek:') === 0) P.seek(parseFloat(c.slice(5)));
    },
    sync() { // envia estado atual para a notificação
      if (!N.available || !A.media) return;
      const c = P.current;
      if (!c) { if (N.active) { N.active = false; try { A.stopMedia(); } catch (e) { /* ignora */ } } return; }
      if (!N.active && !P.playing) return;
      N.active = true;
      const a = P.audio, d = isFinite(a.duration) && a.duration > 0 ? a.duration : c.duration;
      try { A.media(c.title, c.artist, c.coverPath || '', P.playing, Math.round(a.currentTime * 1000), Math.round(d * 1000)); } catch (e) { /* ignora */ }
    }
  };
  MP.native = N;
})();
