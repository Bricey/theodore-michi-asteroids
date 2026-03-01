/**
 * Powerup: Drops from destroyed asteroids. Types: extra life, rapid fire, shield, score multiplier.
 */
export const POWERUP_TYPES = {
  EXTRA_LIFE: 'extra_life',
  RAPID_FIRE: 'rapid_fire',
  SHIELD: 'shield',
  SCORE_MULTIPLIER: 'score_multiplier',
};

export class Powerup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type, id = null) {
    super(scene, x, y, 'powerup_placeholder');
    this.powerupType = type;
    this.powerupId = id ?? `pwr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.spawnTime = scene.time.now;
    this.lifetimeMs = 10000;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(24, 24);
    this.body.setCircle(12);
    this.setVelocity(0, 0);
  }

  isExpired() {
    return this.scene.time.now - this.spawnTime > this.lifetimeMs;
  }
}
