export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('sv_token');
}

export function setToken(token) {
  localStorage.setItem('sv_token', token);
}

export function clearToken() {
  localStorage.removeItem('sv_token');
  localStorage.removeItem('sv_user');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── Auth ───────────────────────────────────────────────────────────

export async function apiLogin(email, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  localStorage.setItem('sv_user', JSON.stringify(data.user));
  return data;
}

export async function apiSignUp(name, email, password) {
  const data = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  setToken(data.token);
  localStorage.setItem('sv_user', JSON.stringify(data.user));
  return data;
}

export async function apiGetMe() {
  return request('/api/auth/me');
}

// ─── Balance ────────────────────────────────────────────────────────

export async function apiGetBalance() {
  return request('/api/balance');
}

export async function apiResetBalance() {
  return request('/api/balance/reset', { method: 'POST' });
}

export async function apiWithdraw(amount, method, details) {
  return request('/api/balance/withdraw', {
    method: 'POST',
    body: JSON.stringify({ amount, method, details }),
  });
}

// ─── OAuth ──────────────────────────────────────────────────────────

export async function apiGetOAuthStatus() {
  return request('/api/oauth/status');
}

export async function apiConnectPlatform(platform) {
  const data = await request(`/api/oauth/${platform}/connect`);
  return data.url;
}

export async function apiDisconnectPlatform(platform) {
  return request(`/api/oauth/${platform}/disconnect`, { method: 'DELETE' });
}

// ─── Scroll Events ──────────────────────────────────────────────────

export async function apiReportScroll(platform, scrollAmount) {
  return request('/api/scroll-event', {
    method: 'POST',
    body: JSON.stringify({ platform, scrollAmount }),
  });
}

// ─── Public stats ───────────────────────────────────────────────────

export async function apiGetPublicStats() {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) throw new Error('Stats unavailable');
  return res.json();
}

// ─── Admin ──────────────────────────────────────────────────────────

export async function apiGetAdminStats(key) {
  const res = await fetch(
    `${API_BASE}/api/admin/stats?key=${encodeURIComponent(key)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Admin stats unavailable');
  return data;
}