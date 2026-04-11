"use client";

import { useEffect, useState } from 'react';
import PrivateNavbar from '../PrivateNavbar/PrivateNavbar';
import styles from './PrivateShell.module.scss';
import {
    DASHBOARD_THEME_STORAGE_KEY,
    DEFAULT_DASHBOARD_THEME,
    isValidDashboardTheme,
} from '@/helpers/dashboardThemes';

export default function PrivateShell({ children }) {
    const [theme, setTheme] = useState(DEFAULT_DASHBOARD_THEME);

    useEffect(() => {
        const storedTheme = window.localStorage.getItem(
            DASHBOARD_THEME_STORAGE_KEY,
        );
        if (storedTheme && isValidDashboardTheme(storedTheme)) {
            setTheme(storedTheme);
        }
    }, []);

    const handleThemeChange = (nextTheme) => {
        if (!isValidDashboardTheme(nextTheme)) return;
        setTheme(nextTheme);
        window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, nextTheme);
    };

    return (
        <div className={styles.shell} data-dashboard-theme={theme}>
            <PrivateNavbar theme={theme} onThemeChange={handleThemeChange} />
            <main className={styles.content}>{children}</main>
        </div>
    );
}
