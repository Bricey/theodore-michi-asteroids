/**
 * Phaser game configuration: resolution, physics, scale.
 * Desktop: 1920x1080 landscape. Mobile: 1080x1920 portrait.
 */
const isMobile =
  /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '') ||
  'ontouchstart' in window;

const width = isMobile ? 1080 : 1920;
const height = isMobile ? 1920 : 1080;

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width,
  height,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
      fps: 60,
      // Higher bias reduces tunneling (small/fast bodies passing through each other)
      overlapBias: 12,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: isMobile ? { width: 360, height: 640 } : { width: 640, height: 360 },
    max: isMobile ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 },
  },
  scene: [], // Populated in main.js
};

/** True when running in mobile/portrait mode. */
export const IS_MOBILE = isMobile;

/** Physics constants for Asteroids-style entities */
export const PHYSICS = {
  SHIP: {
    DAMPING: true,
    DRAG: 0.99,
    MAX_VELOCITY: 200,
    ANGULAR_VELOCITY: 300,
    THRUST: 200,
  },
  ASTEROID: {
    DAMPING: false,
    DRAG: 0,
    MAX_VELOCITY: 150,
    // Small asteroids auto-detonate if they drift too long
    SELF_DESTRUCT_SMALL_MS: 20000,
  },
  PROJECTILE: {
    DAMPING: false,
    DRAG: 0,
    VELOCITY: 400,
    VELOCITY_FAST: 620,
    LIFETIME_MS: 2000,
    LIFETIME_EXTENDED_MS: 3500,
  },
  ROCKET: {
    VELOCITY: 650,
    LIFETIME_MS: 1500,
    EXPLOSION_RADIUS: 400,
  },
};

/** Distance-based pickup radius (px) — fallback when physics overlap misses */
export const PICKUP_RADIUS = 48;
