import { Router } from 'express';
import auth from '../middleware/auth.js';
import supabase from '../db.js';

const router = Router();

const EARN_AMOUNT = 0.05;
const TIKTOK_EARN_AMOUNT = 0.10;
const VALID_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook'];

const DAILY_EARN_CAP = Number(process.env.DAILY_EARN_CAP ?? 2.0);
const RATE_LIMIT_MS = Number(process.env.SCROLL_RATE_LIMIT_MS ?? 5000);

/** In-memory map: userId -> last scroll timestamp (ms). */
const lastScrollAt = new Map();

function startOfTodayIso() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

router.post('/', auth, async (req, res) => {
  try {
    const { platform, scrollAmount } = req.body;

    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    const now = Date.now();
    const last = lastScrollAt.get(req.userId) ?? 0;
    if (now - last < RATE_LIMIT_MS) {
      const waitMs = RATE_LIMIT_MS - (now - last);
      return res.status(429).json({
        error: `Slow down. Try again in ${Math.ceil(waitMs / 1000)}s.`,
        retryAfterMs: waitMs,
      });
    }

    const { data: linked } = await supabase
      .from('linked_accounts')
      .select('id')
      .eq('user_id', req.userId)
      .eq('platform', platform)
      .single();

    if (!linked) {
      return res.status(403).json({ error: `${platform} is not connected` });
    }

    const { data: todayEvents } = await supabase
      .from('scroll_events')
      .select('earned')
      .eq('user_id', req.userId)
      .gte('created_at', startOfTodayIso());

    const earnedToday = (todayEvents ?? []).reduce(
      (sum, row) => sum + Number(row.earned ?? 0),
      0
    );

    if (earnedToday >= DAILY_EARN_CAP) {
      return res.status(429).json({
        error: `Daily cap reached. You have earned $${earnedToday.toFixed(2)} today (max $${DAILY_EARN_CAP.toFixed(2)}). Come back tomorrow!`,
        cap: DAILY_EARN_CAP,
        earnedToday: Number(earnedToday.toFixed(2)),
      });
    }

    const baseEarn = platform === 'tiktok' ? TIKTOK_EARN_AMOUNT : EARN_AMOUNT;
    const remainingToday = DAILY_EARN_CAP - earnedToday;
    const earned = Number(Math.min(baseEarn, remainingToday).toFixed(2));

    const { data: bal } = await supabase
      .from('balances')
      .select('amount')
      .eq('user_id', req.userId)
      .single();

    const currentAmount = bal?.amount ?? 0;
    const newAmount = Number((currentAmount + earned).toFixed(2));

    await supabase
      .from('balances')
      .update({ amount: newAmount })
      .eq('user_id', req.userId);

    await supabase.from('scroll_events').insert({
      user_id: req.userId,
      platform,
      scroll_amount: scrollAmount || 0,
      earned,
    });

    lastScrollAt.set(req.userId, now);

    res.json({
      earned,
      balance: newAmount,
      earnedToday: Number((earnedToday + earned).toFixed(2)),
      dailyCap: DAILY_EARN_CAP,
    });
  } catch (err) {
    console.error('Scroll event error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
