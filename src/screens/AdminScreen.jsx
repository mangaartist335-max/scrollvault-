import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AmbientBackground from '../components/AmbientBackground';
import { apiGetAdminStats } from '../lib/api';
import {
  staggerContainer,
  fadeUp,
  fadeIn,
  pageVariants,
  tapScale,
} from '../motion/variants';

const ADMIN_KEY_STORAGE = 'sv_admin_key';

function StatCard({ label, value, accent = 'text-vault-text', sub }) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl bg-vault-card border border-vault-border p-5"
    >
      <div className="text-xs uppercase tracking-wider text-vault-text-dim">
        {label}
      </div>
      <div className={`mt-2 text-2xl sm:text-3xl font-black ${accent}`}>
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-xs text-vault-text-secondary">{sub}</div>
      )}
    </motion.div>
  );
}

function formatMoney(n) {
  return `$${Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNum(n) {
  return Number(n ?? 0).toLocaleString();
}

function timeAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.max(1, Math.floor(ms / 1000))}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function shortId(id) {
  if (!id) return '—';
  return String(id).slice(0, 8);
}

function AdminGate({ onUnlock }) {
  const navigate = useNavigate();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!key) return;
    setLoading(true);
    setError('');
    try {
      await apiGetAdminStats(key);
      sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
      onUnlock(key);
    } catch (err) {
      setError(err.message || 'Invalid key');
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center px-4 relative"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AmbientBackground />
      <motion.form
        onSubmit={submit}
        className="relative z-10 w-full max-w-sm rounded-2xl bg-vault-card border border-vault-border p-6"
        variants={staggerContainer(0.06, 0.05)}
        initial="hidden"
        animate="show"
      >
        <motion.h1
          variants={fadeUp}
          className="text-2xl font-black text-vault-text"
        >
          Admin access
        </motion.h1>
        <motion.p
          variants={fadeIn}
          className="mt-1 text-sm text-vault-text-secondary"
        >
          Enter the admin key to view ScrollVault analytics.
        </motion.p>

        <motion.input
          variants={fadeUp}
          type="password"
          autoFocus
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          className="mt-5 w-full px-4 py-3 rounded-xl bg-vault-bg border border-vault-border-light text-vault-text placeholder:text-vault-text-dim focus:outline-none focus:border-vault-cyan"
        />

        <motion.button
          variants={fadeUp}
          type="submit"
          disabled={loading}
          whileHover={loading ? {} : { y: -1, scale: 1.01 }}
          whileTap={loading ? {} : tapScale}
          className="mt-4 w-full py-3 rounded-xl bg-vault-cyan text-vault-bg font-bold cursor-pointer disabled:cursor-wait"
        >
          {loading ? 'Verifying…' : 'Unlock'}
        </motion.button>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-sm text-vault-red text-center"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          type="button"
          onClick={() => navigate('/')}
          variants={fadeIn}
          className="mt-4 w-full text-xs text-vault-text-dim hover:text-vault-cyan transition-colors cursor-pointer"
        >
          ← Back to ScrollVault
        </motion.button>
      </motion.form>
    </motion.div>
  );
}

export default function AdminScreen() {
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState(
    () => sessionStorage.getItem(ADMIN_KEY_STORAGE) || ''
  );
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async (key) => {
    setLoading(true);
    setError('');
    try {
      const result = await apiGetAdminStats(key);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load admin stats');
      if ((err.message || '').toLowerCase().includes('unauthorized')) {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        setAdminKey('');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) fetchData(adminKey);
  }, [adminKey]);

  const logout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey('');
    setData(null);
  };

  if (!adminKey) {
    return <AdminGate onUnlock={(k) => setAdminKey(k)} />;
  }

  const platformEntries = data?.platformBreakdown
    ? Object.entries(data.platformBreakdown).sort(
        (a, b) => b[1].count - a[1].count
      )
    : [];

  const linkedEntries = data?.linkedBreakdown
    ? Object.entries(data.linkedBreakdown).sort((a, b) => b[1] - a[1])
    : [];

  const topPlatformCount = platformEntries[0]?.[1].count || 1;

  return (
    <motion.div
      className="min-h-screen relative pb-16"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AmbientBackground />

      <header className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-vault-cyan">ScrollVault</span>
          <span className="px-2 py-0.5 rounded-full bg-vault-gold/15 text-vault-gold text-[10px] font-black uppercase tracking-wider border border-vault-gold/30">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(adminKey)}
            className="text-sm text-vault-text-secondary hover:text-vault-cyan transition-colors cursor-pointer"
          >
            ↻ Refresh
          </button>
          <button
            onClick={logout}
            className="text-sm text-vault-text-secondary hover:text-vault-red transition-colors cursor-pointer"
          >
            Lock
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-vault-text-secondary hover:text-vault-cyan transition-colors cursor-pointer"
          >
            ← Home
          </button>
        </div>
      </header>

      <motion.main
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8"
        variants={staggerContainer(0.06, 0.05)}
        initial="hidden"
        animate="show"
      >
        <motion.h1
          variants={fadeUp}
          className="text-3xl sm:text-4xl font-black text-vault-text"
        >
          Analytics dashboard
        </motion.h1>
        <motion.p
          variants={fadeIn}
          className="mt-1 text-sm text-vault-text-secondary"
        >
          Live data from your Supabase. {loading && '· Refreshing…'}
        </motion.p>

        {error && (
          <motion.div
            variants={fadeIn}
            className="mt-6 rounded-xl border border-vault-red/40 bg-vault-red/10 text-vault-red p-4 text-sm"
          >
            {error}
          </motion.div>
        )}

        {data && (
          <>
            {/* Top stats */}
            <motion.section
              className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
              variants={staggerContainer(0.05, 0.05)}
              initial="hidden"
              animate="show"
            >
              <StatCard
                label="Users"
                value={formatNum(data.totalUsers)}
                accent="text-vault-cyan"
              />
              <StatCard
                label="Scroll events"
                value={formatNum(data.totalScrollEvents)}
              />
              <StatCard
                label="Total earned"
                value={formatMoney(data.totalEarned)}
                accent="text-vault-green"
                sub="lifetime, all users"
              />
              <StatCard
                label="Withdrawn"
                value={formatMoney(data.totalWithdrawn)}
                accent="text-vault-gold"
                sub={`In wallets: ${formatMoney(data.totalBalanceInDb)}`}
              />
            </motion.section>

            {/* Platform breakdown */}
            <motion.section
              variants={fadeUp}
              className="mt-10 rounded-2xl bg-vault-card border border-vault-border p-6"
            >
              <h2 className="text-lg font-bold text-vault-text">
                Scrolls by platform
              </h2>
              {platformEntries.length === 0 ? (
                <p className="mt-3 text-sm text-vault-text-secondary">
                  No scroll events yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {platformEntries.map(([platform, info]) => {
                    const pct = (info.count / topPlatformCount) * 100;
                    return (
                      <div key={platform}>
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="font-semibold text-vault-text capitalize">
                            {platform}
                          </span>
                          <span className="text-vault-text-secondary">
                            {formatNum(info.count)} scrolls ·{' '}
                            <span className="text-vault-green">
                              {formatMoney(info.earned)}
                            </span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 rounded-full bg-vault-bg overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-vault-cyan to-vault-green"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.section>

            {/* Linked accounts */}
            <motion.section
              variants={fadeUp}
              className="mt-6 rounded-2xl bg-vault-card border border-vault-border p-6"
            >
              <h2 className="text-lg font-bold text-vault-text">
                Connected accounts
              </h2>
              {linkedEntries.length === 0 ? (
                <p className="mt-3 text-sm text-vault-text-secondary">
                  No linked accounts yet.
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {linkedEntries.map(([platform, count]) => (
                    <span
                      key={platform}
                      className="px-3 py-1.5 rounded-full bg-vault-bg border border-vault-border-light text-sm text-vault-text"
                    >
                      <span className="capitalize font-semibold">{platform}</span>
                      <span className="ml-2 text-vault-text-secondary">
                        {formatNum(count)}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </motion.section>

            {/* Recent activity */}
            <motion.section
              variants={fadeUp}
              className="mt-6 rounded-2xl bg-vault-card border border-vault-border p-6"
            >
              <h2 className="text-lg font-bold text-vault-text">
                Recent activity
              </h2>
              <p className="mt-1 text-xs text-vault-text-dim">
                Last 20 scroll events.
              </p>
              {(data.recentActivity ?? []).length === 0 ? (
                <p className="mt-3 text-sm text-vault-text-secondary">
                  No activity yet.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-vault-text-dim border-b border-vault-border">
                        <th className="py-2 pr-4 font-semibold">When</th>
                        <th className="py-2 pr-4 font-semibold">User</th>
                        <th className="py-2 pr-4 font-semibold">Platform</th>
                        <th className="py-2 pr-4 font-semibold text-right">
                          Earned
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentActivity.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-vault-border/50 last:border-b-0"
                        >
                          <td className="py-2 pr-4 text-vault-text-secondary">
                            {timeAgo(row.created_at)}
                          </td>
                          <td className="py-2 pr-4 font-mono text-xs text-vault-text-secondary">
                            {shortId(row.user_id)}
                          </td>
                          <td className="py-2 pr-4 capitalize text-vault-text">
                            {row.platform}
                          </td>
                          <td className="py-2 pr-4 text-right text-vault-green font-semibold">
                            {formatMoney(row.earned)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.section>
          </>
        )}

        {!data && !error && loading && (
          <p className="mt-8 text-sm text-vault-text-secondary">Loading…</p>
        )}
      </motion.main>
    </motion.div>
  );
}
