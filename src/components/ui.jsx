import React from 'react';
import { Link } from 'react-router-dom';

export function Loading({ label = 'Loading…' }) {
    return (
        <div className="ui-loading" role="status" aria-live="polite">
            <span className="ui-spinner" aria-hidden="true" />
            <span>{label}</span>
        </div>
    );
}

export function EmptyState({ title, children }) {
    return (
        <div className="ui-empty">
            {title && <h3>{title}</h3>}
            {children && <p>{children}</p>}
        </div>
    );
}

export function ErrorMessage({ children }) {
    if (!children) return null;
    return <p className="ui-error" role="alert">{children}</p>;
}

// Shown in place of a write action when the viewer is logged out.
export function LoginPrompt({ action = 'do that' }) {
    return (
        <p className="ui-login-prompt">
            <Link to="/">Log in</Link> to {action}.
        </p>
    );
}

export function BackButton({ to, children }) {
    return <Link className="back-button" to={to}>&larr; {children}</Link>;
}
