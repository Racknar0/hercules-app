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

        return window.localStorage.getItem('auth_role') || 'USER';
    });

    useEffect(() => {
        const token =
            window.localStorage.getItem('token') ||
            window.localStorage.getItem('auth_token');

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
                    window.localStorage.setItem('auth_role', responseRole);
                    document.cookie = `auth_role=${responseRole}; Path=/; Max-Age=${60 * 60 * 12}; SameSite=Lax`;
                }
            })
            .catch(() => {
                window.localStorage.removeItem('token');
                window.localStorage.removeItem('auth_token');
                window.localStorage.removeItem('auth_role');
                window.localStorage.removeItem('auth_user');
                document.cookie =
                    'auth_token=; Path=/; Max-Age=0; SameSite=Lax';
                document.cookie = 'auth_role=; Path=/; Max-Age=0; SameSite=Lax';
                window.location.href = '/login';
            });
    }, []);

    const handleThemeChange = (nextTheme) => {
        if (!isValidDashboardTheme(nextTheme)) return;
        setTheme(nextTheme);
        window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, nextTheme);
    };

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
