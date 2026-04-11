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
                ? 'rgba(0,200,83,0.25)'
                : connStatus === 'error'
                  ? 'rgba(255,0,68,0.25)'
                  : 'rgba(255,255,255,0.1)',
        color:
            connStatus === 'ok'
                ? '#00c853'
                : connStatus === 'error'
                  ? '#ff4d4d'
                  : '#8b8d99',
        borderColor:
            connStatus === 'ok'
                ? '#00c853'
                : connStatus === 'error'
                  ? '#ff4d4d'
                  : 'rgba(255,255,255,0.2)',
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.logo}>HERCULES AI</div>
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
