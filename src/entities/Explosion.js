/**
 * Explosion: Procedural burst of debris particles using Graphics + Tweens.
 * No external textures required — works purely with Phaser primitives.
 *
 * Usage:
 *   new Explosion(scene, x, y);
 *   new Explosion(scene, x, y, { count: 20, color: 0xff4400 });
 */
export class Explosion {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x - World X of the explosion centre
   * @param {number} y - World Y of the explosion centre
   * @param {object} [opts]
   * @param {number} [opts.count=14]     - Number of debris shards
   * @param {number} [opts.speed=130]    - Max outward travel distance (px)
   * @param {number} [opts.duration=700] - Particle lifetime (ms)
   * @param {number} [opts.color=0xffffff] - Shard tint
   * @param {number} [opts.size=3]       - Shard half-size in px
   */
  constructor(scene, x, y, opts = {}) {
    const {
      count    = 14,
      speed    = 130,
      duration = 700,
      color    = 0xffffff,
      size     = 3,
    } = opts;

    // Central white flash — expands and fades quickly
    const flash = scene.add.graphics();
    flash.fillStyle(0xffffff, 1);
    flash.fillCircle(0, 0, 14);
    flash.x = x;
    flash.y = y;
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2.5,
      scaleY: 2.5,
      duration: duration * 0.35,
      ease: 'Quad.Out',
      onComplete: () => flash.destroy(),
    });

    // Debris shards — evenly distributed around 360° with slight randomness
    for (let i = 0; i < count; i++) {
      const baseAngle = (i / count) * Math.PI * 2;
      const angle     = baseAngle + (Math.random() - 0.5) * 0.6;
      const dist      = speed * (0.4 + Math.random() * 0.6);

      const shard = scene.add.graphics();
      shard.fillStyle(color, 1);
      // Alternate between square debris and thin line shards for variety
      if (i % 3 === 0) {
        shard.fillRect(-size, -size * 0.5, size * 2, size);
      } else {
        shard.fillRect(-size * 0.5, -size * 0.5, size, size);
      }
      shard.x = x;
      shard.y = y;

      scene.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        angle: Math.random() * 360,  // tumble as it flies
        duration,
        ease: 'Quad.Out',
        onComplete: () => shard.destroy(),
      });
    }

    // Secondary ring of smaller sparks — brighter/faster, shorter lived
    const sparkCount = Math.ceil(count * 0.6);
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = speed * 0.3 * Math.random();

      const spark = scene.add.graphics();
      spark.fillStyle(0xffffff, 1);
      spark.fillCircle(0, 0, 2);
      spark.x = x;
      spark.y = y;

      scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: duration * 0.5,
        ease: 'Quad.Out',
        onComplete: () => spark.destroy(),
      });
    }
  }
}
