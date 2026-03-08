/**
 * MainMenu: Create Game (Host), Join Game (Guest), mode select.
 * Auto-matchmaking: Join is highlighted when an open game exists; Create only when none.
 */
import { getOpenGames, removeGame } from '../services/MatchmakingService.js';

export class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add
      .text(width / 2, 200, 'ASTEROIDS', {
        fontFamily: 'sans-serif',
        fontSize: '72px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 280, 'Two Player', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    // Mode selection
    const coopBtn = this.add
      .text(width / 2 - 150, 420, 'Cooperative', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#00ff00',
        backgroundColor: '#222222',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const combatBtn = this.add
      .text(width / 2 + 150, 420, 'Combat', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#ff4444',
        backgroundColor: '#222222',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.selectedMode = null;

    coopBtn.on('pointerdown', () => {
      this.selectedMode = 'cooperative';
      coopBtn.setColor('#00ff00');
      combatBtn.setColor('#666666');
    });

    combatBtn.on('pointerdown', () => {
      this.selectedMode = 'combat';
      combatBtn.setColor('#ff4444');
      coopBtn.setColor('#666666');
    });

    // Play Local (2P)
    const localBtn = this.add
      .text(width / 2, 520, 'Play Local (2P)', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#aaccff',
        backgroundColor: '#333333',
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    localBtn.on('pointerdown', () => {
      if (!this.selectedMode) {
        this.showMessage('Select Cooperative or Combat first');
        return;
      }
      this.registry.set('gameMode', this.selectedMode);
      this.registry.set('isHost', true);
      this.registry.set('twoPlayerLocal', true);
      this.registry.set('roomCode', '');
      this.scene.start('Game');
    });

    // Create Game (Host) - visible only when no open game
    const createBtn = this.add
      .text(width / 2, 600, 'Create Game (Host)', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    createBtn.on('pointerdown', () => {
      if (!this.selectedMode) {
        this.showMessage('Select Cooperative or Combat first');
        return;
      }
      this.registry.set('gameMode', this.selectedMode);
      this.registry.set('isHost', true);
      this.registry.set('twoPlayerLocal', false);
      this.scene.start('Game');
    });

    // Join Game (Guest) - highlighted red when open game exists
    const joinBtn = this.add
      .text(width / 2, 600, 'Join Game (Guest)', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ff4444',
        backgroundColor: '#333333',
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // No games available - shown when no open game (Join disabled)
    const noGamesText = this.add
      .text(width / 2, 700, 'No games available', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#666666',
      })
      .setOrigin(0.5);

    // Message area
    this.messageText = this.add
      .text(width / 2, 1000, '', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffaa00',
      })
      .setOrigin(0.5);

    // Loading state while fetching open games
    const loadingText = this.add
      .text(width / 2, 600, 'Checking for games...', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    createBtn.setVisible(false);
    joinBtn.setVisible(false);
    noGamesText.setVisible(false);

    this.setupMatchmakingButtons(createBtn, joinBtn, noGamesText, loadingText);
  }

  async setupMatchmakingButtons(createBtn, joinBtn, noGamesText, loadingText) {
    let openGames = [];
    try {
      openGames = await getOpenGames();
    } catch (err) {
      console.error('Matchmaking fetch failed:', err);
      this.showMessage('Could not check for games. Try Create or Play Local.');
    }

    loadingText.setVisible(false);

    if (openGames.length > 0) {
      // Open game exists: show Join (red), hide Create
      createBtn.setVisible(false);
      joinBtn.setVisible(true);
      noGamesText.setVisible(false);

      const firstGame = openGames[0];

      joinBtn.removeAllListeners('pointerdown');
      joinBtn.on('pointerdown', async () => {
        try {
          await removeGame(firstGame.peerId);
          this.registry.set('gameMode', firstGame.gameMode);
          this.registry.set('isHost', false);
          this.registry.set('twoPlayerLocal', false);
          this.registry.set('roomCode', firstGame.peerId);
          this.scene.start('Game');
        } catch (err) {
          console.error('Join failed:', err);
          this.showMessage('Could not join game. It may have been taken.');
        }
      });
    } else {
      // No open game: show Create, Join disabled
      createBtn.setVisible(true);
      joinBtn.setVisible(false);
      noGamesText.setVisible(true);
    }
  }

  showMessage(text) {
    this.messageText.setText(text);
    this.time.delayedCall(3000, () => this.messageText.setText(''));
  }
}
