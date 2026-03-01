# Asteroids Clone - Two Player

A two-player web game template inspired by the classic Asteroids arcade game. Built with Phaser 3 and PeerJS for P2P multiplayer on static hosts (Netlify, Cloudflare Pages).

## Modes

- **Cooperative**: One or two players work together to survive endless rounds of asteroids and enemy ships.
- **Combat**: Two players fight each other for the high score.

## Features

- Classic Asteroids mechanics: zero gravity momentum, rotation-based aiming, screen wrapping
- Progressive difficulty
- Powerups from destroyed asteroids (extra life, rapid fire, shield, score multiplier)
- Scoring and lives

## Controls

- **Keyboard**: Arrow keys or WASD + Space/E to fire
- **Gamepad**: Left stick + A button
- **Mobile**: Virtual joystick and fire button (auto-detected)

## Setup

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
```

Deploy the `dist/` folder to Netlify or Cloudflare Pages. HTTPS is required for WebRTC.

### Deploy on Cloudflare Pages (Git → auto deploy)

1. **Push your repo to GitHub or GitLab** (if not already).

2. **Connect to Cloudflare Pages**
   - [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
   - Sign in with GitHub/GitLab and select this repository.
   - You must connect Git at project creation; it cannot be added later.

3. **Build settings**
   - **Framework preset**: None (or “Vite” if listed)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: leave blank (repo root)
   - **Node.js version**: set to 18 or 20 in **Settings → Environment variables** if needed (e.g. `NODE_VERSION` = `20`).

4. **Save and deploy**  
   Every push to the connected branch will trigger a new build and deploy.

5. **Two-player support**  
   The game uses PeerJS with the default signaling server and WebRTC (STUN/TURN in `src/config/networkConfig.js`). No extra Cloudflare config is required; two players can host/join from the same Pages URL.

**Optional – deploy from CLI (no Git):**

```bash
npm run build
npx wrangler pages deploy dist --project-name=asteroids-clone
```

## Asset Replacement

Replace placeholder geometry with final art by loading sprites in Preloader and switching entity textures:

```javascript
this.sprite.setTexture('ship');
this.sprite.setDisplaySize(32, 32);
```

## Tech Stack

- Phaser 3
- PeerJS (WebRTC P2P)
- Vite
