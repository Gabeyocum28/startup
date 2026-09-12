import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { AverageBadge } from '../components/Stars';
import { Loading, EmptyState, ErrorMessage } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../app.css';
import './search.css';

const DEBOUNCE_MS = 350;
const RECENT_KEY = 'polyrhythmd.recentSearches';
const RESULTS_KEY = 'polyrhythmd.lastSearch';
const RECENT_MAX = 8;

function scoreResult(item, query) {
    const q = query.toLowerCase();
    const name = item.name.toLowerCase();
    if (name === q) return 50;
    if (name.startsWith(q)) return 45;
    if (name.includes(` ${q}`) || name.includes(`${q} `)) return 40;
    if (name.includes(q)) return 35;
    const secondary = (item._artist || '').toLowerCase();
    if (secondary === q) return 40;
    if (secondary.startsWith(q)) return 35;
    if (secondary.includes(q)) return 25;
    return 10;
}

function rank(data, q) {
    const all = [
        ...(data.artists || []).map((a, i) => ({ ...a, _type: 'artist', _artist: a.name, _rank: i })),
        ...(data.albums || []).map((a, i) => ({ ...a, _type: 'album', _artist: a.artists[0].name, _rank: i })),
        ...(data.tracks || []).map((t, i) => ({ ...t, _type: 'track', _artist: t.artist, _rank: i })),
    ];
    all.forEach(item => {
        item._score = scoreResult(item, q) + Math.max(0, 15 - item._rank * 3);
        if (item._type === 'artist' && item.fans) item._score += Math.min(Math.log10(item.fans + 1), 2);
    });
    return all.sort((a, b) => b._score - a._score);
}

function readJson(storage, key, fallback) {
    try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeJson(storage, key, value) {
    try { storage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

export function Search() {
    useDocumentTitle('Search', 'Find albums, songs, and artists to rate and review.');
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const urlQuery = params.get('q') || '';

    // Restore the last search so Back returns to the same results.
    const saved = React.useMemo(() => readJson(sessionStorage, RESULTS_KEY, null), []);
    const [query, setQuery] = React.useState(urlQuery || saved?.query || '');
    const [results, setResults] = React.useState(saved && (!urlQuery || saved.query === urlQuery) ? saved.results : []);
    const [averages, setAverages] = React.useState(saved?.averages || {});
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [searched, setSearched] = React.useState(!!saved?.results?.length);
    const [recent, setRecent] = React.useState(() => readJson(localStorage, RECENT_KEY, []));
    const latest = React.useRef(0);

    const runSearch = React.useCallback(async (q) => {
        const trimmed = q.trim();
        if (!trimmed) { setResults([]); setSearched(false); return; }
        const seq = ++latest.current;
        setLoading(true);
        setError(null);
        try {
            const data = await api(`/api/search?q=${encodeURIComponent(trimmed)}`);
            if (seq !== latest.current) return; // a newer search superseded this one
            const ranked = rank(data, trimmed);
            setResults(ranked);
            setSearched(true);

            const keys = ranked.map(r => `${r._type}:${r.id}`).join(',');
            const avg = keys ? await api(`/api/ratings/batch?keys=${encodeURIComponent(keys)}`).catch(() => ({})) : {};
            if (seq !== latest.current) return;
            setAverages(avg);
            writeJson(sessionStorage, RESULTS_KEY, { query: trimmed, results: ranked, averages: avg });

            setRecent(prev => {
                const next = [trimmed, ...prev.filter(r => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, RECENT_MAX);
                writeJson(localStorage, RECENT_KEY, next);
                return next;
            });
        } catch (err) {
            if (seq !== latest.current) return;
            setError(err.message || 'Search failed. Try again.');
            setResults([]);
        } finally {
            if (seq === latest.current) setLoading(false);
        }
    }, []);

    // Search from the URL (e.g. /search?q=radiohead) on arrival.
    React.useEffect(() => {
        if (urlQuery && urlQuery !== saved?.query) { setQuery(urlQuery); runSearch(urlQuery); }
    }, [urlQuery, runSearch, saved]);

    // Debounced search as you type.
    React.useEffect(() => {
        if (!query.trim()) return undefined;
        if (query === saved?.query && results.length) return undefined;
        const t = setTimeout(() => runSearch(query), DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

    function submit(e) {
        e.preventDefault();
        setParams(query.trim() ? { q: query.trim() } : {});
        runSearch(query);
    }

    function clearRecent() {
        setRecent([]);
        writeJson(localStorage, RECENT_KEY, []);
    }

    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    const onImgError = (e) => { e.target.src = '/images/no_album_cover.jpg'; };

    function renderResult(item) {
        const avg = averages[`${item._type}:${item.id}`];
        if (item._type === 'artist') {
            return (
                <div key={`artist-${item.id}`} className="review-card search-result-card" onClick={() => navigate(`/artist/${item.id}`)}>
                    <div className="album-info search-album-info">
                        <img src={item.image || '/images/no_album_cover.jpg'} alt={item.name} className="album-cover search-album-cover search-artist-cover" loading="lazy" onError={onImgError} />
                        <div className="album-details">
                            <h3 className="album-title">{item.name} <AverageBadge {...(avg || {})} /></h3>
                            <p className="search-result-type">Artist</p>
                            <p className="album-artist">{item.fans.toLocaleString()} fans</p>
                        </div>
                    </div>
                </div>
            );
        }
        if (item._type === 'album') {
            return (
                <div key={`album-${item.id}`} className="review-card search-result-card" onClick={() => navigate(`/album/${item.id}`)}>
                    <div className="album-info search-album-info">
                        <img src={item.images?.[2]?.url || item.images?.[0]?.url || '/images/no_album_cover.jpg'} alt={item.name} className="album-cover search-album-cover" loading="lazy" onError={onImgError} />
                        <div className="album-details">
                            <h3 className="album-title">{item.name} <AverageBadge {...(avg || {})} /></h3>
                            <p className="search-result-type">Album</p>
                            <p className="album-artist">
                                <span className="search-link" onClick={(e) => { e.stopPropagation(); navigate(`/artist/${item.artists[0].id}`); }}>{item.artists[0].name}</span>
                                {' '} • {item.total_tracks} tracks
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div key={`track-${item.id}`} className="review-card search-result-card" onClick={() => navigate(`/song/${item.id}`)}>
                <div className="album-info search-album-info">
                    <img src={item.image || '/images/no_album_cover.jpg'} alt={item.name} className="album-cover search-album-cover" loading="lazy" onError={onImgError} />
                    <div className="album-details">
                        <h3 className="album-title">{item.name} <AverageBadge {...(avg || {})} /></h3>
                        <p className="search-result-type">Song</p>
                        <p className="album-artist">
                            <span className="search-link" onClick={(e) => { e.stopPropagation(); navigate(`/artist/${item.artistId}`); }}>{item.artist}</span>
                            {' '} • <span className="search-link" onClick={(e) => { e.stopPropagation(); navigate(`/album/${item.albumId}`); }}>{item.albumName}</span>
                            {' '} • {formatDuration(item.duration_ms)}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <main>
                <h1>Search</h1>
                <form onSubmit={submit} className="search-form">
                    <label htmlFor="album-search">Search albums, songs, and artists:</label>
                    <input
                        id="album-search"
                        name="q"
                        className="standard_search"
                        placeholder="Start typing…"
                        value={query}
                        autoComplete="off"
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div><button type="submit" className="aura">Search</button></div>
                </form>

                {!query.trim() && recent.length > 0 && (
                    <div className="recent-searches">
                        <div className="recent-head">
                            <span>Recent searches</span>
                            <button type="button" className="text-btn" onClick={clearRecent}>Clear</button>
                        </div>
                        <div className="recent-chips">
                            {recent.map(r => (
                                <button key={r} type="button" className="chip" onClick={() => { setQuery(r); setParams({ q: r }); runSearch(r); }}>{r}</button>
                            ))}
                        </div>
                    </div>
                )}

                {loading && <Loading label="Searching…" />}
                <ErrorMessage>{error}</ErrorMessage>

                {results.length > 0 && (
                    <div className="search-results-container">
                        <h2>Results ({results.length})</h2>
                        {results.map(renderResult)}
                    </div>
                )}

                {searched && results.length === 0 && !loading && !error && (
                    <EmptyState title={`No results for "${query}"`}>Try a different spelling or the artist's name.</EmptyState>
                )}
            </main>
        </div>
    );
}
