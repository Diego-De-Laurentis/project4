// Auth API integration (register/login/logout use backend, cookies included)
const API = '';

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : null;
  if (!res.ok) throw new Error((data && (data.error || data.message)) || `HTTP ${res.status}`);
  return data;
}

window.authSystem = {
  currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),

  async register({ email, password }) {
    const u = await postJSON(`${API}/api/auth/register`, { email, password });
    localStorage.setItem('currentUser', JSON.stringify({ id: u.id, email: u.email, role: 'user' }));
    this.currentUser = { id: u.id, email: u.email, role: 'user' };
    return u;
  },

  async login(email, password) {
    const u = await postJSON(`${API}/api/auth/login`, { email, password });
    localStorage.setItem('currentUser', JSON.stringify({ id: u.id, email: u.email, role: 'user' }));
    this.currentUser = { id: u.id, email: u.email, role: 'user' };
    return u;
  },

  async logout() {
    await postJSON(`${API}/api/auth/logout`, {});
    localStorage.removeItem('currentUser');
    this.currentUser = null;
  },

  isLoggedIn() { return !!this.currentUser; }
};
