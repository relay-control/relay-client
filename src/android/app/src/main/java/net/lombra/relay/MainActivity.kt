package net.lombra.relay

import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewAssetLoader.Builder
import androidx.webkit.WebViewAssetLoader.AssetsPathHandler


class MainActivity : AppCompatActivity() {
	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)
		setContentView(R.layout.activity_main)
		
		val webView: WebView = findViewById(R.id.webview)
		webView.settings.javaScriptEnabled = true
		webView.settings.domStorageEnabled = true
		webView.loadUrl("http://appassets.androidplatform.net/index.html")
		
		WebView.setWebContentsDebuggingEnabled(true)
		
		// this allows us to use the appassets.androidplatform.net domain for local assets
		val assetLoader: WebViewAssetLoader = Builder()
			.setHttpAllowed(true)
			.addPathHandler("/", AssetsPathHandler(this))
			.build()
		
		webView.webViewClient = object : WebViewClient() {
			override fun shouldInterceptRequest(
				view: WebView,
				request: WebResourceRequest,
			): WebResourceResponse? {
				val response = assetLoader.shouldInterceptRequest(request.url)
				// Javascript modules needs the correct MIME type set
				response?.let {
					if (request.url.lastPathSegment?.endsWith(".js", true) == true) {
						it.mimeType = "text/javascript"
					}
				}
				return response
			}
		}
		
		onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
			override fun handleOnBackPressed() {
				webView.evaluateJavascript("closePanel()", null)
			}
		})
	}
}