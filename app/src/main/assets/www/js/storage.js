/* storage.js — IndexedDB (músicas, playlists) + LocalStorage (preferências) */
(function () {
  'use strict';
  let db = null;
  const S = {
    ready: false,
    open() {
      return new Promise((res, rej) => {
        if (!window.indexedDB) return rej(new Error('IndexedDB não suportado'));
        const r = indexedDB.open('myplayer', 1);
        r.onupgradeneeded = () => {
          r.result.createObjectStore('songs', { keyPath: 'id' });
          r.result.createObjectStore('playlists', { keyPath: 'id' });
        };
        r.onsuccess = () => { db = r.result; S.ready = true; res(); };
        r.onerror = () => rej(r.error || new Error('Falha ao abrir o banco'));
        r.onblocked = () => rej(new Error('Banco bloqueado por outra aba'));
      });
    },
    tx(store, mode, fn) {
      return new Promise((res, rej) => {
        let out;
        try {
          const t = db.transaction(store, mode);
          const rq = fn(t.objectStore(store));
          if (rq) rq.onsuccess = () => { out = rq.result; };
          t.oncomplete = () => res(out);
          t.onerror = () => rej(t.error);
          t.onabort = () => rej(t.error || new Error('Transação cancelada'));
        } catch (e) { rej(e); }
      });
    },
    all(store) { return this.tx(store, 'readonly', s => s.getAll()); },
    put(store, v) { return this.tx(store, 'readwrite', s => s.put(v)); },
    del(store, id) { return this.tx(store, 'readwrite', s => s.delete(id)); },
    clear(store) { return this.tx(store, 'readwrite', s => s.clear()); },
    pref(k, d) {
      try { const v = localStorage.getItem('mp_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    setPref(k, v) { try { localStorage.setItem('mp_' + k, JSON.stringify(v)); } catch (e) { /* ignora */ } }
  };
  window.MP = window.MP || {};
  MP.storage = S;
})();
