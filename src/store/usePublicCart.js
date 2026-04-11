import { create } from 'zustand';

const isBrowser = typeof window !== 'undefined';

const getCartFromStorage = () => {
  if (!isBrowser) return [];
  try {
    const stored = window.localStorage.getItem('losrones_public_cart');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (items) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem('losrones_public_cart', JSON.stringify(items));
  } catch {
    // noop
  }
};

const usePublicCart = create((set, get) => ({
  // Start empty to match SSR — hydrate from localStorage after mount
  items: [],
  sidebarOpen: false,
  _hydrated: false,

  // Call this once in a useEffect to load cart from localStorage
  hydrate: () => {
    if (get()._hydrated) return;
    set({ items: getCartFromStorage(), _hydrated: true });
  },

  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),

  addItem: (product, qty = 1) => {
    const { items } = get();
    const exists = items.find((i) => i.id === product.id);
    let next;

    if (exists) {
      next = items.map((i) =>
        i.id === product.id ? { ...i, qty: i.qty + qty } : i
      );
    } else {
      next = [...items, { ...product, qty }];
    }

    saveCartToStorage(next);
    set({ items: next, sidebarOpen: true });
  },

  removeItem: (productId) => {
    const next = get().items.filter((i) => i.id !== productId);
    saveCartToStorage(next);
    set({ items: next });
  },

  updateQty: (productId, qty) => {
    if (qty < 1) return get().removeItem(productId);
    const next = get().items.map((i) =>
      i.id === productId ? { ...i, qty } : i
    );
    saveCartToStorage(next);
    set({ items: next });
  },

  clearCart: () => {
    saveCartToStorage([]);
    set({ items: [] });
  },

  getTotal: () =>
    get().items.reduce((acc, i) => acc + i.price * i.qty, 0),

  getTotalItems: () =>
    get().items.reduce((acc, i) => acc + i.qty, 0),
}));

export default usePublicCart;
