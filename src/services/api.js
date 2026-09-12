// Thin fetch wrapper. Always sends cookies, parses JSON, and throws an Error
// with the server's `msg` on non-2xx responses.
export class ApiError extends Error {
    constructor(status, msg) {
        super(msg);
        this.status = status;
    }
}

export async function api(path, { method = 'GET', body } = {}) {
    const res = await fetch(path, {
        method,
        credentials: 'include',
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return null;
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON body */ }
    if (!res.ok) throw new ApiError(res.status, data?.msg || `Request failed (${res.status})`);
    return data;
}

export function contentPath(type, id) {
    if (type === 'artist') return `/artist/${id}`;
    if (type === 'track') return `/song/${id}`;
    return `/album/${id}`;
}
