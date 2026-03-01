/**
 * Network configuration for PeerJS and state synchronization.
 */
export const NETWORK = {
  /** State broadcast rate in Hz */
  SYNC_RATE_HZ: 20,
  /** Interval between state broadcasts in ms */
  SYNC_INTERVAL_MS: 50,
  /** Interpolation delay for smooth remote entity rendering (ms) */
  INTERPOLATION_DELAY_MS: 75,
  /** Connection timeout in ms */
  CONNECTION_TIMEOUT_MS: 15000,
  /** Room code length */
  ROOM_CODE_LENGTH: 6,
  /** TURN servers for NAT traversal (free Open Relay) */
  ICE_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
};
