package com.talandaviad;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.ironsmile.RNWakeful.RNWakefulPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.oblador.vectoricons.VectorIconsPackage;
import com.tanguyantoine.react.MusicControl;

import java.util.Arrays;
import java.util.List;

import fm.indiecast.rnaudiostreamer.RNAudioStreamerPackage;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNWakefulPackage(),
            new VectorIconsPackage(),
            new MusicControl(),
            new RNAudioStreamerPackage(),
            new MyPackages()
      );
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
