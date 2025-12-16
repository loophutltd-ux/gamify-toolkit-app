# Gamify Toolkit App - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [App Architecture](#app-architecture)
3. [Database Schema](#database-schema)
4. [Admin Routes & Features](#admin-routes--features)
5. [Theme Extension Blocks](#theme-extension-blocks)
6. [Block Configuration Guide](#block-configuration-guide)
7. [Analytics System](#analytics-system)
8. [Deployment Guide](#deployment-guide)
9. [Known Issues & Solutions](#known-issues--solutions)

---

## Overview

**Gamify Toolkit** is a Shopify app that enables merchants to embed interactive WebGL games into their storefronts. The app consists of:

- **Admin Dashboard**: Remix-based React Router app for managing games, input layouts, settings, and viewing statistics
- **Theme Extension**: Liquid-based blocks that render games on the storefront
- **Analytics System**: Tracks impressions, plays, and playtime for each game

### Key Features

| Feature | Description |
|---------|-------------|
| WebGL Game Embedding | Embed any web-hosted game via iframe |
| Fullscreen Mode | Desktop & mobile fullscreen with cross-browser support |
| Play Overlay | Click-to-play thumbnail for lazy loading games |
| Mobile Controls | Exit button, swipe gestures, orientation handling |
| Analytics | Track impressions, plays, and playtime per game |
| Input Layouts | Configurable touch controls (joysticks, buttons) |

---

## App Architecture

```
gamify-toolkit-app/
├── app/                          # Remix/React Router Application
│   ├── routes/
│   │   ├── app.tsx               # Main layout with navigation
│   │   ├── app._index.tsx        # Home page
│   │   ├── app.games._index.tsx  # Game management (CRUD)
│   │   ├── app.input-layouts._index.tsx  # Touch control layouts
│   │   ├── app.statistics._index.tsx     # Analytics dashboard
│   │   ├── app.settings._index.tsx       # App settings
│   │   ├── api.track.tsx         # Analytics tracking endpoint
│   │   ├── api.input-layout.tsx  # Input layout API
│   │   └── webhooks.*.tsx        # Shopify webhooks
│   ├── db.server.ts              # Prisma client
│   ├── shopify.server.ts         # Shopify authentication
│   └── root.tsx                  # Root layout
├── extensions/
│   └── gamify-toolkit-extension/ # Theme App Extension
│       ├── blocks/               # App blocks for storefront
│       ├── snippets/             # Reusable Liquid snippets
│       ├── assets/               # Static assets (CSS, JS, images)
│       ├── locales/              # Translation files
│       └── shopify.extension.toml
├── prisma/
│   ├── schema.prisma             # Database models
│   └── migrations/               # Database migrations
└── public/
    └── demo-game.html            # Demo game for testing
```

### Navigation Structure

The admin app has 5 main sections:
1. **Home** (`/app`) - Overview and quick start
2. **Games** (`/app/games`) - Add, edit, delete games
3. **Input Layouts** (`/app/input-layouts`) - Design touch controls
4. **Statistics** (`/app/statistics`) - View analytics
5. **Settings** (`/app/settings`) - Configure tracking options

---

## Database Schema

### Models

#### Session (Shopify Required)
Stores Shopify OAuth session data.

```prisma
model Session {
  id            String    @id
  shop          String
  state         String
  isOnline      Boolean   @default(false)
  scope         String?
  expires       DateTime?
  accessToken   String
  userId        BigInt?
  ...
}
```

#### Game
Stores game configurations per shop.

```prisma
model Game {
  id          String   @id @default(uuid())
  shop        String                          # Shopify shop domain
  title       String                          # Display title
  description String?                         # Optional description
  gameUrl     String                          # URL to hosted WebGL game
  thumbnailUrl String?                        # Preview image URL
  width       Int      @default(800)          # Default width (px)
  height      Int      @default(600)          # Default height (px)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  analytics   GameAnalytics[]
}
```

#### GameAnalytics
Daily analytics aggregates per game.

```prisma
model GameAnalytics {
  id                   String   @id @default(uuid())
  gameId               String                    # Reference to Game
  game                 Game     @relation(...)
  shop                 String
  impressions          Int      @default(0)      # Times game was viewed
  plays                Int      @default(0)      # Times play button clicked
  totalPlaytimeSeconds Int      @default(0)      # Cumulative playtime
  date                 DateTime @default(now())  # Day of record
}
```

#### AppSettings
Per-shop app configuration.

```prisma
model AppSettings {
  id                String   @id @default(uuid())
  shop              String   @unique
  trackImpressions  Boolean  @default(true)
  trackPlays        Boolean  @default(true)
  trackPlaytime     Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

#### InputLayout
Custom touch control layouts.

```prisma
model InputLayout {
  id          String   @id @default(uuid())
  shop        String
  name        String
  description String?
  elements    String                   # JSON array of InputElement objects
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Admin Routes & Features

### 1. Games Management (`app.games._index.tsx`)

**Purpose**: CRUD operations for games

**Features**:
- List all games for the shop
- Add new games with URL, title, dimensions
- Edit existing games
- Delete games (with confirmation)
- Auto-creates example game (2048) on first visit

**Data Flow**:
```
loader → fetches games from Prisma
action → handles create/delete operations
```

### 2. Input Layouts (`app.input-layouts._index.tsx`)

**Purpose**: Design custom touch controls for mobile gaming

**Features**:
- Visual drag-and-drop editor
- Create joysticks and buttons
- Configure key bindings (WASD, arrows, custom)
- Customize colors, opacity, sizes
- Set default layout per shop

**InputElement Interface**:
```typescript
interface InputElement {
  id: string;
  type: "joystick" | "button";
  x: number;           // % from left
  y: number;           // % from top
  width: number;       // % of screen width
  height: number;      // % of screen height
  keyBindings: string[];
  label?: string;
  showLabel: boolean;
  icon?: string;
  defaultColor: string;
  hoverColor: string;
  pressColor: string;
  opacity: number;
  borderRadius: number;
  joystickMode?: "wasd" | "arrows" | "custom";
}
```

### 3. Statistics (`app.statistics._index.tsx`)

**Purpose**: View game analytics

**Displays**:
- Overall stats: Total impressions, plays, playtime, play rate
- Per-game breakdown with same metrics
- Average playtime per session

**Calculations**:
- Play Rate = (Total Plays / Total Impressions) × 100
- Average Playtime = Total Playtime / Total Plays

### 4. Settings (`app.settings._index.tsx`)

**Purpose**: Configure tracking preferences

**Options**:
- Track Impressions (on/off)
- Track Plays (on/off)
- Track Playtime (on/off)

### 5. Tracking API (`api.track.tsx`)

**Purpose**: Receive analytics events from storefront

**Endpoint**: `POST /apps/gamify/api/track`

**Payload**:
```json
{
  "gameId": "unique-game-identifier",
  "type": "impression" | "play" | "playtime",
  "value": 10,  // seconds for playtime
  "shop": "shop-domain.myshopify.com"
}
```

**Behavior**:
- Creates daily analytics record if doesn't exist
- Respects shop's tracking settings
- Increments appropriate counter

---

## Theme Extension Blocks

Located in `extensions/gamify-toolkit-extension/blocks/`

### 1. WebGL Game Block (`webgl_game.liquid`)

**Main block** for embedding games on storefront.

**Settings (5 non-interactive + 3 range):**

| Setting | Type | Description |
|---------|------|-------------|
| `game_url` | url | URL to the hosted WebGL game |
| `game_title` | text | Optional title above game |
| `max_width` | range | 400-1900px (default: 800) |
| `height` | range | 300-1100px (default: 600) |
| `border_radius` | range | 0-30px corner radius |
| `show_play_overlay` | checkbox | Enable click-to-play |
| `thumbnail_image` | image_picker | Image for play overlay |
| `show_fullscreen_button` | checkbox | Show fullscreen button |

**Features Included**:
- Fullscreen support (all browsers)
- Mobile exit button (✕)
- Swipe-down-to-exit gesture
- Play overlay with lazy loading
- Analytics tracking
- Orientation change handling
- Responsive sizing

### 2. Star Rating Block (`star_rating.liquid`)

**Purpose**: Display product ratings with stars

**Settings**:
- `product`: Auto-filled product reference
- `colour`: Star color picker

### 3. Companion Blocks (Extend WebGL Game)

These blocks add features to the main game block using a `target_game_id` linking system.

#### Game Styling (`webgl_game_styling.liquid`)
- Background colors/images
- Border styling
- Title color customization

#### Game Orientation Lock (`webgl_game_orientation.liquid`)
- Force portrait/landscape mode
- Show rotation prompts
- Custom messages
- Dismiss button

#### Game Video Thumbnail (`webgl_game_video_thumbnail.liquid`)
- Video instead of static thumbnail
- Upload or external URL
- Autoplay option

#### Game Touch Controls (`webgl_game_touch_controls.liquid`)
- Virtual joystick
- Action/jump buttons
- Custom labels and colors
- Button shape options

---

## Block Configuration Guide

### Setting Up a Game Block

1. **In Shopify Theme Editor**:
   - Go to Online Store → Themes → Customize
   - Navigate to desired page/section
   - Click "Add block" → Select "WebGL Game"

2. **Configure Settings**:
   ```
   Game URL: https://your-game-host.com/game/
   Game Title: "My Awesome Game"
   Maximum Width: 800px
   Height: 600px
   Show Play Overlay: ✓
   Thumbnail Image: [Upload preview image]
   Show Fullscreen Button: ✓
   ```

3. **Add Companion Blocks** (optional):
   - Add "Game Orientation Lock" block
   - Set `target_game_id` to match your game URL fragment
   - Configure orientation preference

### Game Hosting Requirements

Your WebGL game must:
1. Be served over **HTTPS**
2. Allow iframe embedding (no `X-Frame-Options: DENY`)
3. Have proper CORS headers if needed
4. Work responsively at various sizes

---

## Analytics System

### How Tracking Works

```
┌────────────────┐      ┌──────────────┐      ┌────────────┐
│  Game Block    │ ───► │  /api/track  │ ───► │   Prisma   │
│  (Storefront)  │      │   Endpoint   │      │   SQLite   │
└────────────────┘      └──────────────┘      └────────────┘
```

1. **Impression**: Tracked when game is 50% visible (IntersectionObserver)
2. **Play**: Tracked when play overlay is clicked
3. **Playtime**: Tracked every 10 seconds during active play

### Viewing Statistics

Navigate to Statistics page to see:
- Overall metrics across all games
- Per-game breakdown
- Play rate percentages
- Total and average playtime

---

## Deployment Guide

### Prerequisites

1. **Shopify Partner Account**
2. **Development Store** for testing
3. **Node.js** 20.19+ or 22.12+
4. **Shopify CLI** installed

### Deployment Steps

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Deploy to Shopify
npm run deploy
# or
npx shopify app deploy
```

### Configuration Files

**shopify.app.toml**:
```toml
client_id = "your-client-id"
name = "gamify-toolkit-app"
application_url = "https://your-app-url.com"

[webhooks]
api_version = "2026-01"

[access_scopes]
scopes = "write_products"
```

**shopify.extension.toml**:
```toml
apiVersion = "2024-10"
name = "gamify-toolkit-extension"
type = "theme"
```

---

## Known Issues & Solutions

### Issue: "Unknown tag 'schema'" Error

**Symptom**: Deployment fails with schema tag not recognized

**Cause**: The `{% schema %}` tag must be properly formatted for Shopify CLI to parse

**Solution**: Ensure schema JSON is properly formatted:
```liquid
{% schema %}
{
  "name": "Block Name",
  "target": "section",
  "settings": [...]
}
{% endschema %}
```

### Issue: Too Many Non-Interactive Settings

**Shopify Limit**: Maximum 6 non-interactive settings per block

**Solution**: 
1. Use range inputs (they're interactive, not counted)
2. Create companion blocks for additional features
3. Keep main block focused on core settings

### Issue: Mobile Fullscreen Not Working

**Cause**: iOS Safari requires user gesture for fullscreen

**Solution**: Fullscreen is triggered via click/tap events which are user gestures

### Issue: Games Not Loading in iFrame

**Possible Causes**:
1. Game server has `X-Frame-Options: DENY`
2. Game not served over HTTPS
3. CORS issues

**Solution**: Configure game server to allow iframe embedding

---

## API Reference

### Track Endpoint

```
POST /apps/gamify/api/track
Content-Type: application/json

{
  "gameId": "string",
  "type": "impression" | "play" | "playtime",
  "value": number,  // required for playtime
  "shop": "string"
}

Response: { "success": true, "tracked": true }
```

### Input Layout Endpoint

```
GET /apps/gamify/api/input-layout?id=<layout-id>

Response: InputLayout object with parsed elements array
```

---

## Version History

- **v1.0.0**: Initial release with WebGL game embedding
- **v1.1.0**: Added analytics tracking
- **v1.2.0**: Added input layouts for touch controls
- **v1.3.0**: Added companion blocks (styling, orientation, video thumbnails, touch controls)

---

## Support

For issues or feature requests, please visit the GitHub repository.

**GitHub**: https://github.com/loophutltd-ux/gamify-toolkit-app
