package net.lombra.recon;

import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.util.Map;

public class MainActivity extends Activity {
	WebAppInterface w = new WebAppInterface(this);

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
//        setRequestedOrientation (ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
		setContentView(R.layout.activity_main);
		View decorView = getWindow().getDecorView();
		// Hide the status bar.
		int uiOptions = View.SYSTEM_UI_FLAG_FULLSCREEN;
		decorView.setSystemUiVisibility(uiOptions);

		// Remember that you should never show the action bar if the
		// status bar is hidden, so hide that too if necessary.
//        android.support.v7.app.ActionBar actionBar = getSupportActionBar();
//        actionBar.hide();

		WebView myWebView = findViewById(R.id.webview);
		myWebView.addJavascriptInterface(new WebAppInterface(this), "Android");
		myWebView.setWebViewClient(new WebViewClient() {
			@Override
			public void onPageFinished(WebView view, String url) {
				// Restore preferences
				SharedPreferences settings = getPreferences(MODE_PRIVATE);
				String address = settings.getString("address", "w");
				Map all = settings.getAll();
				view.evaluateJavascript("setup(" + new JSONObject(all) + ")", null);
			}
		});
		WebSettings webSettings = myWebView.getSettings();
		webSettings.setJavaScriptEnabled(true);
		myWebView.loadUrl("file:///android_asset/web/index.html");
		WebView.setWebContentsDebuggingEnabled(true);
	}

	public boolean onKeyDown(int keyCode, KeyEvent event) {
		WebView myWebView = (WebView) findViewById(R.id.webview);
		if ((keyCode == KeyEvent.KEYCODE_BACK)) {
			myWebView.evaluateJavascript("goBack()", null);
			return true;
		}
		// If it wasn't the Back key, bubble up to the default
		// system behavior (probably exit the activity)
		return super.onKeyDown(keyCode, event);
	}
}
