// All calls to the server go through api(). The login (token, role, name) is kept in the browser.
const ls = {
  get: k => { try { return localStorage.getItem(k) || '' } catch { return '' } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch {} },
  del: k => { try { localStorage.removeItem(k) } catch {} },
};
let token = ls.get('token');

export const session = {
  get role() { return ls.get('role') },      // 'super' | 'scorer' | ''
  get name() { return ls.get('name') },
  get id() { return ls.get('uid') },
  get isSuper() { return ls.get('role') === 'super' },
  get isStaff() { return !!ls.get('role') },
  set(d) { token = d.token; ls.set('token', d.token); ls.set('role', d.role); ls.set('name', d.name || ''); ls.set('uid', d.id || '') },
  clear() { token = ''; ['token', 'role', 'name', 'uid'].forEach(ls.del) },
};

export async function api(path, method = 'GET', body) {
  const r = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && token) session.clear();
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}
