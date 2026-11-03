package com.myplayer.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.media.MediaMetadataRetriever;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;

/** Hospeda o MyPlayer (HTML) num WebView e expõe a ponte "Android" para o JavaScript. */
public class MainActivity extends Activity {
    static MainActivity inst;
    WebView web;
    volatile String songsJson = "[]";

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        inst = this;
        getWindow().setStatusBarColor(0xFF0A0A0F);
        getWindow().setNavigationBarColor(0xFF14141C);
        web = new WebView(this);
        web.setBackgroundColor(0xFF0A0A0F);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Bridge(), "Android");
        web.loadUrl("file:///android_asset/www/index.html");
    }

    /** Envia um comando (play, pause, next...) para o JavaScript. */
    static void cmd(final String c) {
        final MainActivity a = inst;
        if (a == null) return;
        a.runOnUiThread(() -> a.web.evaluateJavascript("window.MP&&MP.native&&MP.native.cmd('" + c + "')", null));
    }

    void js(final String code) { runOnUiThread(() -> web.evaluateJavascript(code, null)); }

    boolean audioOk() {
        String p = Build.VERSION.SDK_INT >= 33 ? Manifest.permission.READ_MEDIA_AUDIO : Manifest.permission.READ_EXTERNAL_STORAGE;
        return checkSelfPermission(p) == PackageManager.PERMISSION_GRANTED;
    }

    @Override public void onRequestPermissionsResult(int rc, String[] p, int[] r) {
        if (audioOk()) scan(); else js("MP.native.denied()");
    }

    /** Lê as músicas do aparelho via MediaStore e avisa o JS quando terminar. */
    void scan() {
        new Thread(() -> {
            JSONArray arr = new JSONArray();
            String[] proj = { MediaStore.Audio.Media._ID, MediaStore.Audio.Media.TITLE, MediaStore.Audio.Media.ARTIST,
                    MediaStore.Audio.Media.ALBUM, MediaStore.Audio.Media.DURATION, MediaStore.Audio.Media.DATE_ADDED, MediaStore.Audio.Media.DATA };
            String sel = MediaStore.Audio.Media.IS_MUSIC + "!=0 AND " + MediaStore.Audio.Media.DURATION + ">=10000";
            try (Cursor c = getContentResolver().query(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, proj, sel, null, null)) {
                while (c != null && c.moveToNext()) {
                    String path = c.getString(6);
                    if (path == null || path.isEmpty()) continue;
                    String artist = c.getString(2);
                    if (artist == null || artist.equals("<unknown>")) artist = "Artista desconhecido";
                    String title = c.getString(1);
                    if (title == null || title.isEmpty()) title = new File(path).getName();
                    JSONObject o = new JSONObject();
                    o.put("id", String.valueOf(c.getLong(0)));
                    o.put("title", title);
                    o.put("artist", artist);
                    o.put("album", c.getString(3) == null ? "" : c.getString(3));
                    o.put("dur", c.getLong(4));
                    o.put("added", c.getLong(5));
                    o.put("path", path);
                    arr.put(o);
                }
            } catch (Exception e) { /* devolve o que conseguiu */ }
            songsJson = arr.toString();
            js("MP.native.ready()");
        }).start();
    }

    /** Extrai a capa embutida do arquivo e salva no cache. Arquivo vazio = sem capa. */
    void extractCover(String path, File out) {
        byte[] pic = null;
        MediaMetadataRetriever r = new MediaMetadataRetriever();
        try { r.setDataSource(path); pic = r.getEmbeddedPicture(); } catch (Exception e) { /* sem capa */ }
        finally { try { r.release(); } catch (Exception e) { /* ignora */ } }
        try (FileOutputStream fo = new FileOutputStream(out)) { if (pic != null) fo.write(pic); } catch (Exception e) { /* ignora */ }
    }

    class Bridge {
        @JavascriptInterface public void requestScan() {
            runOnUiThread(() -> {
                if (audioOk()) { scan(); return; }
                if (Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{ Manifest.permission.READ_MEDIA_AUDIO, Manifest.permission.POST_NOTIFICATIONS }, 7);
                else requestPermissions(new String[]{ Manifest.permission.READ_EXTERNAL_STORAGE }, 7);
            });
        }

        @JavascriptInterface public String getSongs() { return songsJson; }

        @JavascriptInterface public void loadCovers() {
            new Thread(() -> {
                File dir = new File(getCacheDir(), "covers");
                dir.mkdirs();
                try {
                    JSONArray a = new JSONArray(songsJson);
                    JSONObject batch = new JSONObject();
                    int n = 0;
                    for (int i = 0; i < a.length(); i++) {
                        JSONObject o = a.getJSONObject(i);
                        String id = o.getString("id");
                        File f = new File(dir, id + ".jpg");
                        if (!f.exists()) extractCover(o.getString("path"), f);
                        if (f.length() > 0) { batch.put(id, f.getAbsolutePath()); n++; }
                        if (n > 0 && (n >= 20 || i == a.length() - 1)) {
                            js("MP.native.covers(" + batch.toString() + ")");
                            batch = new JSONObject();
                            n = 0;
                        }
                    }
                } catch (Exception e) { /* ignora */ }
            }).start();
        }

        /** Atualiza notificação + sessão de mídia (título, artista, capa, estado, posição). */
        @JavascriptInterface public void media(String t, String a, String c, boolean playing, long pos, long dur) {
            PlaybackService s = PlaybackService.inst;
            if (s != null) { s.update(t, a, c, playing, pos, dur); return; }
            Intent i = new Intent(MainActivity.this, PlaybackService.class).setAction("update")
                    .putExtra("t", t).putExtra("a", a).putExtra("c", c).putExtra("p", playing).putExtra("pos", pos).putExtra("dur", dur);
            try {
                if (Build.VERSION.SDK_INT >= 26) startForegroundService(i); else startService(i);
            } catch (Exception e) { /* app em segundo plano sem permissão para iniciar */ }
        }

        @JavascriptInterface public void stopMedia() { stopService(new Intent(MainActivity.this, PlaybackService.class)); }
    }

    @Override public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else moveTaskToBack(true); // mantém a música tocando
    }

    @Override protected void onDestroy() {
        if (isFinishing()) stopService(new Intent(this, PlaybackService.class));
        inst = null;
        super.onDestroy();
    }
}
