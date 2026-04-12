const envApiBase = (process.env.NEXT_PUBLIC_API_URL || '').trim();

function trimTrailingSlash(url) {
    return url.replace(/\/+$/, '');
}

function isLoopbackHost(hostname) {
    const host = String(hostname || '').toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function isLoopbackUrl(url) {
    try {
        const parsed = new URL(url);
        return isLoopbackHost(parsed.hostname);
    } catch {
        return false;
    }
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
        const normalizedEnv = trimTrailingSlash(envApiBase);

        if (typeof window !== 'undefined') {
            const currentHost = window.location.hostname;
            if (!isLoopbackHost(currentHost) && isLoopbackUrl(normalizedEnv)) {
                const browserApiBase = resolveFromBrowserLocation();
                if (browserApiBase) {
                    return browserApiBase;
                }
            }
        }

        return normalizedEnv;
    }

    const browserApiBase = resolveFromBrowserLocation();
    if (browserApiBase) {
        return browserApiBase;
    }

    return 'http://localhost:3000';
}

const API_BASE = getApiBase();

export default API_BASE;