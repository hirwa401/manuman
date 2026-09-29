import { API } from '../config';

// Small fetch wrapper: JSON in/out with unified error handling.
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || `Request failed (${res.status}).`);
    error.status = res.status;
    throw error;
  }
  return data;
}

// Attach the Supabase access token when the caller has one.
export async function authedFetch(path, token, options = {}) {
  return apiFetch(path, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof File) ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

export async function uploadImage(file) {
  const res = await fetch(`${API}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'image/jpeg' },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Image upload failed.');
  return data.url;
}
