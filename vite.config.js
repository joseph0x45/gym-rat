import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    cloudflare(),
    // Makes Gym Rat an installable app that opens offline (a "PWA").
    // It generates a service worker that saves the app's files on your phone.
    VitePWA({
      // Don't reload by itself when there's a new version: we ask first (see UpdateToast.svelte)
      registerType: 'prompt',
      manifest: {
        name: 'Gym Rat',
        short_name: 'Gym Rat',
        description: 'Your workouts, tracked.',
        start_url: '/',
        display: 'standalone', // full screen, no browser toolbars
        orientation: 'portrait',
        background_color: '#111214',
        theme_color: '#111214',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Files saved for offline use: the app itself (not the 140MB of ExerciseDB GIFs;
        // exercises you add are saved in the database instead)
        globPatterns: ['**/*.{js,css,html,svg}', 'icons/*.png'],
        globIgnores: ['exercisedb/**'],
        // Any page URL opens the app offline, except the ExerciseDB files
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/exercisedb\//],
      },
    }),
  ],
})
