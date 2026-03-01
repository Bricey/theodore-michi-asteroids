/**
 * Screen wrapping helpers for Asteroids-style world bounds.
 */
const WRAP_MARGIN = 32;

/**
 * Wrap a physics body at screen edges.
 * @param {Phaser.Physics.Arcade.World} world
 * @param {Phaser.GameObjects.GameObject} sprite
 * @param {number} margin
 */
export function wrapSprite(world, sprite, margin = WRAP_MARGIN) {
  if (sprite.body) {
    world.wrap(sprite, margin);
  }
}

export { WRAP_MARGIN };
