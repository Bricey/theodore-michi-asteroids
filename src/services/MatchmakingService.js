/**
 * MatchmakingService: Client for the matchmaking API.
 * Fetches open games, registers host games, removes games on leave/claim.
 */

const API_BASE = '/api/matchmaking';

export async function getOpenGames() {
  const res = await fetch(API_BASE);
  if (!res.ok) {
    throw new Error('Failed to fetch open games');
  }
  return res.json();
}

export async function registerGame(peerId, gameMode) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ peerId, gameMode }),
  });
  if (!res.ok) {
    throw new Error('Failed to register game');
  }
  return res.json();
}

export async function removeGame(peerId) {
  const res = await fetch(`${API_BASE}?peerId=${encodeURIComponent(peerId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to remove game');
  }
  return res.json();
}
