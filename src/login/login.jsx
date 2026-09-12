import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { ErrorMessage } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../app.css';

const USERNAME_RULE = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_MIN = 8;

export function Login() {
    useDocumentTitle('Log in', 'Rate and review albums, songs, and artists.');
    const { user, refresh } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = React.useState('login');
    const [userName, setUserName] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState(null);
    const [busy, setBusy] = React.useState(false);

    const from = location.state?.from?.pathname || '/feed';
    if (user) return <Navigate to={from} replace />;

    function clientProblem() {
        if (!USERNAME_RULE.test(userName)) return 'Username must be 3-20 letters, numbers, or underscores.';
        if (mode === 'register' && password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
        return null;
    }

    async function submit(e) {
        e.preventDefault();
        const problem = clientProblem();
        if (problem) return setError(problem);
        setBusy(true);
        setError(null);
        try {
            await api(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
                method: 'POST',
                body: { username: userName, password },
            });
            await refresh();
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div>
            <main>
                <form className="login-form" onSubmit={submit}>
                    <h1>Welcome to Polyrhythmd</h1>
                    <p className="login-sub">
                        Rate and review the music you love. You can <a href="/feed">browse the feed</a> without an account.
                    </p>
                    <div className="login-tabs" role="tablist">
                        <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(null); }}>Log in</button>
                        <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(null); }}>Create account</button>
                    </div>
                    <div>
                        <input
                            className="standard"
                            type="text"
                            autoComplete="username"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value.trim())}
                            placeholder="username"
                            aria-label="Username"
                        />
                    </div>
                    <div>
                        <input
                            className="standard"
                            type="password"
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="password"
                            aria-label="Password"
                        />
                    </div>
                    {mode === 'register' && (
                        <p className="login-hint">Usernames are 3-20 letters, numbers, or underscores. Passwords need at least {PASSWORD_MIN} characters.</p>
                    )}
                    <ErrorMessage>{error}</ErrorMessage>
                    <button type="submit" disabled={busy || !userName || !password}>
                        {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
                    </button>
                </form>
            </main>
        </div>
    );
}
