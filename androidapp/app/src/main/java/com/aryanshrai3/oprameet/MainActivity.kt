package com.aryanshrai3.oprameet

import android.Manifest
import android.annotation.SuppressLint
import android.app.PictureInPictureParams
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Rational
import android.view.View
import android.webkit.JsResult
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.aryanshrai3.oprameet.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var config: AppConfig

    private var pendingWebPermissionRequest: PermissionRequest? = null
    private var pendingFileChooserCallback: ValueCallback<Array<Uri>>? = null

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val allGranted = results.values.all { it }
        if (allGranted) {
            pendingWebPermissionRequest?.let { it.grant(it.resources) }
        } else {
            pendingWebPermissionRequest?.deny()
            Toast.makeText(
                this,
                "Camera and microphone are required for video calls.",
                Toast.LENGTH_LONG
            ).show()
        }
        pendingWebPermissionRequest = null
    }

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
        pendingFileChooserCallback?.onReceiveValue(uris)
        pendingFileChooserCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        config = ConfigLoader.load(this)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupWebView()
        setupSwipeRefresh()
        setupRetryButton()
        setupBackNavigation()
        handleIncomingIntent(intent)

        if (config.showLoadingScreen) {
            Handler(Looper.getMainLooper()).postDelayed({
                if (binding.loadingLayout.visibility == View.VISIBLE && !isNetworkAvailable()) {
                    showOfflineScreen()
                }
            }, config.loadingTimeoutMs)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        binding.webView.apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                mediaPlaybackRequiresUserGesture = false
                allowFileAccess = true
                allowContentAccess = true
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                useWideViewPort = true
                loadWithOverviewMode = true
                cacheMode = WebSettings.LOAD_DEFAULT
                userAgentString = "$userAgentString OpraMeetAndroid/1.0"

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                }
            }

            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            webViewClient = OpraMeetWebViewClient()
            webChromeClient = OpraMeetWebChromeClient()
            loadUrl(config.activeUrl)
        }
    }

    inner class OpraMeetWebViewClient : WebViewClient() {
        override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
            super.onPageStarted(view, url, favicon)
            if (config.showLoadingScreen) {
                binding.loadingLayout.visibility = View.VISIBLE
            }
            binding.offlineLayout.visibility = View.GONE
            binding.swipeRefresh.isRefreshing = false
        }

        override fun onPageFinished(view: WebView, url: String) {
            super.onPageFinished(view, url)
            binding.loadingLayout.visibility = View.GONE
            binding.swipeRefresh.isRefreshing = false
        }

        override fun onReceivedError(
            view: WebView,
            request: WebResourceRequest,
            error: WebResourceError
        ) {
            super.onReceivedError(view, request, error)
            if (request.isForMainFrame) {
                binding.loadingLayout.visibility = View.GONE
                if (!isNetworkAvailable()) {
                    showOfflineScreen()
                }
            }
        }

        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val url = request.url.toString()
            return when {
                url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("market:") -> {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    } catch (_: ActivityNotFoundException) {
                    }
                    true
                }
                Uri.parse(url).host == config.deepLinkHost -> false
                else -> true
            }
        }
    }

    inner class OpraMeetWebChromeClient : WebChromeClient() {
        override fun onPermissionRequest(request: PermissionRequest) {
            val needed = mutableListOf<String>()

            request.resources.forEach { resource ->
                when (resource) {
                    PermissionRequest.RESOURCE_VIDEO_CAPTURE -> {
                        if (ContextCompat.checkSelfPermission(
                                this@MainActivity,
                                Manifest.permission.CAMERA
                            ) != PackageManager.PERMISSION_GRANTED
                        ) {
                            needed.add(Manifest.permission.CAMERA)
                        }
                    }
                    PermissionRequest.RESOURCE_AUDIO_CAPTURE -> {
                        if (ContextCompat.checkSelfPermission(
                                this@MainActivity,
                                Manifest.permission.RECORD_AUDIO
                            ) != PackageManager.PERMISSION_GRANTED
                        ) {
                            needed.add(Manifest.permission.RECORD_AUDIO)
                        }
                    }
                }
            }

            if (needed.isEmpty()) {
                request.grant(request.resources)
            } else {
                pendingWebPermissionRequest = request
                permissionLauncher.launch(needed.distinct().toTypedArray())
            }
        }

        override fun onShowFileChooser(
            webView: WebView,
            filePathCallback: ValueCallback<Array<Uri>>,
            fileChooserParams: FileChooserParams
        ): Boolean {
            pendingFileChooserCallback?.onReceiveValue(null)
            pendingFileChooserCallback = filePathCallback

            return try {
                fileChooserLauncher.launch(fileChooserParams.createIntent())
                true
            } catch (_: ActivityNotFoundException) {
                pendingFileChooserCallback = null
                false
            }
        }

        override fun onProgressChanged(view: WebView, newProgress: Int) {
            super.onProgressChanged(view, newProgress)
            if (newProgress == 100) {
                binding.loadingLayout.visibility = View.GONE
            }
        }

        override fun onJsAlert(view: WebView, url: String, message: String, result: JsResult): Boolean {
            Toast.makeText(this@MainActivity, message, Toast.LENGTH_LONG).show()
            result.confirm()
            return true
        }
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefresh.apply {
            setColorSchemeColors(0xFF1A73E8.toInt())
            setProgressBackgroundColorSchemeColor(0xFF303134.toInt())
            setOnRefreshListener {
                binding.offlineLayout.visibility = View.GONE
                binding.webView.reload()
            }
        }
    }

    private fun setupRetryButton() {
        binding.retryButton.setOnClickListener {
            binding.offlineLayout.visibility = View.GONE
            binding.loadingLayout.visibility = View.VISIBLE
            binding.webView.loadUrl(config.activeUrl)
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (config.allowBackNavigation && binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingIntent(intent)
    }

    private fun handleIncomingIntent(intent: Intent?) {
        if (!config.enableDeepLinks) return

        val data = intent?.data ?: return
        val url = when {
            data.scheme == config.deepLinkScheme -> {
                val path = data.pathSegments.joinToString("/")
                if (path.isBlank()) config.siteUrl else "${config.siteUrl}/$path"
            }
            data.host == config.deepLinkHost -> data.toString()
            else -> return
        }

        binding.webView.loadUrl(url)
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        if (config.enablePictureInPicture && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val params = PictureInPictureParams.Builder()
                .setAspectRatio(Rational(16, 9))
                .build()
            try {
                enterPictureInPictureMode(params)
            } catch (_: Exception) {
            }
        }
    }

    override fun onPictureInPictureModeChanged(
        isInPictureInPictureMode: Boolean,
        newConfig: android.content.res.Configuration
    ) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        binding.swipeRefresh.isEnabled = !isInPictureInPictureMode
    }

    private fun showOfflineScreen() {
        binding.offlineLayout.visibility = View.VISIBLE
        binding.loadingLayout.visibility = View.GONE
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}
