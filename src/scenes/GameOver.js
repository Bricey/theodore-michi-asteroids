/**
 * GameOver: Display winner/score, Play Again button.
 */
export class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const winner = this.registry.get('winner');
    const score = this.registry.get('score') ?? 0;
    const gameMode = this.registry.get('gameMode') ?? 'cooperative';

    let title = 'GAME OVER';
    if (gameMode === 'combat' && winner) {
      title = winner === 'player1' ? 'PLAYER 1 WINS' : 'PLAYER 2 WINS';
    }

    this.add
      .text(width / 2, 350, title, {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 480, `Score: ${score}`, {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    const playAgainBtn = this.add
      .text(width / 2, 650, 'Play Again', {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        color: '#00ff00',
        backgroundColor: '#333333',
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playAgainBtn.on('pointerdown', () => {
      this.scene.start('MainMenu');
    });
  }
}
