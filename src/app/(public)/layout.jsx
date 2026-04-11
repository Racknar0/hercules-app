'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './shared/Navbar/Navbar';
import CartSidebar from './shared/CartSidebar/CartSidebar';
import usePublicCart from '@store/usePublicCart';

export default function PublicLayout({ children }) {
  const hydrate = usePublicCart((s) => s.hydrate);
  const pathname = usePathname();
  const isLoginRoute = pathname === '/login';

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <>
      {!isLoginRoute && <Navbar />}
      {!isLoginRoute && <CartSidebar />}
      <main className="public-main">
        {children}
      </main>
      <div className="site-construction-banner" role="status" aria-live="polite">
        Este sitio esta en construccion
      </div>
    </>
  );
}
