import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dns from 'node:dns/promises';
import authRoutes from './routes/auth.js';
import socialAuthRoutes from './routes/socialAuth.js';
import balanceRoutes from './routes/balance.js';
import scrollRoutes from './routes/scroll.js';
import oauthRoutes from './routes/oauth.js';
import statsRoutes from './routes/stats.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = new Set([
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]);

app.use(
  cors({
    origin(origin, callback) {
      // Allow local dev origins and Vercel preview/production domains.
      // (This prevents "Failed to fetch" when the frontend runs on https://*.vercel.app.)
      const isVercel = typeof origin === 'string' && origin.endsWith('.vercel.app');
      if (!origin || allowedOrigins.has(origin) || origin.startsWith('chrome-extension://') || isVercel) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use((req, _res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`→ ${req.method} ${req.path}`);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', socialAuthRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/scroll-event', scrollRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

async function start() {
  const su = process.env.SUPABASE_URL;
  if (su) {
    try {
      const host = new URL(su).hostname;
      await dns.lookup(host);
    } catch (e) {
      console.error(
        '[FATAL] SUPABASE_URL host does not resolve in DNS. Copy the exact "Project URL" from Supabase → Project Settings → API into server/.env and Render.',
        e?.code || e?.message
      );
    }
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ScrollVault API listening on 0.0.0.0:${PORT}`);
  });
}

start();