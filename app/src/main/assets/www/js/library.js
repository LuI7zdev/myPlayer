/* library.js — biblioteca: importação, metadados (ID3), capas, favoritos */
(function () {
  'use strict';
  const DEF = 'assets/images/default-cover.png';
  const MIME = { mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg', oga: 'audio/ogg', flac: 'audio/flac' };
  const ext = n => (n.split('.').pop() || '').toLowerCase();
  const byTitle = (a, b) => a.title.localeCompare(b.title, 'pt', { sensitivity: 'base' });

  function hash(s) { // hash 53 bits (cyrb53) -> id curto e seguro para HTML
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 'm' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  function txt(d) { // decodifica texto de frame ID3
    const enc = d[0]; let b = d.subarray(1), label = 'iso-8859-1';
    if (enc === 1) label = (b[0] === 0xFE && b[1] === 0xFF) ? 'utf-16be' : 'utf-16le';
    else if (enc === 2) label = 'utf-16be'; else if (enc === 3) label = 'utf-8';
    return new TextDecoder(label).decode(b).replace(/\0/g, '').replace(/^\uFEFF/, '').trim();
  }
  function pic(d) { // frame APIC -> Blob
    const enc = d[0]; let i = 1;
    while (i < d.length && d[i] !== 0) i++;
    const mime = String.fromCharCode.apply(null, d.subarray(1, i)); i += 2;
    if (enc === 1 || enc === 2) { while (i + 1 < d.length && !(d[i] === 0 && d[i + 1] === 0)) i += 2; i += 2; }
    else { while (i < d.length && d[i] !== 0) i++; i++; }
    const data = d.slice(i);
    return data.length < 100 ? null : new Blob([data], { type: mime.indexOf('/') > 0 ? mime : 'image/jpeg' });
  }
  async function id3(file) { // lê ID3v2.3/2.4 (título, artista, álbum, capa)
    const out = {};
    try {
      const h = new Uint8Array(await file.slice(0, 10).arrayBuffer());
      if (String.fromCharCode(h[0], h[1], h[2]) !== 'ID3') return out;
      const ver = h[3], size = ((h[6] & 127) << 21) | ((h[7] & 127) << 14) | ((h[8] & 127) << 7) | (h[9] & 127);
      const buf = new Uint8Array(await file.slice(10, 10 + Math.min(size, 8e6)).arrayBuffer());
      let p = 0;
      while (p + 10 <= buf.length) {
        const id = String.fromCharCode(buf[p], buf[p + 1], buf[p + 2], buf[p + 3]);
        if (!/^[A-Z0-9]{4}$/.test(id)) break;
        const fs = ver === 4 ? ((buf[p + 4] & 127) << 21) | ((buf[p + 5] & 127) << 14) | ((buf[p + 6] & 127) << 7) | (buf[p + 7] & 127)
          : buf[p + 4] * 16777216 + (buf[p + 5] << 16) + (buf[p + 6] << 8) + buf[p + 7];
        const d = buf.subarray(p + 10, p + 10 + fs); p += 10 + fs;
        if (id === 'TIT2') out.title = txt(d); else if (id === 'TPE1') out.artist = txt(d);
        else if (id === 'TALB') out.album = txt(d); else if (id === 'APIC' && !out.cover) out.cover = pic(d);
      }
    } catch (e) { /* sem metadados */ }
    return out;
  }
  function duration(file) { // null = arquivo ilegível/inválido
    return new Promise(res => {
      const u = URL.createObjectURL(file), a = new Audio();
      let done = false;
      const end = v => { if (done) return; done = true; a.removeAttribute('src'); URL.revokeObjectURL(u); res(v); };
      a.preload = 'metadata';
      a.onloadedmetadata = () => end(isFinite(a.duration) ? a.duration : 0);
      a.onerror = () => end(null);
      setTimeout(() => end(null), 10000);
      a.src = u;
    });
  }

  const L = {
    DEF, byTitle, native: false, songs: [], map: new Map(), covers: new Map(),
    setNative(list) { this.native = true; this.songs = list; this.reindex(); },
    async load() { this.songs = await MP.storage.all('songs'); this.reindex(); },
    reindex() { this.map = new Map(this.songs.map(s => [s.id, s])); },
    get(id) { return this.map.get(id); },
    coverUrl(s) {
      if (s && s.coverUrl) return s.coverUrl;
      if (!s || !s.cover) return DEF;
      let u = this.covers.get(s.id);
      if (!u) { u = URL.createObjectURL(s.cover); this.covers.set(s.id, u); }
      return u;
    },
    async importFiles(files, progress) {
      const r = { added: 0, dup: 0, bad: [], error: '' };
      let n = 0;
      for (const f of files) {
        n++; if (progress) progress(n, files.length);
        const e = ext(f.name);
        if (!(f.type || '').startsWith('audio/') && !MIME[e]) { r.bad.push(f.name); continue; }
        const id = hash(f.name + '|' + f.size);
        if (this.map.has(id)) { r.dup++; continue; }
        const d = await duration(f);
        if (d === null) { r.bad.push(f.name); continue; }
        const m = await id3(f);
        const base = f.name.replace(/\.[^.]+$/, '').replace(/_/g, ' '), parts = base.split(' - ');
        const s = {
          id, name: f.name, added: Date.now() + n, fav: false, duration: d, cover: m.cover || null, album: m.album || '',
          title: m.title || (parts.length > 1 ? parts.slice(1).join(' - ') : base),
          artist: m.artist || (parts.length > 1 ? parts[0] : 'Artista desconhecido'),
          file: new Blob([f], { type: f.type || MIME[e] || 'audio/mpeg' })
        };
        try { await MP.storage.put('songs', s); }
        catch (err) { r.error = err && err.name === 'QuotaExceededError' ? 'Sem espaço de armazenamento.' : 'Falha ao salvar: ' + (err && err.message); break; }
        this.songs.push(s); this.map.set(id, s); r.added++;
      }
      return r;
    },
    async toggleFav(id) { const s = this.get(id); if (!s) return; s.fav = !s.fav;
      if (s.url) MP.storage.setPref('favs', this.songs.filter(x => x.fav).map(x => x.id)); // músicas do Android
      else await MP.storage.put('songs', s); },
    async remove(id) {
      await MP.storage.del('songs', id);
      this.songs = this.songs.filter(s => s.id !== id); this.map.delete(id);
      const u = this.covers.get(id); if (u) { URL.revokeObjectURL(u); this.covers.delete(id); }
    },
    async clear() {
      await MP.storage.clear('songs');
      this.covers.forEach(u => URL.revokeObjectURL(u)); this.covers.clear(); this.songs = []; this.map.clear();
    }
  };
  window.MP = window.MP || {};
  MP.library = L;
})();
