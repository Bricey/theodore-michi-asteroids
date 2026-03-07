/**
 * Powerup: Drops from destroyed asteroids.
 * Types: rapid fire, extended range, spread shot (30s each), missile (1 per pickup).
 * Art: theo-butt.png.
 */
export const POWERUP_TYPES = {
  /** Increased firing speed for 30 seconds */
  RAPID_FIRE: 'rapid_fire',
  /** Increased projectile range for 30 seconds */
  EXTENDED_RANGE: 'extended_range',
  /** Fire two projectiles in opposite directions for 30 seconds */
  SPREAD_SHOT: 'spread_shot',
  /** Grant 1 missile: explodes with 400px radius */
  MISSILE: 'missile',
};

export class Powerup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type, id = null) {
    const textureKey = scene.textures.exists('theo-butt') ? 'theo-butt' : 'powerup_placeholder';
    super(scene, x, y, textureKey);
    this.powerupType = type;
    this.powerupId = id ?? `pwr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.spawnTime = scene.time.now;
    this.lifetimeMs = 10000;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Slightly larger so pickups read more clearly; generous body for reliable overlap
    this.setDisplaySize(32, 32);
    this.body.setCircle(24);
    this.setVelocity(0, 0);
  }

  isExpired() {
    return this.scene.time.now - this.spawnTime > this.lifetimeMs;
  }
}
