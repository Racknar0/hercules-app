"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hexagon, Palette } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import HttpService from '@/services/HttpService';
import API_BASE from '@/helpers/apiBase';
import { DASHBOARD_THEMES } from '@/helpers/dashboardThemes';
import styles from './PrivateNavbar.module.scss';
const httpService = new HttpService();

function navClass(pathname, href) {
    if (pathname === href) return `${styles.link} ${styles.active}`;
    return styles.link;
}

export default function PrivateNavbar({ theme, onThemeChange, role = 'USER' }) {
    const pathname = usePathname();
    const { qaStatus, connStatus, setQaStatus, setConnStatus } =
        useDashboardStore();

    useEffect(() => {
        const checkQAStatus = () => {
            httpService
                .getData('/api/qa-status')
                .then((res) => setQaStatus(res.data))
                .catch(() => {});
        };

        checkQAStatus();
        const interval = setInterval(checkQAStatus, 10000);
        return () => clearInterval(interval);
    }, [setQaStatus]);

    const testConnection = async () => {
        setConnStatus('testing');
        const targetUrl = `${API_BASE}/api/health`;
        try {
            const t0 = Date.now();
            const res = await httpService.getData('/api/health');
            const latency = Date.now() - t0;
            const data = res.data;
            setConnStatus('ok');
            alert(
                `CONNECTION OK (${latency}ms)\n\n` +
                    `API_BASE: ${API_BASE || '(empty)'}\n` +
                    `URL: ${targetUrl}\n` +
                    `Node: ${data.node} (${data.platform})\n` +
                    `Batches: ${data.data.lotes}`,
            );
        } catch (err) {
            setConnStatus('error');
            alert(`CONNECTION FAILED\n\nURL: ${targetUrl}\nError: ${err.message}`);
        }
    };

    const apiButtonStyle = {
        background:
            connStatus === 'ok'
                                ? 'rgba(var(--h-success-rgb), 0.15)'
                : connStatus === 'error'
                                    ? 'rgba(var(--h-danger-rgb), 0.15)'
                                    : 'var(--h-glass)',
        color:
            connStatus === 'ok'
                                ? 'var(--h-success)'
                : connStatus === 'error'
                                    ? 'var(--h-danger)'
                                    : 'var(--h-text-muted)',
        borderColor:
            connStatus === 'ok'
                                ? 'var(--h-success)'
                : connStatus === 'error'
                                    ? 'var(--h-danger)'
                                    : 'var(--h-border)',
    };

    const isSuperAdmin = role === 'SUPER_ADMIN';

    const handleLogout = async () => {
        try {
            await httpService.postData('/api/auth/logout');
        } catch {
            // Ignore logout API failures and clear local session anyway.
        }

        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_role');
        localStorage.removeItem('auth_user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_role');
        sessionStorage.removeItem('auth_user');
        document.cookie = 'auth_token=; Path=/; Max-Age=0; SameSite=Lax';
        document.cookie = 'auth_role=; Path=/; Max-Age=0; SameSite=Lax';
        window.location.href = '/login';
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.logo}>
                <Hexagon size={18} color="var(--h-primary)" strokeWidth={2.2} />
                HERCULES{' '}
                <span className={styles.logoAccent}>AI</span>
            </div>
            <div className={styles.links}>
                <Link
                    href="/dashboard/file-viewer"
                    className={navClass(pathname, '/dashboard/file-viewer')}
                >
                    File Viewer
                </Link>
                <Link
                    href="/dashboard/organizer"
                    className={navClass(pathname, '/dashboard/organizer')}
                >
                    Medical Organizer
                </Link>
                <Link
                    href="/dashboard/extractor"
                    className={navClass(pathname, '/dashboard/extractor')}
                >
                    Medical Extractor
                    {qaStatus?.hasData && (
                        <span className={styles.qaBadge}>{qaStatus.count}</span>
                    )}
                </Link>
                {isSuperAdmin && (
                    <Link
                        href="/dashboard/admin"
                        className={navClass(pathname, '/dashboard/admin')}
                    >
                        Super Admin
                    </Link>
                )}
                <button
                    type="button"
                    onClick={testConnection}
                    className={styles.apiButton}
                    style={apiButtonStyle}
                >
                    API
                </button>
                <span className={styles.roleBadge}>{role}</span>
                <label className={styles.themeSelectWrap} title="Tema del dashboard">
                    <Palette size={14} />
                    <select
                        className={styles.themeSelect}
                        value={theme}
                        onChange={(e) => onThemeChange(e.target.value)}
                    >
                        {DASHBOARD_THEMES.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </label>
                <button type="button" onClick={handleLogout} className={styles.logoutButton}>
                    Logout
                </button>
            </div>
        </nav>
    );
}
