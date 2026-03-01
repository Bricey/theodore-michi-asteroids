/**
 * Preloader: Load placeholder assets, show progress bar.
 * Assets are generated procedurally or loaded from placeholders.
 */
export class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: 'Preloader' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Progress bar background
    this.add.rectangle(width / 2, height / 2, 400, 24, 0x333333);
    const bar = this.add.rectangle(width / 2 - 200, height / 2, 0, 20, 0x00ff00).setOrigin(0, 0.5);

    this.load.on('progress', (value) => {
      bar.width = 396 * value;
    });

    this.load.on('complete', () => {
      bar.width = 396;
    });

    this.load.on('loaderror', (file) => {
      console.warn('[Preloader] Failed to load:', file.key, file.url);
    });

    // Generate placeholder textures for bullet/powerup (ship & asteroids use real art)
    this.createPlaceholderTextures();

    // Game art: ship and asteroids
    const img = 'assets/images';
    this.load.image('theo-ship', `${img}/theo-ship.png`);
    this.load.image('michi-happyFace', `${img}/michi-happyFace.png`);
    this.load.image('michi-sadFace', `${img}/michi-sadFace.png`);
    this.load.image('theo-butt', `${img}/theo-butt.png`);

    // Action-pack SFX (OGG + WAV fallback for Safari and older browsers)
    const sfx = 'assets/audio/sfx';
    this.load.audio('sfx-shot', [`${sfx}/shot.ogg`, `${sfx}/shot.wav`]);
    this.load.audio('sfx-explode', [`${sfx}/explode.ogg`, `${sfx}/explode.wav`]);
    this.load.audio('sfx-die', [`${sfx}/die.ogg`, `${sfx}/die.wav`]);
    this.load.audio('sfx-powerup', [`${sfx}/powerup2.ogg`, `${sfx}/powerup2.wav`]);
    this.load.audio('sfx-rocket-fire', [`${sfx}/shot.ogg`, `${sfx}/shot.wav`]);
    this.load.audio('sfx-rocket-explode', [`${sfx}/explode.ogg`, `${sfx}/explode.wav`]);

    // Minimal asset so progress bar animates
    this.load.image('dummy', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
    this.load.start();
  }

  /**
   * Create procedural placeholder textures for ship, asteroid, bullet, powerup.
   * These are used when image files are not present.
   */
  createPlaceholderTextures() {
    const createCircle = (key, radius, color) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color);
      g.fillCircle(radius, radius, radius);
      g.generateTexture(key, radius * 2, radius * 2);
      g.destroy();
    };

    const createTriangle = (key, size, color) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color);
      g.fillTriangle(size, 0, 0, size * 2, size * 2, size * 2);
      g.generateTexture(key, size * 2, size * 2);
      g.destroy();
    };

    // Fallbacks if image load fails
    createTriangle('ship_placeholder', 16, 0x00ff00);
    createCircle('asteroid_placeholder', 24, 0x888888);
    createCircle('bullet_placeholder', 4, 0xffff00);
    createCircle('powerup_placeholder', 12, 0xff00ff);
  }

  create() {
    this.scene.start('MainMenu');
  }
}
