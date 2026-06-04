package com.aryanshrai3.oprameet

import android.content.Context

data class AppConfig(
    val siteUrl: String,
    val appName: String,
    val fallbackUrl: String,
    val devUrl: String,
    val useDevUrl: Boolean,
    val allowBackNavigation: Boolean,
    val showLoadingScreen: Boolean,
    val loadingTimeoutMs: Long,
    val enablePictureInPicture: Boolean,
    val enableDeepLinks: Boolean,
    val deepLinkScheme: String,
    val deepLinkHost: String,
) {
    val activeUrl: String get() = if (useDevUrl) devUrl else siteUrl
}

object ConfigLoader {
    fun load(context: Context): AppConfig {
        val json = context.assets
            .open("configsiteurl.json")
            .bufferedReader()
            .use { it.readText() }

        return fromJson(json)
    }

    fun fromJson(json: String): AppConfig {
        return AppConfig(
            siteUrl = json.stringValue("site_url"),
            appName = json.stringValue("app_name"),
            fallbackUrl = json.stringValue("fallback_url"),
            devUrl = json.stringValue("dev_url"),
            useDevUrl = json.booleanValue("use_dev_url"),
            allowBackNavigation = json.booleanValue("allow_back_navigation"),
            showLoadingScreen = json.booleanValue("show_loading_screen"),
            loadingTimeoutMs = json.longValue("loading_timeout_ms"),
            enablePictureInPicture = json.booleanValue("enable_picture_in_picture"),
            enableDeepLinks = json.booleanValue("enable_deep_links"),
            deepLinkScheme = json.stringValue("deep_link_scheme"),
            deepLinkHost = json.stringValue("deep_link_host"),
        )
    }

    private fun String.stringValue(key: String): String {
        val pattern = Regex(""""${Regex.escape(key)}"\s*:\s*"([^"]*)"""")
        return pattern.find(this)?.groupValues?.get(1)
            ?: error("Missing string config value: $key")
    }

    private fun String.booleanValue(key: String): Boolean {
        val pattern = Regex(""""${Regex.escape(key)}"\s*:\s*(true|false)""")
        return pattern.find(this)?.groupValues?.get(1)?.toBooleanStrict()
            ?: error("Missing boolean config value: $key")
    }

    private fun String.longValue(key: String): Long {
        val pattern = Regex(""""${Regex.escape(key)}"\s*:\s*(\d+)""")
        return pattern.find(this)?.groupValues?.get(1)?.toLong()
            ?: error("Missing long config value: $key")
    }
}
