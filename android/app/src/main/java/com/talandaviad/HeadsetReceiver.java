package com.talandaviad;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioManager;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class HeadsetReceiver extends ReactContextBaseJavaModule {
    private static final String ACTION_HEADSET_PLUG = (android.os.Build.VERSION.SDK_INT >= 21) ? AudioManager.ACTION_HEADSET_PLUG : Intent.ACTION_HEADSET_PLUG;

    public HeadsetReceiver(final ReactApplicationContext reactContext) {
        super(reactContext);


    }

    @Override
    public String getName() {
        return "HeadsetReceiver";
    }


    @Override
    public void initialize() {
        super.initialize();

        final ReactContext reactContext = getReactApplicationContext();
        IntentFilter filter = new IntentFilter(ACTION_HEADSET_PLUG);
        BroadcastReceiver wiredHeadsetReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (ACTION_HEADSET_PLUG.equals(intent.getAction())) {
                    String deviceName = intent.getStringExtra("name");
                    if (deviceName == null) {
                        deviceName = "";
                    }
                    WritableMap data = Arguments.createMap();
                    data.putBoolean("isPlugged", (intent.getIntExtra("state", 0) == 1));
                    data.putBoolean("hasMic", (intent.getIntExtra("microphone", 0) == 1));
                    data.putString("deviceName", deviceName);
                    Utils.sendEvent(reactContext, "WiredHeadset", data);
                }
            }
        };
        reactContext.registerReceiver(wiredHeadsetReceiver, filter);
    }
}
