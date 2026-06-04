package com.aryanshrai3.oprameet

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ConfigLoaderTest {
    @Test
    fun parsesConfigJsonAndSelectsProductionUrlByDefault() {
        val config = ConfigLoader.fromJson(
            """
            {
              "site_url": "https://oprameet.vercel.app",
              "app_name": "OpraMeet",
              "fallback_url": "https://oprameet.vercel.app/offline",
              "dev_url": "http://10.0.2.2:3000",
              "use_dev_url": false,
              "allow_back_navigation": true,
              "show_loading_screen": true,
              "loading_timeout_ms": 8000,
              "enable_picture_in_picture": true,
              "enable_deep_links": true,
              "deep_link_scheme": "oprameet",
              "deep_link_host": "oprameet.vercel.app"
            }
            """.trimIndent()
        )

        assertEquals("https://oprameet.vercel.app", config.siteUrl)
        assertEquals("OpraMeet", config.appName)
        assertEquals("https://oprameet.vercel.app/offline", config.fallbackUrl)
        assertEquals("http://10.0.2.2:3000", config.devUrl)
        assertFalse(config.useDevUrl)
        assertTrue(config.allowBackNavigation)
        assertTrue(config.showLoadingScreen)
        assertEquals(8000L, config.loadingTimeoutMs)
        assertTrue(config.enablePictureInPicture)
        assertTrue(config.enableDeepLinks)
        assertEquals("oprameet", config.deepLinkScheme)
        assertEquals("oprameet.vercel.app", config.deepLinkHost)
        assertEquals("https://oprameet.vercel.app", config.activeUrl)
    }

    @Test
    fun activeUrlUsesDevUrlWhenEnabled() {
        val config = ConfigLoader.fromJson(
            """
            {
              "site_url": "https://oprameet.vercel.app",
              "app_name": "OpraMeet",
              "fallback_url": "https://oprameet.vercel.app/offline",
              "dev_url": "http://10.0.2.2:3000",
              "use_dev_url": true,
              "allow_back_navigation": true,
              "show_loading_screen": true,
              "loading_timeout_ms": 8000,
              "enable_picture_in_picture": true,
              "enable_deep_links": true,
              "deep_link_scheme": "oprameet",
              "deep_link_host": "oprameet.vercel.app"
            }
            """.trimIndent()
        )

        assertEquals("http://10.0.2.2:3000", config.activeUrl)
    }
}
