/**
 * ScoreManager: Tracks score, lives, and game-over state.
 */
import { ASTEROID_SIZE } from '../utils/geometry.js';

const POINTS = {
  [ASTEROID_SIZE.LARGE]: 20,
  [ASTEROID_SIZE.MEDIUM]: 50,
  [ASTEROID_SIZE.SMALL]: 100,
};

export class ScoreManager {
  constructor(scene, gameMode) {
    this.scene = scene;
    this.gameMode = gameMode;
    this.scores = { player1: 0, player2: 0 };
    this.lives = { player1: 3, player2: 3 };
    this.scoreMultiplier = 1;
  }

  addAsteroidScore(playerId, size) {
    const pts = (POINTS[size] ?? 20) * this.scoreMultiplier;
    this.scores[playerId] = (this.scores[playerId] ?? 0) + pts;
    return pts;
  }

  addCombatScore(playerId, points = 50) {
    if (this.gameMode !== 'combat') return;
    this.scores[playerId] = (this.scores[playerId] ?? 0) + points;
  }

  loseLife(playerId) {
    this.lives[playerId] = (this.lives[playerId] ?? 3) - 1;
    return this.lives[playerId];
  }

  addLife(playerId) {
    this.lives[playerId] = (this.lives[playerId] ?? 0) + 1;
    return this.lives[playerId];
  }

  getScore(playerId) {
    return this.scores[playerId] ?? 0;
  }

  getTotalScore() {
    return this.scores.player1 + this.scores.player2;
  }

  getLives(playerId) {
    return this.lives[playerId] ?? 0;
  }

  setScoreMultiplier(mult) {
    this.scoreMultiplier = mult;
  }

  isGameOver() {
    const p1 = this.lives.player1 <= 0;
    const p2 = this.lives.player2 <= 0;
    if (this.gameMode === 'cooperative') {
      return p1 && p2;
    }
    return p1 || p2;
  }

  getWinner() {
    if (this.lives.player1 <= 0 && this.lives.player2 <= 0) return null;
    if (this.lives.player1 <= 0) return 'player2';
    if (this.lives.player2 <= 0) return 'player1';
    return null;
  }
}
