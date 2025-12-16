# WebGL Game Blocks - Usage Guide

## Overview

The WebGL game system is now split into **5 modular blocks** to comply with Shopify's 6 non-interactive settings limit per block. Each block works independently but can be combined for full functionality.

## Available Blocks

### 1. **WebGL Game** (Main Block)
**File:** `webgl_game.liquid`

The core game embedding block with essential features.

**Settings (5 non-interactive):**
- Game URL (required)
- Game Title (optional)
- Show Play Overlay
- Thumbnail Image
- Show Fullscreen Button
- Plus 3 range sliders (width, height, border radius)

**Usage:**
1. Add the block to your theme
2. Enter your game URL
3. Configure basic display settings

---

### 2. **Game Styling** (Companion Block)
**File:** `webgl_game_styling.liquid`

Adds background colors, images, borders, and text styling.

**Settings (5 non-interactive):**
- Target Game ID (to link to specific game)
- Fill Type (select)
- Fill Color
- Background Image
- Custom Title Color (checkbox)
- Title Color

**Usage:**
1. Add this block near your main game block
2. Enter the same game identifier in "Target Game ID" (e.g., "demo-game")
3. Choose background color or image
4. Customize border and text colors

---

### 3. **Game Orientation Lock** (Companion Block)
**File:** `webgl_game_orientation.liquid`

Adds mobile orientation prompts to encourage landscape/portrait mode.

**Settings (6 non-interactive):**
- Target Game ID
- Preferred Orientation (select)
- Landscape Message (text)
- Portrait Message (text)
- Show Dismiss Button (checkbox)
- Dismiss Button Text

**Usage:**
1. Add this block to enable orientation prompts
2. Enter the target game ID
3. Select preferred orientation (landscape/portrait)
4. Customize messages shown to users
5. Optionally allow users to dismiss the prompt

**How it works:**
- Monitors device orientation when game is in fullscreen
- Shows an overlay with rotation icon if wrong orientation
- Automatically hides when user rotates device
- Includes optional "Continue Anyway" dismiss button

---

### 4. **Game Video Thumbnail** (Companion Block)
**File:** `webgl_game_video_thumbnail.liquid`

Replaces static thumbnail images with video thumbnails.

**Settings (3 non-interactive):**
- Target Game ID
- Upload Video Thumbnail (video picker)
- External Video URL (alternative)
- Autoplay Video (checkbox)

**Usage:**
1. First, enable "Show Play Overlay" in the main game block
2. Add this companion block
3. Enter the target game ID
4. Upload a video or provide external video URL
5. Choose autoplay (or hover-to-play)

**Features:**
- Replaces static thumbnail with looping video
- Option to autoplay or play on hover
- Supports uploaded videos or external URLs
- Video plays behind the play button

---

### 5. **Game Touch Controls** (Companion Block)
**File:** `webgl_game_touch_controls.liquid`

Adds on-screen virtual controls for mobile gaming.

**Settings (6 non-interactive):**
- Target Game ID
- Show Left Joystick (checkbox)
- Show Action Button (checkbox)
- Action Button Label
- Show Jump Button (checkbox)
- Jump Button Label
- Plus styling options (button shape, colors)

**Usage:**
1. Add this block to enable mobile controls
2. Enter the target game ID
3. Enable desired controls (joystick, action button, jump button)
4. Customize button labels and styling

**How it works:**
- Only visible on mobile devices in fullscreen mode
- Joystick dispatches `gameJoystick` events with x/y values
- Buttons dispatch `gameButton` events with press/release actions
- Your game code needs to listen for these events:

```javascript
// Listen for joystick input
window.addEventListener('gameJoystick', function(e) {
  console.log('Joystick:', e.detail); // { x: 0-1, y: 0-1, id: 'left-joystick' }
});

// Listen for button input
window.addEventListener('gameButton', function(e) {
  console.log('Button:', e.detail); // { action: 'press'|'release', id: 'action-btn' }
});
```

---

## How to Link Blocks Together

All companion blocks use a **"Target Game ID"** setting to identify which game they should enhance. This should be a unique string from your game URL.

**Example:**
- If your game URL is: `https://example.com/games/space-shooter/index.html`
- Use Target Game ID: `space-shooter`

All companion blocks with the same Target Game ID will automatically apply to the matching game.

---

## Complete Setup Example

To create a fully-featured mobile game experience:

1. **Add WebGL Game block**
   - Set game URL: `https://example.com/games/racing-game/index.html`
   - Enable "Show Play Overlay"
   - Upload a static thumbnail image

2. **Add Game Styling block**
   - Target Game ID: `racing-game`
   - Background: Solid color #1a1a1a
   - Border: 2px white

3. **Add Game Video Thumbnail block**
   - Target Game ID: `racing-game`
   - Upload gameplay preview video
   - Enable autoplay

4. **Add Game Orientation Lock block**
   - Target Game ID: `racing-game`
   - Preferred: Landscape
   - Custom message: "Rotate for best experience"

5. **Add Game Touch Controls block**
   - Target Game ID: `racing-game`
   - Enable joystick + 2 buttons
   - Style: Circle buttons, white theme

---

## Settings Count per Block

✅ **All blocks comply with Shopify's limits:**

- WebGL Game: 5 non-interactive settings
- Game Styling: 5 non-interactive settings  
- Game Orientation: 6 non-interactive settings
- Game Video Thumbnail: 3 non-interactive settings
- Game Touch Controls: 6 non-interactive settings

(Range sliders don't count toward the limit)

---

## Deployment

Deploy all blocks with:
```bash
shopify app deploy
```

Or via CMD on Windows:
```bash
cmd /c "cd /d c:\ShopifyProjects\GamifyApp\gamify-toolkit-app && shopify app deploy"
```

---

## Notes

- Companion blocks are **optional** - use only what you need
- Multiple games on one page can each have their own companion blocks
- The Target Game ID system allows precise targeting
- All blocks work independently - no dependencies between them
