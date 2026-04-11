"use client";

import { useRouter } from 'next/navigation';
import styles from './landing.module.scss';
import { FiCpu, FiDatabase, FiShield, FiUploadCloud, FiZap, FiCheckCircle, FiArrowRight, FiBarChart2, FiLayers, FiGlobe } from 'react-icons/fi';

export default function LandingPage() {
    const router = useRouter();

    return (
        <div className={styles.landing}>
            {/* ── Navbar ── */}
            <nav className={styles.navbar} id="landing-navbar">
                <div className={styles.navContent}>
                    <div className={styles.navLogo}>
                        <span className={styles.logoIcon}>⬡</span>
                        HERCULES <span className={styles.logoAccent}>AI</span>
                    </div>
                    <div className={styles.navLinks}>
                        <a href="#features" className={styles.navLink}>Features</a>
                        <a href="#how-it-works" className={styles.navLink}>How It Works</a>
                        <a href="#stats" className={styles.navLink}>Results</a>
                        <button
                            type="button"
                            className={styles.navCta}
                            onClick={() => router.push('/login')}
                            id="nav-login-btn"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Hero Section ── */}
            <section className={styles.hero} id="hero-section">
                <div className={styles.heroGlow} />
                <div className={styles.heroContent}>
                    <div className={styles.heroBadge}>
                        <FiZap size={14} />
                        AI-Powered Document Intelligence
                    </div>
                    <h1 className={styles.heroTitle}>
                        Transform Your Documents
                        <br />
                        Into <span className={styles.heroGradient}>Actionable Data</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Hercules AI leverages advanced artificial intelligence to extract, classify, and organize
                        complex document data with unprecedented accuracy. From medical records to financial
                        reports — processed in seconds, not hours.
                    </p>
                    <div className={styles.heroCtas}>
                        <button
                            type="button"
                            className={styles.ctaPrimary}
                            onClick={() => router.push('/login')}
                            id="hero-get-started-btn"
                        >
                            Get Started
                            <FiArrowRight size={18} />
                        </button>
                        <a href="#how-it-works" className={styles.ctaSecondary}>
                            See How It Works
                        </a>
                    </div>
                </div>

                {/* Floating dashboard preview */}
                <div className={styles.heroVisual}>
                    <div className={styles.dashboardPreview}>
                        <div className={styles.previewHeader}>
                            <div className={styles.previewDots}>
                                <span /><span /><span />
                            </div>
                            <span className={styles.previewTitle}>Hercules Dashboard</span>
                        </div>
                        <div className={styles.previewBody}>
                            <div className={styles.previewSidebar}>
                                <div className={styles.previewNavItem + ' ' + styles.active}>
                                    <FiCpu size={14} /> Extractor
                                </div>
                                <div className={styles.previewNavItem}>
                                    <FiDatabase size={14} /> Organizer
                                </div>
                                <div className={styles.previewNavItem}>
                                    <FiBarChart2 size={14} /> Analytics
                                </div>
                            </div>
                            <div className={styles.previewContent}>
                                <div className={styles.previewCard}>
                                    <div className={styles.previewCardHeader}>Documents Processed</div>
                                    <div className={styles.previewCardValue}>2,847</div>
                                    <div className={styles.previewCardBar}><span style={{ width: '78%' }} /></div>
                                </div>
                                <div className={styles.previewCard}>
                                    <div className={styles.previewCardHeader}>Accuracy Rate</div>
                                    <div className={styles.previewCardValue}>99.7%</div>
                                    <div className={styles.previewCardBar}><span style={{ width: '99%' }} /></div>
                                </div>
                                <div className={styles.previewCard}>
                                    <div className={styles.previewCardHeader}>Time Saved</div>
                                    <div className={styles.previewCardValue}>340h</div>
                                    <div className={styles.previewCardBar}><span style={{ width: '65%' }} /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats Bar ── */}
            <section className={styles.statsBar} id="stats">
                <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>99.7%</span>
                        <span className={styles.statLabel}>Extraction Accuracy</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>10x</span>
                        <span className={styles.statLabel}>Faster Processing</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>50K+</span>
                        <span className={styles.statLabel}>Documents Processed</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>24/7</span>
                        <span className={styles.statLabel}>Automated Pipeline</span>
                    </div>
                </div>
            </section>

            {/* ── Features Section ── */}
            <section className={styles.features} id="features">
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionBadge}>What We Offer</span>
                    <h2 className={styles.sectionTitle}>Intelligent Document Processing</h2>
                    <p className={styles.sectionSubtitle}>
                        Our AI engine processes, understands, and structures your documents — 
                        delivering enterprise-grade accuracy with zero manual effort.
                    </p>
                </div>
                <div className={styles.featuresGrid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <FiCpu size={28} />
                        </div>
                        <h3>AI Data Extraction</h3>
                        <p>
                            Advanced NLP models identify and extract key data points from unstructured 
                            documents — dates, providers, amounts, diagnoses — with contextual understanding.
                        </p>
                        <ul className={styles.featureList}>
                            <li><FiCheckCircle size={14} /> Multi-format support (PDF, images, scans)</li>
                            <li><FiCheckCircle size={14} /> Handwriting recognition</li>
                            <li><FiCheckCircle size={14} /> Contextual field mapping</li>
                        </ul>
                    </div>
                    <div className={styles.featureCard + ' ' + styles.featureCardHighlight}>
                        <div className={styles.featureIcon}>
                            <FiLayers size={28} />
                        </div>
                        <h3>Smart Organization</h3>
                        <p>
                            Automatically classify documents by type, sort by date, group by provider, 
                            and structure data into ready-to-use tables and reports.
                        </p>
                        <ul className={styles.featureList}>
                            <li><FiCheckCircle size={14} /> Auto-classification</li>
                            <li><FiCheckCircle size={14} /> Duplicate detection & merging</li>
                            <li><FiCheckCircle size={14} /> Chronological sorting</li>
                        </ul>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <FiShield size={28} />
                        </div>
                        <h3>Forensic Analysis</h3>
                        <p>
                            Cross-reference data across documents, detect inconsistencies, 
                            and generate forensic-grade reports with full audit trails.
                        </p>
                        <ul className={styles.featureList}>
                            <li><FiCheckCircle size={14} /> Conflict detection</li>
                            <li><FiCheckCircle size={14} /> Data validation rules</li>
                            <li><FiCheckCircle size={14} /> Excel/PDF export</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section className={styles.howItWorks} id="how-it-works">
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionBadge}>Simple Workflow</span>
                    <h2 className={styles.sectionTitle}>Three Steps to Structured Data</h2>
                    <p className={styles.sectionSubtitle}>
                        From raw documents to organized, exportable data in minutes.
                    </p>
                </div>
                <div className={styles.stepsGrid}>
                    <div className={styles.stepCard}>
                        <div className={styles.stepNumber}>01</div>
                        <div className={styles.stepIcon}><FiUploadCloud size={32} /></div>
                        <h3>Upload Documents</h3>
                        <p>Drag & drop your PDFs, images, or scanned documents into the secure processing pipeline.</p>
                    </div>
                    <div className={styles.stepConnector}>
                        <div className={styles.connectorLine} />
                        <FiArrowRight size={20} />
                    </div>
                    <div className={styles.stepCard}>
                        <div className={styles.stepNumber}>02</div>
                        <div className={styles.stepIcon}><FiCpu size={32} /></div>
                        <h3>AI Processing</h3>
                        <p>Our AI models extract, classify, and structure data with real-time progress tracking.</p>
                    </div>
                    <div className={styles.stepConnector}>
                        <div className={styles.connectorLine} />
                        <FiArrowRight size={20} />
                    </div>
                    <div className={styles.stepCard}>
                        <div className={styles.stepNumber}>03</div>
                        <div className={styles.stepIcon}><FiDatabase size={32} /></div>
                        <h3>Review & Export</h3>
                        <p>Review organized data, resolve conflicts, and export to Excel or PDF with one click.</p>
                    </div>
                </div>
            </section>

            {/* ── CTA Section ── */}
            <section className={styles.ctaSection}>
                <div className={styles.ctaGlow} />
                <div className={styles.ctaContent}>
                    <h2>Ready to Automate Your Document Workflow?</h2>
                    <p>Join professionals who trust Hercules AI to process thousands of documents with zero errors.</p>
                    <button
                        type="button"
                        className={styles.ctaPrimary}
                        onClick={() => router.push('/login')}
                        id="cta-get-started-btn"
                    >
                        Start Processing Now
                        <FiArrowRight size={18} />
                    </button>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className={styles.footer} id="landing-footer">
                <div className={styles.footerContent}>
                    <div className={styles.footerBrand}>
                        <div className={styles.footerLogo}>
                            <span className={styles.logoIcon}>⬡</span>
                            HERCULES <span className={styles.logoAccent}>AI</span>
                        </div>
                        <p>Intelligent document processing powered by advanced artificial intelligence.</p>
                    </div>
                    <div className={styles.footerLinks}>
                        <div className={styles.footerCol}>
                            <h4>Product</h4>
                            <a href="#features">Features</a>
                            <a href="#how-it-works">How It Works</a>
                            <a href="#stats">Results</a>
                        </div>
                        <div className={styles.footerCol}>
                            <h4>Company</h4>
                            <a href="#hero-section">About</a>
                            <a href="#hero-section">Careers</a>
                            <a href="#hero-section">Contact</a>
                        </div>
                        <div className={styles.footerCol}>
                            <h4>Legal</h4>
                            <a href="#hero-section">Privacy Policy</a>
                            <a href="#hero-section">Terms of Service</a>
                        </div>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <p>&copy; {new Date().getFullYear()} Hercules AI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
