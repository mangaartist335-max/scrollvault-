import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AmbientBackground from '../components/AmbientBackground';
import { apiGetPublicStats } from '../lib/api';
import {
  staggerContainer,
  fadeUp,
  fadeIn,
  pageVariants,
  tapScale,
  spring,
} from '../motion/variants';

const PLATFORMS = [
  { name: 'Instagram', icon: 'IG', tint: 'from-pink-500/20 to-orange-500/20' },
  { name: 'TikTok', icon: '♪', tint: 'from-cyan-400/20 to-pink-500/20', bonus: true },
  { name: 'YouTube Shorts', icon: '▶', tint: 'from-red-500/20 to-rose-500/20' },
  { name: 'Twitter / X', icon: '𝕏', tint: 'from-slate-400/20 to-slate-700/20' },
  { name: 'Facebook', icon: 'f', tint: 'from-blue-500/20 to-indigo-500/20' },
];

const STEPS = [
  {
    n: '1',
    title: 'Connect your accounts',
    body: 'Link Instagram, TikTok, YouTube, X, or Facebook in one tap.',
  },
  {
    n: '2',
    title: 'Scroll like you already do',
    body: 'We pay you per video, short, and reel — TikTok pays double.',
  },
  {
    n: '3',
    title: 'Cash out to PayPal',
    body: 'Hit $10 and we send it straight to your PayPal account.',
  },
];

function StatTile({ label, value, accent }) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex-1 min-w-[140px] rounded-2xl bg-vault-card border border-vault-border p-5 text-center"
    >
      <div className={`text-3xl sm:text-4xl font-black ${accent}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-vault-text-dim">
        {label}
      </div>
    </motion.div>
  );
}

function formatNum(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatMoney(n) {
  if (n == null) return '—';
  return `$${Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function LandingScreen() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    let alive = true;
    apiGetPublicStats()
      .then((data) => {
        if (alive) setStats(data);
      })
      .catch(() => {
        if (alive) setStatsError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <motion.div
      className="min-h-screen relative"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AmbientBackground />

      {/* Top nav */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-black text-vault-cyan">
            ScrollVault
          </span>
          <span className="text-lg">🔒</span>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/login')}
            className="text-sm sm:text-base text-vault-text-secondary hover:text-vault-cyan transition-colors cursor-pointer"
          >
            Log in
          </button>
          <motion.button
            onClick={() => navigate('/signup')}
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={tapScale}
            className="px-4 py-2 rounded-xl bg-vault-cyan text-vault-bg text-sm sm:text-base font-bold cursor-pointer"
          >
            Get started
          </motion.button>
        </nav>
      </header>

      {/* Hero */}
      <motion.section
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 pt-10 sm:pt-16 pb-12 text-center"
        variants={staggerContainer(0.08, 0.05)}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vault-cyan/10 border border-vault-cyan/30 text-vault-cyan text-xs font-semibold mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-vault-cyan animate-pulse" />
          New: TikTok now pays 2× per scroll
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-4xl sm:text-6xl md:text-7xl font-black text-vault-text leading-[1.05] tracking-tight"
        >
          Earn money just by{' '}
          <span className="bg-gradient-to-r from-vault-cyan to-vault-green bg-clip-text text-transparent">
            scrolling.
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-6 text-base sm:text-xl text-vault-text-secondary max-w-2xl mx-auto"
        >
          ScrollVault rewards you for the time you already spend on Instagram,
          TikTok, YouTube Shorts, X, and Facebook. Connect once, scroll, get
          paid to PayPal.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <motion.button
            onClick={() => navigate('/signup')}
            whileHover={{
              y: -2,
              scale: 1.02,
              boxShadow: '0 0 30px -4px rgba(56,189,248,0.5)',
            }}
            whileTap={tapScale}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-vault-cyan text-vault-bg font-extrabold text-lg cursor-pointer"
          >
            Start earning — it's free
          </motion.button>
          <motion.button
            onClick={() => navigate('/login')}
            whileHover={{ y: -1 }}
            whileTap={tapScale}
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-vault-border-light text-vault-text font-semibold text-lg cursor-pointer hover:border-vault-cyan/40 transition-colors"
          >
            I already have an account
          </motion.button>
        </motion.div>

        <motion.p
          variants={fadeIn}
          className="mt-4 text-xs text-vault-text-dim"
        >
          $0.05/scroll · $0.10/scroll on TikTok · $10 minimum cashout
        </motion.p>
      </motion.section>

      {/* Live stats */}
      <motion.section
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 pb-12"
        variants={staggerContainer(0.08, 0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.h2
          variants={fadeUp}
          className="text-center text-xs uppercase tracking-[0.2em] text-vault-text-dim mb-4"
        >
          Live ScrollVault stats
        </motion.h2>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <StatTile
            label="Total users"
            value={statsError ? '—' : formatNum(stats?.totalUsers)}
            accent="text-vault-cyan"
          />
          <StatTile
            label="Scrolls counted"
            value={statsError ? '—' : formatNum(stats?.totalScrollEvents)}
            accent="text-vault-text"
          />
          <StatTile
            label="Total earned"
            value={statsError ? '—' : formatMoney(stats?.totalEarned)}
            accent="text-vault-green"
          />
        </div>
      </motion.section>

      {/* How it works */}
      <motion.section
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-16"
        variants={staggerContainer(0.1, 0.05)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2
          variants={fadeUp}
          className="text-3xl sm:text-4xl font-black text-vault-text text-center"
        >
          How it works
        </motion.h2>
        <motion.p
          variants={fadeIn}
          className="text-center text-vault-text-secondary mt-2"
        >
          Three steps. No hoops. No surveys.
        </motion.p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <motion.div
              key={s.n}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl bg-vault-card border border-vault-border p-6 hover:border-vault-cyan/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-vault-cyan/15 text-vault-cyan flex items-center justify-center font-black text-lg">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-bold text-vault-text">
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-vault-text-secondary leading-relaxed">
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Platforms */}
      <motion.section
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-16"
        variants={staggerContainer(0.06, 0.05)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2
          variants={fadeUp}
          className="text-3xl sm:text-4xl font-black text-vault-text text-center"
        >
          Works with the apps you already use
        </motion.h2>
        <motion.p
          variants={fadeIn}
          className="text-center text-vault-text-secondary mt-2"
        >
          Connect your accounts in seconds.
        </motion.p>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {PLATFORMS.map((p) => (
            <motion.div
              key={p.name}
              variants={fadeUp}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`relative rounded-2xl border border-vault-border bg-gradient-to-br ${p.tint} p-5 text-center overflow-hidden`}
            >
              {p.bonus && (
                <span className="absolute top-2 right-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-vault-gold/20 text-vault-gold border border-vault-gold/30">
                  2×
                </span>
              )}
              <div className="text-3xl font-black text-vault-text">{p.icon}</div>
              <div className="mt-2 text-sm font-semibold text-vault-text">
                {p.name}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Final CTA */}
      <motion.section
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0, transition: spring.gentle }}
        viewport={{ once: true, amount: 0.4 }}
      >
        <div className="rounded-3xl border border-vault-cyan/30 bg-gradient-to-br from-vault-cyan/10 via-vault-card to-vault-card p-8 sm:p-12 text-center relative overflow-hidden">
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(56,189,248,0.4) 0%, transparent 70%)',
            }}
          />
          <h2 className="relative text-3xl sm:text-4xl font-black text-vault-text">
            Your scrolling is already worth something.
          </h2>
          <p className="relative mt-3 text-base sm:text-lg text-vault-text-secondary max-w-xl mx-auto">
            Stop giving it away for free. Sign up and start cashing in on the
            time you already spend on your phone.
          </p>
          <motion.button
            onClick={() => navigate('/signup')}
            whileHover={{
              y: -2,
              scale: 1.02,
              boxShadow: '0 0 30px -4px rgba(56,189,248,0.5)',
            }}
            whileTap={tapScale}
            className="relative mt-8 px-10 py-4 rounded-xl bg-vault-cyan text-vault-bg font-extrabold text-lg cursor-pointer"
          >
            Create my free account
          </motion.button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-10 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-vault-text-dim">
          <button
            onClick={() => navigate('/privacy')}
            className="hover:text-vault-cyan transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <a
            href="mailto:hello@scrollvault.app"
            className="hover:text-vault-cyan transition-colors"
          >
            Contact
          </a>
          <button
            onClick={() => navigate('/login')}
            className="hover:text-vault-cyan transition-colors cursor-pointer"
          >
            Log in
          </button>
        </div>
        <p className="mt-4 text-xs text-vault-text-dim">
          © {new Date().getFullYear()} ScrollVault. Earnings vary based on
          activity and platform availability.
        </p>
      </footer>
    </motion.div>
  );
}
