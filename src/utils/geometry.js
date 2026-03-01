/**
 * Placeholder shape creation for Ship, Asteroid, Projectile, Powerup.
 * Use setTexture() later to swap for final art.
 */

/** Ship: triangle pointing up (rotation 0 = up) */
export function createShipPoints(size = 12) {
  return [0, -size, size, size, -size, size];
}

/** Asteroid: irregular polygon with random vertices */
export function createAsteroidPoints(size, vertexCount = 8) {
  const points = [];
  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2 + Math.random() * 0.5;
    const r = size * (0.7 + Math.random() * 0.5);
    points.push(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  return points;
}

/** Asteroid size enum: large, medium, small */
export const ASTEROID_SIZE = {
  LARGE: 3,
  MEDIUM: 2,
  SMALL: 1,
};

export const ASTEROID_RADIUS = {
  [ASTEROID_SIZE.LARGE]: 40,
  [ASTEROID_SIZE.MEDIUM]: 24,
  [ASTEROID_SIZE.SMALL]: 12,
};
