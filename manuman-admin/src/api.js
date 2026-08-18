const BASE = 'https://manuman-api.vercel.app/api';

export const api = {
  get: (path) => fetch(`${BASE}${path}`).then(r => r.json()),
  post: (path, body) => fetch(`${BASE}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json()),
  patch: (path, body) => fetch(`${BASE}${path}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json()),
  put: (path, body) => fetch(`${BASE}${path}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json()),
  del: (path) => fetch(`${BASE}${path}`, { method: 'DELETE' }).then(r => r.json()),
};
