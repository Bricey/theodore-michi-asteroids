/**
 * Phaser game configuration: resolution, physics, scale.
 * Base resolution 1080x1920, portrait orientation.
 */
export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1080,
  height: 1920,
  backgroundColor: '#0a0a0a',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
      fps: 60,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 360, height: 640 },
    max: { width: 1080, height: 1920 },
  },
  scene: [], // Populated in main.js
};

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
  },
  PROJECTILE: {
    DAMPING: false,
    DRAG: 0,
    VELOCITY: 400,
    LIFETIME_MS: 2000,
  },
};
