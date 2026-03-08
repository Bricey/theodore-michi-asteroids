/**
 * NetworkManager: PeerJS wrapper for P2P connections.
 * Handles createRoom, joinRoom, send, onReceive.
 */
import Peer from 'peerjs';
import { NETWORK } from '../config/networkConfig.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(length = NETWORK.ROOM_CODE_LENGTH) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export class NetworkManager {
  constructor(scene) {
    this.scene = scene;
    this.peer = null;
    this.conn = null;
    this.roomCode = '';
    this.isHost = false;
    this.connected = false;
    this.listeners = new Map();
    this.connectionTimeout = null;
  }

  createRoom() {
    return new Promise((resolve, reject) => {
      this.roomCode = generateRoomCode();
      this.isHost = true;

      this.peer = new Peer(this.roomCode, {
        config: { iceServers: NETWORK.ICE_SERVERS },
      });

      this.peer.on('open', () => {
        this.connected = true;
        resolve(this.roomCode);
      });

      this.peer.on('connection', (dataConn) => {
        this.conn = dataConn;
        this.setupConnection(dataConn);
        dataConn.on('open', () => {
          this.connected = true;
          this.emit('connected', { gameMode: this.scene?.registry?.get('gameMode') });
        });
      });

      this.peer.on('error', (err) => reject(err));

      this.connectionTimeout = setTimeout(() => {
        if (!this.conn) {
          this.emit('timeout', {});
        }
      }, NETWORK.CONNECTION_TIMEOUT_MS);
    });
  }

  joinRoom(code) {
    return new Promise((resolve, reject) => {
      this.roomCode = code.toUpperCase();
      this.isHost = false;

      this.peer = new Peer({
        config: { iceServers: NETWORK.ICE_SERVERS },
      });

      this.peer.on('open', () => {
        this.conn = this.peer.connect(this.roomCode);
        this.setupConnection(this.conn);
        this.conn.on('open', () => {
          this.connected = true;
          clearTimeout(this.connectionTimeout);
          resolve();
        });
      });

      this.peer.on('error', (err) => reject(err));

      this.connectionTimeout = setTimeout(() => {
        if (!this.connected) reject(new Error('Connection timeout'));
      }, NETWORK.CONNECTION_TIMEOUT_MS);
    });
  }

  setupConnection(conn) {
    conn.on('data', (data) => this.emit('data', data));
    conn.on('close', () => {
      this.conn = null;
      this.connected = false;
      this.emit('disconnect', {});
    });
    conn.on('error', (err) => this.emit('error', err));
  }

  send(data) {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const list = this.listeners.get(event);
    if (list) {
      const i = list.indexOf(callback);
      if (i >= 0) list.splice(i, 1);
    }
  }

  emit(event, data) {
    const list = this.listeners.get(event);
    if (list) list.forEach((cb) => cb(data));
  }

  destroy() {
    clearTimeout(this.connectionTimeout);
    if (this.conn) this.conn.close();
    if (this.peer) this.peer.destroy();
    this.listeners.clear();
  }
}
