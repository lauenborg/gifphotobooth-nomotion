# Motion Detection for API Warming

This feature implements intelligent motion detection to warm the Replicate API model before users take photos, reducing cold start delays.

## How it works

1. **Motion Detection**: Uses efficient frame comparison on a reduced resolution canvas (160x120) to detect when someone approaches the camera
2. **API Warming**: When motion is detected, sends a dummy prediction request to warm up the Replicate model infrastructure
3. **Smart Cooldown**: Prevents excessive API calls with a 45-second cooldown period
4. **iPad Optimized**: Performance settings tuned for touch devices with efficient frame processing

## Features

- **Background Operation**: Runs silently without UI indicators
- **Performance Optimized**: Low-resolution canvas and frame skipping for smooth performance on iPad
- **Error Resilient**: Graceful handling of warming failures without affecting main functionality
- **Intelligent Timing**: Only runs during GIF selection screen, stops during photo capture

## Configuration

Default settings in `CameraMotionWarmer.js`:
- Canvas: 160x120 pixels for motion detection
- Motion threshold: 12% of pixels must change
- Frame check: Every 300ms
- Cooldown: 45 seconds between warming calls
- Frame skipping: Every 3rd frame processed

## Console Output

Monitor the browser console for motion detection activity:
- `Motion detected - preparing to warm model`
- `🔥 Starting model warming in background...`
- `✅ Model warming completed successfully`
- `⚠️ Model warming failed: [error message]`

## Files

- `app/utils/CameraMotionWarmer.js` - Main motion detection class
- `app/api/predictions/warm/route.js` - API warming endpoint
- `app/page.js` - Integration with camera component