"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import styles from './login.module.scss';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import HttpService from '@/services/HttpService';

const httpService = new HttpService();
const PERSISTENT_AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const MIN_LOADING_MS = 500;

function clearAuthStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_user');

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_role');
    sessionStorage.removeItem('auth_user');
}

function setAuthCookies(token, role, rememberMe) {
    if (rememberMe) {
        document.cookie = `auth_token=${token}; Path=/; Max-Age=${PERSISTENT_AUTH_MAX_AGE_SECONDS}; SameSite=Lax`;
        document.cookie = `auth_role=${role}; Path=/; Max-Age=${PERSISTENT_AUTH_MAX_AGE_SECONDS}; SameSite=Lax`;
        return;
    }

    document.cookie = `auth_token=${token}; Path=/; SameSite=Lax`;
    document.cookie = `auth_role=${role}; Path=/; SameSite=Lax`;
}

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!email.trim() || !password) {
            setErrorMsg('Please enter your email and password.');
            return;
        }

        setIsLoading(true);
        const startedAt = Date.now();

        try {
            const response = await httpService.postData('/api/auth/login', {
                email: email.trim(),
                password,
            });

            const token = response?.data?.token;
            const role = response?.data?.role;
            const user = response?.data?.user;

            if (!token || !role) {
                setErrorMsg('Invalid login response from server.');
                return;
            }

            clearAuthStorage();

            const targetStorage = rememberMe ? localStorage : sessionStorage;
            targetStorage.setItem('token', token);
            targetStorage.setItem('auth_token', token);
            targetStorage.setItem('auth_role', role);
            if (user) {
                targetStorage.setItem('auth_user', JSON.stringify(user));
            }

            setAuthCookies(token, role, rememberMe);

            const nextPath = searchParams.get('next');
            const safeNextPath =
                nextPath && nextPath.startsWith('/dashboard')
                    ? nextPath
                    : null;

            if (safeNextPath) {
                router.push(safeNextPath);
                return;
            }

            if (role === 'SUPER_ADMIN') {
                router.push('/dashboard/admin');
                return;
            }

            router.push('/dashboard');
        } catch (error) {
            const apiError =
                error?.response?.data?.error ||
                error?.message ||
                'Login failed. Please try again.';
            setErrorMsg(apiError);
        } finally {
            const elapsed = Date.now() - startedAt;
            if (elapsed < MIN_LOADING_MS) {
                await new Promise((resolve) =>
                    setTimeout(resolve, MIN_LOADING_MS - elapsed),
                );
            }
            setIsLoading(false);
        }
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
                        <Link href="/" className={styles.backLink}>
                            ← Back to Homepage
                        </Link>
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
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Remember me</span>
                            </label>
                            <a href="#" className={styles.forgotLink}>Forgot password?</a>
                        </div>

                        {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

                        <button
                            type="submit"
                            className={`${styles.submitBtn} ${isLoading ? styles.loading : ''}`}
                            disabled={isLoading}
                            id="login-submit-btn"
                            aria-busy={isLoading}
                        >
                            {isLoading ? (
                                <span className={styles.loadingContent}>
                                    <span className={styles.spinner} />
                                    <span>Signing in...</span>
                                </span>
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

                        <div className={styles.seedHint}>
                            Demo users: <strong>superadmin@hercules.local</strong>, <strong>owner@hercules.local</strong>, <strong>user@hercules.local</strong>.
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginPageContent />
        </Suspense>
    );
}
