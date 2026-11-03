/* app.js — interface, navegação e ligação entre os módulos */
(function () {
  'use strict';
  const S = MP.storage, L = MP.library, P = MP.player, PL = MP.playlists, N = MP.native;
  const $ = s => document.querySelector(s), $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
  const el = { sheet: $('#sheet'), player: $('#player'), view: $('#view') };
  const D = {
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    lib: 'M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5a2.5 2.5 0 1 1-2.5-2.5c.4 0 .7.1 1 .2V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z',
    pls: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z',
    heart: 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z',
    heartOn: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    play: 'M8 5v14l11-7z', pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
    next: 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z', prev: 'M6 6h2v12H6zm3.5 6l8.5 6V6z',
    shuffle: 'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z',
    repeat: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z',
    repeat1: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z',
    vol: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z',
    more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z', down: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
    note: 'M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z',
    gear: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z'
  };
  const ic = n => '<svg viewBox="0 0 24 24"><path d="' + D[n] + '"/></svg>';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = t => { if (!isFinite(t) || t < 0) t = 0; t = Math.floor(t); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  const rng = e => e.style.setProperty('--p', ((e.value - e.min) / (e.max - e.min) * 100) + '%');
  const ACC = [{ n: 'Violeta', a: '#8b5cf6', b: '#c084fc' }, { n: 'Roxo', a: '#a855f7', b: '#e879f9' }, { n: 'Índigo', a: '#6366f1', b: '#a78bfa' }];
  const st = { tab: 'home', q: '', sort: S.pref('sort', 'az'), pl: null };
  let seeking = false, toastT = null;

  /* ---------- listas ---------- */
  function libList() {
    let l = L.songs.slice(); const q = st.q.trim().toLowerCase();
    if (q) l = l.filter(s => (s.title + ' ' + s.artist + ' ' + s.album).toLowerCase().indexOf(q) >= 0);
    if (st.sort === 'az') l.sort(L.byTitle); else if (st.sort === 'za') l.sort((a, b) => L.byTitle(b, a)); else l.sort((a, b) => b.added - a.added);
    return l;
  }
  const favList = () => L.songs.filter(s => s.fav).sort(L.byTitle);
  const recent = () => L.songs.slice().sort((a, b) => b.added - a.added).slice(0, 12);
  const plSongs = p => p.songs.map(id => L.get(id)).filter(Boolean);
  function ctxList(c) {
    if (c === 'lib') return libList(); if (c === 'fav') return favList(); if (c === 'recent') return recent();
    if (c && c.indexOf('pl:') === 0) { const p = PL.get(c.slice(3)); return p ? plSongs(p) : []; }
    return [];
  }

  /* ---------- views ---------- */
  const cover = s => esc(L.coverUrl(s));
  function row(s, ctx) {
    return '<div class="row" data-act="play" data-id="' + s.id + '" data-ctx="' + ctx + '"><img class="cv" data-sid="' + s.id + '" src="' + cover(s) + '" alt="">' +
      '<div class="meta"><b>' + esc(s.title) + '</b><span>' + esc(s.artist) + '</span></div><span class="dur">' + fmt(s.duration) + '</span>' +
      '<button class="ib fv ' + (s.fav ? 'on' : '') + '" data-act="fav" data-id="' + s.id + '" aria-label="Favoritar">' + ic(s.fav ? 'heartOn' : 'heart') + '</button>' +
      '<button class="ib" data-act="more" data-id="' + s.id + '" data-ctx="' + ctx + '" aria-label="Mais opções">' + ic('more') + '</button></div>';
  }
  const empty = (t, d, btn) => '<div class="empty">' + ic('note') + '<h3>' + t + '</h3><p>' + d + '</p>' + (btn ? '<button class="btn" data-act="import">' + ic('plus') + (N.available ? 'Buscar novamente' : 'Importar músicas') + '</button>' : '') + '</div>';
  function emptyLib() {
    if (N.available) return N.scanning ? empty('Buscando suas músicas…', 'Isso leva alguns segundos.') : empty('Nenhuma música encontrada', 'Verifique a permissão de acesso ao áudio do aparelho.', true);
    return empty('Sua biblioteca está vazia', 'Importe músicas do seu dispositivo.', true);
  }
  const card = (s, ctx) => '<div class="card" data-act="play" data-id="' + s.id + '" data-ctx="' + ctx + '"><img data-sid="' + s.id + '" src="' + cover(s) + '" alt=""><b>' + esc(s.title) + '</b><span>' + esc(s.artist) + '</span></div>';
  const sec = (t, inner) => '<div class="sec"><h2>' + t + '</h2></div>' + inner;
  const plCover = p => { const l = plSongs(p); return cover(l[0]); };

  function vHome() {
    const h = new Date().getHours(), g = h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite', n = S.pref('name', '');
    let o = '<div class="top"><div><p class="mu">O que vamos ouvir hoje?</p><h1>' + g + (n ? ', ' + esc(n) : '') + '</h1></div><button class="ib" data-act="settings" aria-label="Configurações">' + ic('gear') + '</button></div>';
    const c = P.current;
    if (c) o += '<div class="now" data-act="openplayer"><img class="cv" data-sid="' + c.id + '" src="' + cover(c) + '" alt=""><div class="meta"><span>Tocando agora</span><b>' + esc(c.title) + '</b><span>' + esc(c.artist) + '</span></div><button class="ib" data-act="toggle">' + ic(P.playing ? 'pause' : 'play') + '</button></div>';
    o += '<div class="qa"><div class="tile" data-act="gotolib">' + ic('lib') + 'Biblioteca (' + L.songs.length + ')</div><div class="tile" data-act="import">' + ic('plus') + (N.available ? 'Atualizar' : 'Importar') + '</div></div>';
    if (!L.songs.length) return o + emptyLib();
    o += sec('Adicionadas recentemente', '<div class="hs">' + recent().map(s => card(s, 'recent')).join('') + '</div>');
    const f = favList();
    if (f.length) o += sec('Favoritas', '<div class="hs">' + f.slice(0, 12).map(s => card(s, 'fav')).join('') + '</div>');
    if (PL.list.length) o += sec('Playlists', '<div class="hs">' + PL.list.map(p => '<div class="card" data-act="openpl" data-id="' + p.id + '"><img src="' + plCover(p) + '" alt=""><b>' + esc(p.name) + '</b><span>' + p.songs.length + ' música(s)</span></div>').join('') + '</div>');
    return o;
  }
  function libRows() {
    if (!L.songs.length) return emptyLib();
    const l = libList(); return l.length ? l.map(s => row(s, 'lib')).join('') : empty('Nada encontrado', 'Tente outro termo de busca.');
  }
  function vLib() {
    return '<div class="top"><h1>Biblioteca</h1><button class="ib acc" data-act="import" aria-label="Importar">' + ic('plus') + '</button></div>' +
      '<div class="tools"><input id="qs" class="txt" type="search" placeholder="Buscar música ou artista" value="' + esc(st.q) + '"><button class="chip" data-act="sort">' + { az: 'A–Z', za: 'Z–A', rc: 'Recentes' }[st.sort] + '</button></div><div id="libList">' + libRows() + '</div>';
  }
  function vFav() {
    const l = favList();
    return '<div class="top"><h1>Favoritos</h1></div>' + (l.length ? '<div class="btns" style="margin-top:0"><button class="btn" data-act="favplay">' + ic('play') + 'Reproduzir favoritos</button></div>' + l.map(s => row(s, 'fav')).join('') : empty('Nenhum favorito', 'Toque no coração de uma música para favoritá-la.'));
  }
  function vPls() {
    if (st.pl) { const p = PL.get(st.pl); if (p) return vPlDetail(p); st.pl = null; }
    return '<div class="top"><h1>Playlists</h1><button class="ib acc" data-act="newpl" aria-label="Nova playlist">' + ic('plus') + '</button></div>' +
      (PL.list.length ? PL.list.map(p => '<div class="row" data-act="openpl" data-id="' + p.id + '"><img class="cv" src="' + plCover(p) + '" alt=""><div class="meta"><b>' + esc(p.name) + '</b><span>' + p.songs.length + ' música(s)</span></div></div>').join('') : empty('Nenhuma playlist', 'Crie sua primeira playlist com o botão +.'));
  }
  function vPlDetail(p) {
    const l = plSongs(p);
    return '<div class="top"><button class="ib bk" data-act="back" aria-label="Voltar">' + ic('down') + '</button><h1>' + esc(p.name) + '</h1><button class="ib" data-act="plmenu" aria-label="Opções">' + ic('more') + '</button></div>' +
      '<p class="mu">' + l.length + ' música(s)</p><div class="btns"><button class="btn" data-act="plplay">' + ic('play') + 'Reproduzir</button><button class="btn ghost" data-act="pladd">' + ic('plus') + 'Adicionar músicas</button></div>' +
      (l.length ? l.map(s => row(s, 'pl:' + p.id)).join('') : empty('Playlist vazia', 'Adicione músicas da sua biblioteca.'));
  }
  function render(keep) {
    const v = el.view, y = keep ? v.scrollTop : 0;
    v.innerHTML = ({ home: vHome, lib: vLib, pls: vPls, fav: vFav })[st.tab]();
    v.scrollTop = y;
    $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === st.tab));
    markCur();
  }
  function markCur() { const c = P.current; $$('.row[data-id]').forEach(r => r.classList.toggle('cur', !!c && r.dataset.id === c.id)); }
  function syncFav() {
    $$('[data-act="fav"]').forEach(b => { const s = L.get(b.dataset.id); if (!s) return; b.classList.toggle('on', s.fav); b.innerHTML = ic(s.fav ? 'heartOn' : 'heart'); });
  }

  /* ---------- sheets / diálogos ---------- */
  function sheet(html, h) {
    el.sheet.innerHTML = '<div class="bk2"></div><div class="box">' + html + '</div>';
    el.sheet.classList.remove('hidden');
    el.sheet.onclick = e => {
      if (e.target.classList.contains('bk2')) { closeSheet(); if (h) h(null); return; }
      const b = e.target.closest('[data-s]'); if (b && h) h(b);
    };
  }
  function closeSheet() { el.sheet.classList.add('hidden'); el.sheet.innerHTML = ''; }
  function ask(title, val, ok) {
    return new Promise(res => {
      sheet('<h3>' + title + '</h3><input id="askIn" class="txt" maxlength="60" value="' + esc(val || '') + '"><div class="btns"><button class="btn ghost" data-s="no">Cancelar</button><button class="btn" data-s="ok">' + ok + '</button></div>', b => {
        const v = $('#askIn') ? $('#askIn').value.trim() : ''; closeSheet(); res(b && b.dataset.s === 'ok' ? v : null);
      });
      const i = $('#askIn'); i.focus(); i.onkeydown = e => { if (e.key === 'Enter') { const v = i.value.trim(); closeSheet(); res(v); } };
    });
  }
  function sure(msg, ok) {
    return new Promise(res => sheet('<h3>' + msg + '</h3><div class="btns"><button class="btn ghost" data-s="no">Cancelar</button><button class="btn" data-s="ok">' + ok + '</button></div>', b => { closeSheet(); res(!!b && b.dataset.s === 'ok'); }));
  }
  function toast(m, ms) {
    const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms || 2600);
  }
  const fail = e => toast((e && e.message) || 'Ocorreu um erro');

  async function toggleFav(id) { await L.toggleFav(id); syncFav(); if (st.tab !== 'lib') render(true); }

  function songMenu(id, ctx) {
    const s = L.get(id); if (!s) return; const inPl = ctx && ctx.indexOf('pl:') === 0;
    sheet('<h3>' + esc(s.title) + '</h3><button class="it" data-s="fav">' + (s.fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos') + '</button><button class="it" data-s="addpl">Adicionar à playlist</button>' +
      (inPl ? '<button class="it" data-s="rm">Remover desta playlist</button>' : '') + '' + (N.available ? '' : '<button class="it danger" data-s="del">Excluir da biblioteca</button>') + '', async b => {
      if (!b) return; const a = b.dataset.s; closeSheet();
      try {
        if (a === 'fav') await toggleFav(id);
        else if (a === 'addpl') pickPl([id]);
        else if (a === 'rm') { await PL.removeSong(ctx.slice(3), id); render(true); }
        else if (a === 'del' && await sure('Excluir "' + esc(s.title) + '" da biblioteca?', 'Excluir')) {
          P.removeId(id); await L.remove(id); await PL.prune(); render(true); toast('Música excluída');
        }
      } catch (e) { fail(e); }
    });
  }
  function pickPl(ids) {
    sheet('<h3>Adicionar à playlist</h3>' + PL.list.map(p => '<button class="it" data-s="' + p.id + '">' + esc(p.name) + ' <span class="mu">· ' + p.songs.length + '</span></button>').join('') + '<button class="it" data-s="new">+ Nova playlist</button>', async b => {
      if (!b) return; const k = b.dataset.s; closeSheet();
      try {
        let p; if (k === 'new') { const n = await ask('Nova playlist', '', 'Criar'); if (!n) return; p = await PL.create(n); } else p = PL.get(k);
        const c = await PL.addSongs(p.id, ids); toast(c ? 'Adicionada a "' + p.name + '"' : 'Já está na playlist'); render(true);
      } catch (e) { fail(e); }
    });
  }
  function pickSongs(p) {
    const l = L.songs.filter(s => p.songs.indexOf(s.id) < 0).sort(L.byTitle);
    if (!l.length) return toast(L.songs.length ? 'Todas as músicas já estão na playlist' : 'Importe músicas primeiro');
    sheet('<h3>Adicionar músicas</h3>' + l.map(s => '<label class="pk"><input type="checkbox" value="' + s.id + '"><div class="meta"><b>' + esc(s.title) + '</b><span>' + esc(s.artist) + '</span></div></label>').join('') + '<div class="btns"><button class="btn" data-s="ok">Adicionar selecionadas</button></div>', async b => {
      if (!b) return; const ids = $$('#sheet input:checked').map(i => i.value); closeSheet();
      try { if (ids.length) { await PL.addSongs(p.id, ids); render(true); toast(ids.length + ' música(s) adicionada(s)'); } } catch (e) { fail(e); }
    });
  }
  function applyAccent() { const c = ACC[S.pref('accent', 0)] || ACC[0], r = document.documentElement.style; r.setProperty('--ac', c.a); r.setProperty('--ac2', c.b); }
  function settings() {
    sheet('<h3>Configurações</h3><button class="it" data-s="name">Seu nome: ' + esc(S.pref('name', '') || '—') + '</button><button class="it" data-s="ac">Cor do tema: ' + ACC[S.pref('accent', 0)].n + '</button>' + (N.available ? '' : '<button class="it danger" data-s="wipe">Apagar toda a biblioteca</button>') + '<p class="mu" style="padding:8px">MyPlayer 1.0 · 100% offline</p>', async b => {
      if (!b) return; const a = b.dataset.s; closeSheet();
      try {
        if (a === 'name') { const n = await ask('Como devemos te chamar?', S.pref('name', ''), 'Salvar'); if (n !== null) { S.setPref('name', n); render(true); } }
        else if (a === 'ac') { S.setPref('accent', (S.pref('accent', 0) + 1) % ACC.length); applyAccent(); settings(); }
        else if (a === 'wipe' && await sure('Apagar todas as músicas importadas?', 'Apagar')) {
          L.songs.map(s => s.id).forEach(id => P.removeId(id)); await L.clear(); await PL.prune(); render(); toast('Biblioteca apagada');
        }
      } catch (e) { fail(e); }
    });
  }

  /* ---------- ações ---------- */
  const A = {
    play(d) { const l = ctxList(d.ctx); P.setQueue(l.map(s => s.id), d.id); },
    fav(d) { toggleFav(d.id).catch(fail); },
    more(d) { songMenu(d.id, d.ctx); },
    import() { if (N.available) { N.scanning = true; N.scan(); toast('Buscando músicas…'); return render(true); }
      if (!S.ready) return toast('Armazenamento indisponível neste dispositivo'); $('#file').click(); },
    sort() { st.sort = st.sort === 'az' ? 'za' : st.sort === 'za' ? 'rc' : 'az'; S.setPref('sort', st.sort); render(true); },
    toggle() { P.toggle(); }, next() { P.next(); }, prev() { P.prev(); },
    shuffle() { P.toggleShuffle(); }, repeat() { P.cycleRepeat(); },
    openplayer() { openPlayer(); }, closeplayer() { if (history.state && history.state.p) history.back(); else closePl(); },
    gotolib() { go('lib'); }, settings,
    favplay() { const l = favList(); if (l.length) P.setQueue(l.map(s => s.id), l[0].id); },
    openpl(d) { st.tab = 'pls'; st.pl = d.id; render(); }, back() { st.pl = null; render(); },
    newpl() { ask('Nova playlist', '', 'Criar').then(n => n ? PL.create(n).then(() => render(true)) : 0).catch(fail); },
    plplay() { const l = plSongs(PL.get(st.pl)); if (!l.length) return toast('Playlist vazia'); P.setQueue(l.map(s => s.id), l[0].id); },
    pladd() { pickSongs(PL.get(st.pl)); },
    plmenu() {
      const p = PL.get(st.pl);
      sheet('<h3>' + esc(p.name) + '</h3><button class="it" data-s="ren">Renomear</button><button class="it danger" data-s="del">Excluir playlist</button>', async b => {
        if (!b) return; const a = b.dataset.s; closeSheet();
        try {
          if (a === 'ren') { const n = await ask('Renomear playlist', p.name, 'Salvar'); if (n) { await PL.rename(p.id, n); render(true); } }
          else if (await sure('Excluir a playlist "' + esc(p.name) + '"?', 'Excluir')) { await PL.remove(p.id); st.pl = null; render(); toast('Playlist excluída'); }
        } catch (e) { fail(e); }
      });
    }
  };
  document.addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (t && A[t.dataset.act]) A[t.dataset.act](t.dataset, t); });
  function go(tab) { st.tab = tab; st.pl = null; render(); }
  $$('#tabs button').forEach(b => b.addEventListener('click', () => go(b.dataset.tab)));
  el.view.addEventListener('input', e => { if (e.target.id === 'qs') { st.q = e.target.value; $('#libList').innerHTML = libRows(); markCur(); } });
  document.addEventListener('error', e => { const i = e.target; if (i && i.tagName === 'IMG' && i.src.indexOf('default-cover') < 0) i.src = L.DEF; }, true);

  /* importação */
  $('#file').addEventListener('change', async e => {
    const files = Array.prototype.slice.call(e.target.files); e.target.value = '';
    if (!files.length) return;
    try {
      const r = await L.importFiles(files, (i, n) => toast('Importando ' + i + '/' + n + '…', 60000));
      let m = r.added + ' música(s) adicionada(s)'; if (r.dup) m += ' · ' + r.dup + ' já existia(m)'; if (r.bad.length) m += ' · ' + r.bad.length + ' inválida(s)'; if (r.error) m += ' · ' + r.error;
      toast(m, 4500); render(true);
    } catch (err) { fail(err); }
  });

  /* ---------- player UI ---------- */
  function openPlayer() { if (!P.current) return; el.player.classList.add('open'); try { history.pushState({ p: 1 }, ''); } catch (e) { /* ignora */ } }
  function closePl() { el.player.classList.remove('open'); }
  window.addEventListener('popstate', closePl);
  function onTrack() {
    const c = P.current; $('#mini').classList.toggle('hidden', !c);
    if (!c) closePl();
    else {
      const u = L.coverUrl(c); $('#mCover').src = u; $('#pCover').src = u;
      $('#mTitle').textContent = $('#pTitle').textContent = c.title; $('#mArtist').textContent = $('#pArtist').textContent = c.artist;
      $('#pFav').dataset.id = c.id; syncFav();
    }
    markCur(); if (st.tab === 'home') render(true); onTime();
  }
  function onState() { $$('[data-act="toggle"]').forEach(b => { b.innerHTML = ic(P.playing ? 'pause' : 'play'); }); }
  function onTime() {
    const a = P.audio, d = a.duration, t = a.currentTime, ok = isFinite(d) && d > 0, c = P.current;
    if (!seeking) { const s = $('#pSeek'); s.value = ok ? t / d * 1000 : 0; rng(s); $('#pCur').textContent = fmt(t); }
    $('#pDur').textContent = fmt(ok ? d : (c ? c.duration : 0)); $('#mBar').style.width = (ok ? t / d * 100 : 0) + '%';
  }
  function onMode() {
    $('#bShuffle').classList.toggle('on', P.shuffle); const r = $('#bRepeat'); r.classList.toggle('on', P.repeat !== 'off'); r.innerHTML = ic(P.repeat === 'one' ? 'repeat1' : 'repeat');
  }
  P.on((t, x) => { if (t === 'track') onTrack(); else if (t === 'state') onState(); else if (t === 'time') onTime(); else if (t === 'mode') onMode(); else if (t === 'error') toast(x, 3500);
    if (t === 'track' || t === 'state') N.sync(); });
  const sk = $('#pSeek');
  sk.addEventListener('input', () => { seeking = true; rng(sk); const d = P.audio.duration; $('#pCur').textContent = fmt(isFinite(d) ? sk.value / 1000 * d : 0); });
  sk.addEventListener('change', () => { P.seek(sk.value / 1000 * P.audio.duration); seeking = false; });
  const vl = $('#pVol'); vl.addEventListener('input', () => { P.setVolume(vl.value / 100); rng(vl); });

  /* ---------- inicialização ---------- */
  async function init() {
    applyAccent();
    $$('[data-i]').forEach(n => { n.innerHTML = ic(n.dataset.i); });
    [['[data-act="closeplayer"]', 'down'], ['[data-act="next"]', 'next'], ['[data-act="prev"]', 'prev'], ['#bShuffle', 'shuffle'], ['#pFav', 'heart']].forEach(p => $$(p[0]).forEach(b => { b.innerHTML = ic(p[1]); }));
    if (/^https?:/.test(location.protocol)) { const l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.json'; document.head.appendChild(l); }
    try { await S.open(); await PL.load(); if (!N.available) await L.load(); }
    catch (e) { toast('Armazenamento indisponível: ' + e.message, 6000); }
    vl.value = Math.round(S.pref('vol', 0.8) * 100); rng(vl);
    P.init();
    if (!N.available) P.restore(); else { N.scanning = true; N.scan(); }
    N.hooks.loaded = () => { N.scanning = false; P.restore(); render(true); };
    N.hooks.denied = () => { N.scanning = false; toast('Permita o acesso às músicas nas configurações do app', 5000); render(true); };
    N.hooks.cover = s => {
      const u = L.coverUrl(s); $$('img[data-sid="' + s.id + '"]').forEach(i => { i.src = u; });
      const c = P.current; if (c && c.id === s.id) { $('#mCover').src = u; $('#pCover').src = u; N.sync(); }
    };
    onState(); render();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignora */ }
  }
  init();
})();
