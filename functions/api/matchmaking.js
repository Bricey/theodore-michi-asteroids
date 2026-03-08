/**
 * Matchmaking API for automatic game discovery.
 * GET: list open games (TTL 5 min)
 * POST: register game (host)
 * DELETE: remove game (host leave or guest claim)
 */

const GAME_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function onRequestGet(context) {
  try {
    const db = context.env.MATCHMAKING_DB;
    if (!db) {
      return Response.json({ error: 'Database not configured' }, { status: 500 });
    }

    const cutoff = Date.now() - GAME_TTL_MS;
    const result = await db
      .prepare('SELECT peer_id, game_mode FROM open_games WHERE created_at > ?')
      .bind(cutoff)
      .all();

    const games = (result.results || []).map((r) => ({
      peerId: r.peer_id,
      gameMode: r.game_mode,
    }));

    return Response.json(games);
  } catch (err) {
    console.error('Matchmaking GET error:', err);
    return Response.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const db = context.env.MATCHMAKING_DB;
    if (!db) {
      return Response.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await context.request.json();
    const { peerId, gameMode } = body;

    if (!peerId || !gameMode) {
      return Response.json({ error: 'peerId and gameMode required' }, { status: 400 });
    }

    await db
      .prepare('INSERT OR REPLACE INTO open_games (peer_id, game_mode, created_at) VALUES (?, ?, ?)')
      .bind(peerId, gameMode, Date.now())
      .run();

    return Response.json({ ok: true });
  } catch (err) {
    console.error('Matchmaking POST error:', err);
    return Response.json({ error: 'Failed to register game' }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  try {
    const db = context.env.MATCHMAKING_DB;
    if (!db) {
      return Response.json({ error: 'Database not configured' }, { status: 500 });
    }

    const url = new URL(context.request.url);
    const peerId = url.searchParams.get('peerId');

    if (!peerId) {
      return Response.json({ error: 'peerId required' }, { status: 400 });
    }

    await db.prepare('DELETE FROM open_games WHERE peer_id = ?').bind(peerId).run();

    return Response.json({ ok: true });
  } catch (err) {
    console.error('Matchmaking DELETE error:', err);
    return Response.json({ error: 'Failed to remove game' }, { status: 500 });
  }
}
