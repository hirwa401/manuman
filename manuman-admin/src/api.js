const BASE = __DEV__ ? 'http://localhost:5001/api' : 'https://manuman-api.vercel.app/api';
let adminToken = null;

export function setAdminToken(token) {
  adminToken = token || null;
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { ...(adminToken ? { 'X-Admin-Token': adminToken } : {}), ...(options.headers || {}) }
    });
  } catch (error) {
    throw new Error('Unable to reach the server. Check your internet connection.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status}).`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }),
  patch: (path, body) => request(path, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }),
  put: (path, body) => request(path, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }),
  del: (path) => request(path, { method: 'DELETE' }),
};
