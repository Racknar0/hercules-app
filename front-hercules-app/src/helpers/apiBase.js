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

export function getApiBase() {
    if (envApiBase) {
        const normalizedEnv = trimTrailingSlash(envApiBase);

        if (typeof window !== 'undefined') {
            const currentHost = window.location.hostname;
            if (!isLoopbackHost(currentHost) && isLoopbackUrl(normalizedEnv)) {
                return '';
            }
        }

        return normalizedEnv;
    }

    return '';
}

const API_BASE = getApiBase();

export default API_BASE;