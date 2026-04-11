"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './login.module.scss';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate brief loading then redirect
        setTimeout(() => {
            router.push('/dashboard');
        }, 600);
    };

    return (
        <div className={styles.loginPage}>
            {/* Atmospheric glows */}
            <div className={styles.glowTop} />
            <div className={styles.glowBottom} />

            <div className={styles.loginContainer}>
                {/* Left — Branding Panel */}
                <div className={styles.brandPanel}>
                    <div className={styles.brandContent}>
                        <div className={styles.brandLogo}>
                            <span className={styles.logoIcon}>⬡</span>
                            HERCULES <span className={styles.logoAccent}>AI</span>
                        </div>
                        <h2 className={styles.brandTitle}>
                            Welcome Back
                        </h2>
                        <p className={styles.brandSubtitle}>
                            Access your intelligent document processing dashboard. 
                            Manage extractions, review organized data, and export reports.
                        </p>
                        <div className={styles.brandStats}>
                            <div className={styles.brandStat}>
                                <span className={styles.brandStatValue}>99.7%</span>
                                <span className={styles.brandStatLabel}>Accuracy</span>
                            </div>
                            <div className={styles.brandStatDivider} />
                            <div className={styles.brandStat}>
                                <span className={styles.brandStatValue}>10x</span>
                                <span className={styles.brandStatLabel}>Faster</span>
                            </div>
                            <div className={styles.brandStatDivider} />
                            <div className={styles.brandStat}>
                                <span className={styles.brandStatValue}>24/7</span>
                                <span className={styles.brandStatLabel}>Available</span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.brandFooter}>
                        <a href="/" className={styles.backLink}>
                            ← Back to Homepage
                        </a>
                    </div>
                </div>

                {/* Right — Login Form */}
                <div className={styles.formPanel}>
                    <form className={styles.loginForm} onSubmit={handleLogin} id="login-form">
                        <div className={styles.formHeader}>
                            <h1 className={styles.formTitle}>Sign In</h1>
                            <p className={styles.formSubtitle}>Enter your credentials to continue</p>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="email" className={styles.inputLabel}>Email Address</label>
                            <div className={styles.inputWrapper}>
                                <FiMail className={styles.inputIcon} size={18} />
                                <input
                                    type="email"
                                    id="email"
                                    className={styles.input}
                                    placeholder="name@company.com"
                                    autoComplete="email"
                                    defaultValue=""
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.inputLabel}>Password</label>
                            <div className={styles.inputWrapper}>
                                <FiLock className={styles.inputIcon} size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    className={styles.input}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    defaultValue=""
                                />
                                <button
                                    type="button"
                                    className={styles.togglePassword}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className={styles.formOptions}>
                            <label className={styles.rememberMe}>
                                <input type="checkbox" defaultChecked />
                                <span>Remember me</span>
                            </label>
                            <a href="#" className={styles.forgotLink}>Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            className={`${styles.submitBtn} ${isLoading ? styles.loading : ''}`}
                            disabled={isLoading}
                            id="login-submit-btn"
                        >
                            {isLoading ? (
                                <span className={styles.spinner} />
                            ) : (
                                <>
                                    Sign In
                                    <FiArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <div className={styles.divider}>
                            <span>or</span>
                        </div>

                        <button type="button" className={styles.ssoBtn}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
