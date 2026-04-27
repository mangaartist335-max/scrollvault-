import { Router } from 'express';
import supabase from '../db.js';

const router = Router();

let cache = null;
let cachedAt = 0;
const CACHE_MS = 30_000;

router.get('/', async (_req, res) => {
  try {
    if (cache && Date.now() - cachedAt < CACHE_MS) {
      return res.json(cache);
    }

    const [usersRes, eventsRes, earnedRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('scroll_events').select('id', { count: 'exact', head: true }),
      supabase.from('scroll_events').select('earned'),
    ]);

    const totalUsers = usersRes.count ?? 0;
    const totalScrollEvents = eventsRes.count ?? 0;
    const totalEarned = (earnedRes.data ?? []).reduce(
      (sum, row) => sum + Number(row.earned ?? 0),
      0
    );

    cache = {
      totalUsers,
      totalScrollEvents,
      totalEarned: Number(totalEarned.toFixed(2)),
    };
    cachedAt = Date.now();

    res.json(cache);
  } catch (err) {
    console.error('Stats fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
