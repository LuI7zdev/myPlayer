package com.myplayer.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.Icon;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;

/** Serviço em primeiro plano: notificação com controles de mídia + MediaSession (tela de bloqueio/fones). */
public class PlaybackService extends Service {
    static PlaybackService inst;
    static final String CH = "myplayer_playback";
    static final int ID = 1;

    MediaSession ms;
    NotificationManager nm;
    String title = "MyPlayer", artist = "", cover = "", artFor = "";
    boolean playing, fg;
    long pos, dur;
    Bitmap art;

    @Override public void onCreate() {
        super.onCreate();
        inst = this;
        nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(new NotificationChannel(CH, "Reprodução", NotificationManager.IMPORTANCE_LOW));
        ms = new MediaSession(this, "MyPlayer");
        ms.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        ms.setCallback(new MediaSession.Callback() {
            @Override public void onPlay() { MainActivity.cmd("play"); }
            @Override public void onPause() { MainActivity.cmd("pause"); }
            @Override public void onSkipToNext() { MainActivity.cmd("next"); }
            @Override public void onSkipToPrevious() { MainActivity.cmd("prev"); }
            @Override public void onSeekTo(long p) { MainActivity.cmd("seek:" + (p / 1000.0)); }
        });
        ms.setActive(true);
        push(); // startForeground imediato (exigido pelo Android)
    }

    @Override public int onStartCommand(Intent i, int flags, int id) {
        if (i != null && i.getAction() != null) {
            String a = i.getAction();
            if (a.equals("update")) update(i.getStringExtra("t"), i.getStringExtra("a"), i.getStringExtra("c"),
                    i.getBooleanExtra("p", false), i.getLongExtra("pos", 0), i.getLongExtra("dur", 0));
            else MainActivity.cmd(a); // prev / toggle / next vindos dos botões da notificação
        }
        return START_NOT_STICKY;
    }

    synchronized void update(String t, String a, String c, boolean pl, long p, long d) {
        title = t == null ? "" : t; artist = a == null ? "" : a; playing = pl; pos = p; dur = d;
        c = c == null ? "" : c;
        if (!c.equals(artFor)) {
            art = null;
            try {
                Bitmap b = c.isEmpty() ? null : BitmapFactory.decodeFile(c);
                if (b != null && Math.max(b.getWidth(), b.getHeight()) > 512) {
                    float k = 512f / Math.max(b.getWidth(), b.getHeight());
                    b = Bitmap.createScaledBitmap(b, Math.round(b.getWidth() * k), Math.round(b.getHeight() * k), true);
                }
                art = b;
            } catch (Throwable e) { /* sem capa */ }
            artFor = c;
        }
        push();
    }

    PendingIntent act(String a, int code) {
        return PendingIntent.getService(this, code, new Intent(this, PlaybackService.class).setAction(a), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    Notification.Action action(int icon, String label, String a, int code) {
        return new Notification.Action.Builder(Icon.createWithResource(this, icon), label, act(a, code)).build();
    }

    synchronized void push() {
        MediaMetadata.Builder m = new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, title)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, artist)
                .putLong(MediaMetadata.METADATA_KEY_DURATION, dur);
        if (art != null) m.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, art);
        ms.setMetadata(m.build());
        ms.setPlaybackState(new PlaybackState.Builder()
                .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE
                        | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS | PlaybackState.ACTION_SEEK_TO)
                .setState(playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED, pos, playing ? 1f : 0f).build());

        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH) : new Notification.Builder(this);
        b.setSmallIcon(R.drawable.ic_notif)
                .setContentTitle(title).setContentText(artist)
                .setOnlyAlertOnce(true).setShowWhen(false)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setContentIntent(PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE))
                .addAction(action(R.drawable.ic_prev, "Anterior", "prev", 1))
                .addAction(action(playing ? R.drawable.ic_pause : R.drawable.ic_play, playing ? "Pausar" : "Tocar", "toggle", 2))
                .addAction(action(R.drawable.ic_next, "Próxima", "next", 3))
                .setStyle(new Notification.MediaStyle().setMediaSession(ms.getSessionToken()).setShowActionsInCompactView(0, 1, 2));
        if (art != null) b.setLargeIcon(art);
        Notification n = b.build();
        if (!fg) {
            if (Build.VERSION.SDK_INT >= 29) startForeground(ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            else startForeground(ID, n);
            fg = true;
        } else nm.notify(ID, n);
    }

    @Override public void onTaskRemoved(Intent rootIntent) { stopSelf(); }

    @Override public void onDestroy() {
        ms.setActive(false);
        ms.release();
        stopForeground(true);
        inst = null;
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent i) { return null; }
}
