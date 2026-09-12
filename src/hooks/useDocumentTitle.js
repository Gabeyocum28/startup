import React from 'react';

const BASE = 'Polyrhythmd';

// Sets document.title and the og:title/description meta tags for the page.
export function useDocumentTitle(title, description) {
    React.useEffect(() => {
        document.title = title ? `${title} · ${BASE}` : BASE;
        setMeta('og:title', document.title);
        if (description) setMeta('og:description', description);
        return () => { document.title = BASE; };
    }, [title, description]);
}

function setMeta(property, content) {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}
