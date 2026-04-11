'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import logoLogin from '@assets/logo-login.png';
import { getAssetSrc } from '@helpers/assetSrc';
import usePublicCart from '@store/usePublicCart';
import './Navbar.scss';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/productos', label: 'Productos' },
  { href: '/noticias', label: 'Noticias' },
  { href: '/sobre-nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contáctanos', isCta: true },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const openSidebar = usePublicCart((s) => s.openSidebar);
  const totalItems = usePublicCart((s) => s.getTotalItems);

  useEffect(() => { setMounted(true); }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const itemCount = mounted ? totalItems() : 0;

  return (
    <nav className="navbar">
      <div className="navbar__container">
        {/* ─── Logo ─── */}
        <Link href="/" className="navbar__logo" onClick={closeMenu}>
          <img
            src={getAssetSrc(logoLogin)}
            alt="Losrones"
            className="navbar__logo-img"
            width={44}
            height={44}
          />
        </Link>

        {/* ─── Desktop Links ─── */}
        <ul className="navbar__menu">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`${link.isCta ? 'navbar__cta' : 'navbar__link'} ${pathname === link.href ? (link.isCta ? '' : 'navbar__link--active') : ''}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ─── Cart Icon ─── */}
        <button className="navbar__cart" onClick={openSidebar} aria-label="Abrir carrito">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {itemCount > 0 && (
            <span className="navbar__cart-badge">{itemCount}</span>
          )}
        </button>

        {/* ─── Hamburger (mobile) ─── */}
        <button
          className={`navbar__hamburger ${menuOpen ? 'navbar__hamburger--open' : ''}`}
          onClick={toggleMenu}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <span className="navbar__hamburger-line" />
          <span className="navbar__hamburger-line" />
          <span className="navbar__hamburger-line" />
        </button>
      </div>

      {/* ─── Mobile Drawer ─── */}
      <div className={`navbar__drawer ${menuOpen ? 'navbar__drawer--open' : ''}`}>
        <ul className="navbar__drawer-menu">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`${link.isCta ? 'navbar__drawer-cta' : 'navbar__drawer-link'} ${!link.isCta && pathname === link.href ? 'navbar__drawer-link--active' : ''}`}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* ─── Overlay ─── */}
      {menuOpen && <div className="navbar__overlay" onClick={closeMenu} />}
    </nav>
  );
};

export default Navbar;
