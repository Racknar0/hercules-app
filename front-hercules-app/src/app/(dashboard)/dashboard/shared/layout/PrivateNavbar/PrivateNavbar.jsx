"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboardStore } from '@/store/useDashboardStore';
import HttpService from '@/services/HttpService';
import styles from './PrivateNavbar.module.scss';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const httpService = new HttpService();

function navClass(pathname, href) {
    if (pathname === href) return `${styles.link} ${styles.active}`;
    return styles.link;
}

export default function PrivateNavbar() {
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
                `CONEXION OK (${latency}ms)\n\n` +
                    `API_BASE: ${API_BASE || '(vacio)'}\n` +
                    `URL: ${targetUrl}\n` +
                    `Node: ${data.node} (${data.platform})\n` +
                    `Lotes: ${data.data.lotes}`,
            );
        } catch (err) {
            setConnStatus('error');
            alert(`CONEXION FALLIDA\n\nURL: ${targetUrl}\nError: ${err.message}`);
        }
    };

    const apiButtonStyle = {
        background:
            connStatus === 'ok'
                ? 'rgba(34,197,94,0.15)'
                : connStatus === 'error'
                  ? 'rgba(239,68,68,0.15)'
                  : 'rgba(255,255,255,0.05)',
        color:
            connStatus === 'ok'
                ? '#22C55E'
                : connStatus === 'error'
                  ? '#EF4444'
                  : '#6B7280',
        borderColor:
            connStatus === 'ok'
                ? '#22C55E'
                : connStatus === 'error'
                  ? '#EF4444'
                  : 'rgba(255,255,255,0.1)',
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.logo}>
                <span style={{ color: '#FF5C00', fontSize: '1.2rem' }}>⬡</span>
                HERCULES{' '}
                <span style={{
                    background: 'linear-gradient(135deg, #FF5C00, #FF8C42)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>AI</span>
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
            </div>
        </nav>
    );
}
