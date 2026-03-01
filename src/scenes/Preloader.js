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

    // Generate placeholder textures at runtime (no external assets required)
    this.createPlaceholderTextures();

    // Load minimal asset so progress bar animates
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

    // Ship: triangle pointing up
    createTriangle('ship_placeholder', 16, 0x00ff00);
    createCircle('asteroid_placeholder', 24, 0x888888);
    createCircle('bullet_placeholder', 4, 0xffff00);
    createCircle('powerup_placeholder', 12, 0xff00ff);
  }

  create() {
    this.scene.start('MainMenu');
  }
}
