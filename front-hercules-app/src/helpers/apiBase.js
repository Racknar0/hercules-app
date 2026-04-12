const envApiBase = (process.env.NEXT_PUBLIC_API_URL || '').trim();

function trimTrailingSlash(url) {
    return url.replace(/\/+$/, '');
}

function resolveFromBrowserLocation() {
    if (typeof window === 'undefined') {
        return null;
    }

    const { protocol, hostname } = window.location;
    if (!hostname) {
        return null;
    }

    return `${protocol}//${hostname}:3000`;
}

export function getApiBase() {
    if (envApiBase) {
        return trimTrailingSlash(envApiBase);
    }

    const browserApiBase = resolveFromBrowserLocation();
    if (browserApiBase) {
        return browserApiBase;
    }

    return 'http://localhost:3000';
}

const API_BASE = getApiBase();

export default API_BASE;