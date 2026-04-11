"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hexagon, Palette } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import HttpService from '@/services/HttpService';
import { DASHBOARD_THEMES } from '@/helpers/dashboardThemes';
import styles from './PrivateNavbar.module.scss';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const httpService = new HttpService();

function navClass(pathname, href) {
    if (pathname === href) return `${styles.link} ${styles.active}`;
    return styles.link;
}

export default function PrivateNavbar({ theme, onThemeChange }) {
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

    return (
        <nav className={styles.navbar}>
            <div className={styles.logo}>
                <Hexagon size={18} color="var(--h-primary)" strokeWidth={2.2} />
                HERCULES{' '}
                <span className={styles.logoAccent}>AI</span>
            </div>
            <div className={styles.links}>
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
                <button
                    type="button"
                    onClick={testConnection}
                    className={styles.apiButton}
                    style={apiButtonStyle}
                >
                    API
                </button>
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
            </div>
        </nav>
    );
}
