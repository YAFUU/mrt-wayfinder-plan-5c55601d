# MRT QuickPass

## Map Setup

The MRT map now uses **MapLibre GL JS** with a custom MRT schematic overlay.
It does not require Google Maps JavaScript API, Google Billing, API keys, or HTTP referrer setup.

Requirements:

- A modern browser with WebGL enabled.
- Hardware acceleration should be enabled for the smoothest map rendering.
- Run the app normally with `npm run dev` or `npm run build`.

If the map does not render:

1. Refresh the page.
2. Check that the browser supports WebGL.
3. Make sure the browser has not disabled hardware acceleration.
4. Check the dev console for MapLibre/WebGL errors.

The map data is prototype data for MRT QuickPass and may not represent official real-time transit data.
