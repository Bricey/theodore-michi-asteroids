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
