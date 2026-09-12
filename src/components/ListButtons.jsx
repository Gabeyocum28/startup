import React from 'react';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';

// "Listened" / "Want to listen" toggles for any album, track, or artist.
export function ListButtons({ item }) {
    const { user, setUser } = useAuth();
    const [busy, setBusy] = React.useState(null);
    if (!user) return null;

    const inList = (list) => (user.lists?.[list] || []).some(x => x.id === Number(item.id) && x.type === item.type);

    async function toggle(list) {
        setBusy(list);
        try {
            const action = inList(list) ? 'remove' : 'add';
            const data = await api(`/api/user/lists/${list}`, { method: 'PUT', body: { action, item } });
            setUser(prev => ({ ...prev, lists: { ...prev.lists, ...data } }));
        } catch { /* leave state unchanged */ } finally {
            setBusy(null);
        }
    }

    return (
        <div className="list-buttons">
            <button
                type="button"
                className={`list-btn ${inList('listened') ? 'active' : ''}`}
                disabled={busy !== null}
                onClick={() => toggle('listened')}
            >
                {inList('listened') ? '✓ Listened' : '+ Listened'}
            </button>
            <button
                type="button"
                className={`list-btn ${inList('wantToListen') ? 'active' : ''}`}
                disabled={busy !== null}
                onClick={() => toggle('wantToListen')}
            >
                {inList('wantToListen') ? '✓ Want to listen' : '+ Want to listen'}
            </button>
        </div>
    );
}
