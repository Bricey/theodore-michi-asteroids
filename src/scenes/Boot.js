/**
 * Boot scene: Set globals, check WebRTC support, proceed to Preloader.
 */
export class Boot extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload() {
    // No assets in Boot; minimal setup
  }

  create() {
    // Check WebRTC support (required for PeerJS)
    const hasWebRTC =
      typeof RTCPeerConnection !== 'undefined' ||
      typeof webkitRTCPeerConnection !== 'undefined';

    if (!hasWebRTC) {
      this.showError('WebRTC is not supported in this browser. Please use a modern browser.');
      return;
    }

    // Global game state (mode, role, room code, etc.)
    this.registry.set('gameMode', null);
    this.registry.set('isHost', false);
    this.registry.set('roomCode', '');
    this.registry.set('playerId', null);
    this.registry.set('peerId', null);

    this.scene.start('Preloader');
  }

  showError(message) {
    const text = this.add
      .text(960, 540, message, {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ff4444',
        align: 'center',
        wordWrap: { width: 800 },
      })
      .setOrigin(0.5);
  }
}
