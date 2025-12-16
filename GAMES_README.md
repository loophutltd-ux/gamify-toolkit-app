# Gamify Toolkit - WebGL Games for Shopify

A Shopify app that allows merchants to embed interactive WebGL games into their storefronts with fullscreen support.

## Features

✨ **WebGL Game Embedding** - Add interactive games to any page of your store
🎮 **Fullscreen Mode** - Players can maximize games to fullscreen for immersive experience
⚙️ **Easy Management** - Admin interface to add, edit, and delete games
🎨 **Customizable** - Control size, colors, borders, and appearance
📱 **Responsive** - Works on desktop, tablet, and mobile devices
🔒 **Secure** - Games load via iframe with proper security headers

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Access Admin Panel

Once the app is running, navigate to the "Games" section in the admin panel to start adding your WebGL games.

## How to Use

### Adding a Game

1. Go to the **Games** section in your Shopify admin
2. Click **"Add New Game"**
3. Fill in the game details:
   - **Game Title**: Name of your game
   - **Description**: Brief description (optional)
   - **Game URL**: Full URL where your WebGL game is hosted (must be HTTPS)
   - **Thumbnail URL**: Preview image (optional)
   - **Width & Height**: Default dimensions in pixels

4. Click **"Add Game"** to save

### Adding Game to Your Store

1. Go to your Shopify theme editor
2. Navigate to the page where you want to add the game
3. Click **"Add block"** or **"Add section"**
4. Find and select **"WebGL Game"** from the available blocks
5. Configure the block settings:
   - Enter your game URL
   - Customize title, description, and colors
   - Adjust size and border settings
   - Enable/disable fullscreen button
   - Customize fullscreen button appearance

### Block Settings

The WebGL Game block includes the following customization options:

#### Game Settings
- **Game Title**: Display title above the game
- **Game Description**: Optional description text
- **Game URL**: URL to your hosted WebGL game

#### Display Settings
- **Maximum Width**: 400px - 1920px (default: 800px)
- **Height**: 300px - 1080px (default: 600px)
- **Border Width**: 0px - 10px
- **Border Radius**: 0px - 30px
- **Border Color**: Custom color picker

#### Text Styling
- **Title Color**: Color for the game title
- **Description Color**: Color for the description

#### Fullscreen Button
- **Show Fullscreen Button**: Toggle visibility
- **Button Background Color**: Custom color
- **Button Text Color**: Custom color

## Technical Requirements

### Game Hosting Requirements

Your WebGL games must meet these requirements:

1. **HTTPS Required**: Games must be served over HTTPS
2. **CORS Headers**: Server must allow iframe embedding
3. **X-Frame-Options**: Should not be set to `DENY` or have appropriate `ALLOW-FROM` directive
4. **Content Security Policy**: Should allow iframe embedding

### Recommended Game Settings

For optimal performance:

- Keep game file sizes under 50MB
- Optimize textures and assets
- Test on various devices and screen sizes
- Provide loading indicators
- Handle errors gracefully

## File Structure

```
gamify-toolkit-app/
├── app/
│   ├── routes/
│   │   ├── app.games._index.tsx    # Game management UI
│   │   └── app.tsx                  # Main app layout with navigation
│   └── db.server.ts                 # Database client
├── extensions/
│   └── gamify-toolkit-extension/
│       └── blocks/
│           └── webgl_game.liquid    # Storefront game component
├── prisma/
│   └── schema.prisma                # Database schema with Game model
└── package.json
```

## Database Schema

The app uses the following Game model:

```prisma
model Game {
  id          String   @id @default(uuid())
  shop        String
  title       String
  description String?
  gameUrl     String
  thumbnailUrl String?
  width       Int      @default(800)
  height      Int      @default(600)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Features Explained

### Fullscreen Mode

The fullscreen functionality:
- Uses the Fullscreen API for maximum compatibility
- Supports all major browsers (Chrome, Firefox, Safari, Edge)
- Automatically adjusts game size when entering/exiting fullscreen
- Updates button text dynamically
- Provides keyboard shortcuts (ESC to exit)
- Handles fallbacks for older browsers

### Responsive Design

The component is fully responsive:
- Uses percentage-based widths
- Maintains aspect ratios
- Adapts to parent container
- Works on mobile, tablet, and desktop
- Touch-friendly controls

### Security

Security features include:
- iframe sandbox attributes
- HTTPS enforcement
- CORS validation
- XSS prevention
- CSP headers support

## Browser Support

- ✅ Chrome 71+
- ✅ Firefox 64+
- ✅ Safari 12.1+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Game Not Loading

1. **Check CORS**: Ensure your game server allows iframe embedding
2. **Verify URL**: Make sure the game URL is correct and uses HTTPS
3. **Check Console**: Open browser console for error messages
4. **Test Direct Access**: Try opening the game URL directly

### Fullscreen Not Working

1. **User Gesture Required**: Fullscreen must be triggered by user action (button click)
2. **Browser Permissions**: Some browsers require explicit permission
3. **Mobile Limitations**: Some mobile browsers have limited fullscreen support

### Performance Issues

1. **Optimize Assets**: Compress textures and reduce file sizes
2. **Check Bandwidth**: Ensure adequate hosting bandwidth
3. **Mobile Testing**: Test on actual mobile devices
4. **Browser Cache**: Enable proper caching headers

## Development

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Database Migrations

```bash
npx prisma migrate dev
```

### Deploying

```bash
npm run deploy
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify game hosting configuration
4. Test with a simple HTML game first

## License

Private - See package.json

## Author

Alist

---

Built with ❤️ using React Router, Prisma, and Shopify App Bridge
