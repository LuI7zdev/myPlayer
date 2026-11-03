/* playlists.js — CRUD de playlists (persistidas no IndexedDB) */
(function () {
  'use strict';
  const S = () => MP.storage;
  const PL = {
    list: [],
    async load() { this.list = (await S().all('playlists')).sort((a, b) => a.created - b.created); },
    get(id) { return this.list.find(p => p.id === id); },
    async create(name) {
      const p = { id: 'pl' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, songs: [], created: Date.now() };
      await S().put('playlists', p); this.list.push(p); return p;
    },
    async rename(id, name) { const p = this.get(id); if (!p) return; p.name = name; await S().put('playlists', p); },
    async remove(id) { await S().del('playlists', id); this.list = this.list.filter(p => p.id !== id); },
    async addSongs(id, ids) {
      const p = this.get(id); if (!p) return 0;
      const add = ids.filter((x, i) => !p.songs.includes(x) && ids.indexOf(x) === i);
      if (add.length) { p.songs = p.songs.concat(add); await S().put('playlists', p); }
      return add.length;
    },
    async removeSong(id, songId) {
      const p = this.get(id); if (!p) return;
      p.songs = p.songs.filter(x => x !== songId); await S().put('playlists', p);
    },
    async prune() { // remove referências a músicas que não existem mais
      for (const p of this.list) {
        const k = p.songs.filter(id => MP.library.get(id));
        if (k.length !== p.songs.length) { p.songs = k; await S().put('playlists', p); }
      }
    }
  };
  window.MP = window.MP || {};
  MP.playlists = PL;
})();
