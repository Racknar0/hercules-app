"use client";

import PrivateNavbar from '../PrivateNavbar/PrivateNavbar';
import styles from './PrivateShell.module.scss';

export default function PrivateShell({ children }) {
    return (
        <div className={styles.shell}>
            <PrivateNavbar />
            <main className={styles.content}>{children}</main>
        </div>
    );
}
