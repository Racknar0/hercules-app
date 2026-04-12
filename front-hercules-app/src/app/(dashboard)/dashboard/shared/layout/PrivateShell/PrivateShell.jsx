"use client";

import { useEffect, useState } from 'react';
import PrivateNavbar from '../PrivateNavbar/PrivateNavbar';
import styles from './PrivateShell.module.scss';
import {
    DASHBOARD_THEME_STORAGE_KEY,
    DEFAULT_DASHBOARD_THEME,
    isValidDashboardTheme,
} from '@/helpers/dashboardThemes';
import HttpService from '@/services/HttpService';

const httpService = new HttpService();

export default function PrivateShell({ children }) {
    const [theme, setTheme] = useState(() => {
        if (typeof window === 'undefined') {
            return DEFAULT_DASHBOARD_THEME;
        }

        const storedTheme = window.localStorage.getItem(
            DASHBOARD_THEME_STORAGE_KEY,
        );
        return storedTheme && isValidDashboardTheme(storedTheme)
            ? storedTheme
            : DEFAULT_DASHBOARD_THEME;
    });
    const [role, setRole] = useState(() => {
        if (typeof window === 'undefined') {
            return 'USER';
        }

        return (
            window.localStorage.getItem('auth_role') ||
            window.sessionStorage.getItem('auth_role') ||
            'USER'
        );
    });
    const [authReady, setAuthReady] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const localToken =
            window.localStorage.getItem('token') ||
            window.localStorage.getItem('auth_token');
        const sessionToken =
            window.sessionStorage.getItem('token') ||
            window.sessionStorage.getItem('auth_token');
        const token = localToken || sessionToken;
        const targetStorage = localToken
            ? window.localStorage
            : window.sessionStorage;

        if (!token) {
            window.location.href = '/login';
            return;
        }

        httpService
            .getData('/api/auth/me')
            .then((res) => {
                const responseRole = res?.data?.role;
                if (responseRole) {
                    setRole(responseRole);
                    targetStorage.setItem('auth_role', responseRole);
                    if (localToken) {
                        document.cookie = `auth_role=${responseRole}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
                    } else {
                        document.cookie = `auth_role=${responseRole}; Path=/; SameSite=Lax`;
                    }
                }
                setIsAuthenticated(true);
                setAuthReady(true);
            })
            .catch(() => {
                window.localStorage.removeItem('token');
                window.localStorage.removeItem('auth_token');
                window.localStorage.removeItem('auth_role');
                window.localStorage.removeItem('auth_user');
                window.sessionStorage.removeItem('token');
                window.sessionStorage.removeItem('auth_token');
                window.sessionStorage.removeItem('auth_role');
                window.sessionStorage.removeItem('auth_user');
                document.cookie =
                    'auth_token=; Path=/; Max-Age=0; SameSite=Lax';
                document.cookie = 'auth_role=; Path=/; Max-Age=0; SameSite=Lax';
                setIsAuthenticated(false);
                setAuthReady(true);
                window.location.href = '/login';
            });
    }, []);

    const handleThemeChange = (nextTheme) => {
        if (!isValidDashboardTheme(nextTheme)) return;
        setTheme(nextTheme);
        window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, nextTheme);
    };

    if (!authReady || !isAuthenticated) {
        return <div className={styles.authGate} data-dashboard-theme={theme} />;
    }

    return (
        <div className={styles.shell} data-dashboard-theme={theme}>
            <PrivateNavbar
                theme={theme}
                onThemeChange={handleThemeChange}
                role={role}
            />
            <main className={styles.content}>{children}</main>
        </div>
    );
}
