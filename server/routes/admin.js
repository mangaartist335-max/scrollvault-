import { Router } from 'express';
import supabase from '../db.js';

const router = Router();

function requireAdmin(req, res, next) {
  const key = req.query.key || req.headers['x-admin-key'];
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_KEY not configured on server' });
  }
  if (!key || key !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const [
      usersRes,
      eventsRes,
      eventsAllRes,
      balancesRes,
      recentRes,
      linkedRes,
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('scroll_events').select('id', { count: 'exact', head: true }),
      supabase.from('scroll_events').select('platform, earned'),
      supabase.from('balances').select('amount'),
      supabase
        .from('scroll_events')
        .select('id, platform, earned, scroll_amount, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('linked_accounts').select('platform'),
    ]);

    const totalUsers = usersRes.count ?? 0;
    const totalScrollEvents = eventsRes.count ?? 0;

    const events = eventsAllRes.data ?? [];
    const totalEarned = events.reduce(
      (sum, row) => sum + Number(row.earned ?? 0),
      0
    );

    const platformBreakdown = events.reduce((acc, row) => {
      const p = row.platform || 'unknown';
      if (!acc[p]) acc[p] = { count: 0, earned: 0 };
      acc[p].count += 1;
      acc[p].earned += Number(row.earned ?? 0);
      return acc;
    }, {});
    Object.keys(platformBreakdown).forEach((p) => {
      platformBreakdown[p].earned = Number(platformBreakdown[p].earned.toFixed(2));
    });

    const balances = balancesRes.data ?? [];
    const totalBalanceInDb = balances.reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0
    );
    const totalWithdrawn = Math.max(0, totalEarned - totalBalanceInDb);

    const linked = linkedRes.data ?? [];
    const linkedBreakdown = linked.reduce((acc, row) => {
      const p = row.platform || 'unknown';
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalUsers,
      totalScrollEvents,
      totalEarned: Number(totalEarned.toFixed(2)),
      totalBalanceInDb: Number(totalBalanceInDb.toFixed(2)),
      totalWithdrawn: Number(totalWithdrawn.toFixed(2)),
      platformBreakdown,
      linkedBreakdown,
      recentActivity: recentRes.data ?? [],
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
