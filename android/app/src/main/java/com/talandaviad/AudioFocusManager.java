package com.talandaviad;

import android.content.Context;
import android.media.AudioManager;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

/**
 * Created by eladgil on 23/10/2017.
 */

public class AudioFocusManager extends ReactContextBaseJavaModule implements AudioManager.OnAudioFocusChangeListener {
    public AudioFocusManager(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AudioFocusManager";
    }

    @Override
    public void initialize() {
        super.initialize();
    }

    @Override
    public void onAudioFocusChange(int focusChange) {
        Log.d("onAudioFocusChange", "" + focusChange);
        WritableMap data = Arguments.createMap();
        switch (focusChange) {
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                data.putBoolean("inFocus", false);
                break;
            case AudioManager.AUDIOFOCUS_GAIN:
                data.putBoolean("inFocus", true);
                break;
        }

        Utils.sendEvent(getReactApplicationContext(), "onAudioFocusChange", data);
    }

    @ReactMethod
    public void startListening() {
        AudioManager am = (AudioManager) getReactApplicationContext().getSystemService(Context.AUDIO_SERVICE);
        int result = am.requestAudioFocus(this, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
        if (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
            Log.d("AudioFocusManager", "Audio Focus Request Granted");
        }
    }
}
