package net.lombra.recon;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.JavascriptInterface;

public class WebAppInterface {
	Context mContext;

	/** Instantiate the interface and set the context */
	WebAppInterface(Context c) {
		mContext = c;
	}

	@JavascriptInterface
	public void save(String setting, String value) {
		// We need an Editor object to make preference changes.
		// All objects are from android.context.Context
		SharedPreferences settings = mContext.getSharedPreferences("MainActivity", Context.MODE_PRIVATE);
		SharedPreferences.Editor editor = settings.edit();
		editor.putString(setting, value);

		// Commit the edits!
		editor.commit();
	}
}
