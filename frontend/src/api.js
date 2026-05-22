async function getJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API ${url} ${res.status}`);
    return res.json();
}

async function postJson(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`API ${url} ${res.status}`);
    return res;
}

async function del(url) {
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(`API ${url} ${res.status}`);
    return res;
}

export const api = {
    fetchHistory: () => getJson('/api/records'),
    saveRecord: (record) => postJson('/api/records', record),
    clearHistory: () => del('/api/records'),

    fetchWeakness: () => getJson('/api/weakness'),
    bumpWeakness: (zone) => postJson('/api/weakness', { zone, count: 1 }),

    fetchWubi: (char) => getJson(`/api/wubi/${char}`)
};
