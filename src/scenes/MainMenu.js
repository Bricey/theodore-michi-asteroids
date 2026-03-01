/**
 * MainMenu: Create Game (Host), Join Game (Guest), mode select, room code input.
 */
export class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    this.inputMode = null;
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

    let selectedMode = null;

    coopBtn.on('pointerdown', () => {
      selectedMode = 'cooperative';
      coopBtn.setColor('#00ff00');
      combatBtn.setColor('#666666');
    });

    combatBtn.on('pointerdown', () => {
      selectedMode = 'combat';
      combatBtn.setColor('#ff4444');
      coopBtn.setColor('#666666');
    });

    // Create Game (Host)
    const createBtn = this.add
      .text(width / 2, 550, 'Create Game (Host)', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    createBtn.on('pointerdown', () => {
      if (!selectedMode) {
        this.showMessage('Select Cooperative or Combat first');
        return;
      }
      this.registry.set('gameMode', selectedMode);
      this.registry.set('isHost', true);
      this.scene.start('Game');
    });

    // Join Game (Guest) - room code via keyboard
    const joinBtn = this.add
      .text(width / 2, 650, 'Join Game (Guest)', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const codeDisplay = this.add
      .text(width / 2, 750, 'Code: ______', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setVisible(false);

    const confirmJoinBtn = this.add
      .text(width / 2, 830, 'Join', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#00aaff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);

    let roomCodeInput = '';

    joinBtn.on('pointerdown', () => {
      if (!selectedMode) {
        this.showMessage('Select Cooperative or Combat first');
        return;
      }
      codeDisplay.setVisible(true);
      roomCodeInput = '';
      codeDisplay.setText('Code: ______');
      confirmJoinBtn.setVisible(false);
      this.inputMode = 'roomCode';
    });

    const keys = this.input.keyboard.addKeys('A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,0,1,2,3,4,5,6,7,8,9,BACKSPACE,ENTER');
    this.input.keyboard.on('keydown', (event) => {
      if (this.inputMode !== 'roomCode') return;
      if (event.key === 'Backspace') {
        roomCodeInput = roomCodeInput.slice(0, -1);
      } else if (event.key.length === 1 && /[A-Za-z0-9]/.test(event.key) && roomCodeInput.length < 6) {
        roomCodeInput += event.key.toUpperCase();
      } else if (event.key === 'Enter' && roomCodeInput.length === 6) {
        this.registry.set('gameMode', selectedMode);
        this.registry.set('isHost', false);
        this.registry.set('roomCode', roomCodeInput);
        this.inputMode = null;
        this.scene.start('Game');
        return;
      }
      codeDisplay.setText('Code: ' + roomCodeInput.padEnd(6, '_'));
      confirmJoinBtn.setVisible(roomCodeInput.length === 6);
    });

    confirmJoinBtn.on('pointerdown', () => {
      if (roomCodeInput.length !== 6) return;
      this.registry.set('gameMode', selectedMode);
      this.registry.set('isHost', false);
      this.registry.set('roomCode', roomCodeInput);
      this.inputMode = null;
      this.scene.start('Game');
    });

    // Message area
    this.messageText = this.add
      .text(width / 2, 950, '', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffaa00',
      })
      .setOrigin(0.5);
  }

  showMessage(text) {
    this.messageText.setText(text);
    this.time.delayedCall(3000, () => this.messageText.setText(''));
  }
}
