import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { decodeToken } from '../helpers/jwtHelper'; // Ajusta la ruta según tu estructura

const isBrowser = typeof window !== 'undefined';

const AUTH_COOKIE_NAME = 'auth_token';

const getFromCookie = (key) => {
  if (!isBrowser) return null;
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
};

const setAuthCookie = (token) => {
  if (!isBrowser) return;
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    // 7 dias
    document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
  } catch {
    // noop
  }
};

const clearAuthCookie = () => {
  if (!isBrowser) return;
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  } catch {
    // noop
  }
};

const getFromStorage = (key) => {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setInStorage = (key, value) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // noop
  }
};

const removeFromStorage = (key) => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // noop
  }
};

// Recupera el token y decodifica la data inicial
const initialToken = getFromStorage('token') || getFromCookie(AUTH_COOKIE_NAME) || null;
const initialJwtData = initialToken ? decodeToken(initialToken) : null;

// Inicializa selectedStore desde localStorage o desde la tienda del token actual
const initialSelectedStore =
  getFromStorage('selectedStore') || initialJwtData?.storeLogin || null;

const useStore = create(
  subscribeWithSelector((set, get) => ({
    // Estado inicial
    loading: false,
    token: initialToken,
    jwtData: initialJwtData,
    selectedStore: initialSelectedStore,

    cartItems: [],

    totalCompra: 0,
    totalCompraSinCupon: 0,
    selectedCoupon: null, 

    dineroRecibido: 0,
    cambio: 0,
    tipoPago: '',
    cupones: [],
    dataCambio: null, 
    returnedItems: [], // Para manejar los productos devueltos
    
    // Funciones
    setLoading: (value) => set({ loading: value }),

    login: async (token) => {
      set({ loading: true });
      try {
        setInStorage('token', token);
        setAuthCookie(token);
        const jwtData = decodeToken(token);
        const selectedStore = getFromStorage('selectedStore') || jwtData?.storeLogin || null;
        if (selectedStore) {
          setInStorage('selectedStore', selectedStore);
        }
        set({ token, jwtData, selectedStore });
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
      } finally {
        set({ loading: false });
      }
    },

    logout: async () => {
      set({ loading: true });
      try {
        removeFromStorage('token');
        removeFromStorage('selectedStore');
        clearAuthCookie();
        set({ token: null, jwtData: null, selectedStore: null });
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      } finally {
        set({ loading: false });
      }
    },

    setSelectedStore: (store) => {
      setInStorage('selectedStore', store);
      set({ selectedStore: store });
    },

     setCartItems: (items) => {
         set({ cartItems: items });
         get().recalcTotals();        // recalcula cada vez que cambie el carrito
     },

    setTotalCompra: (total) => {
      // Si hay un cupón seleccionado, aplica el descuento
      const selectedCoupon = get().selectedCoupon;
      if (selectedCoupon) {
        const discount = (total * selectedCoupon.discount) / 100;
        total -= discount;
      }
      set({ totalCompra: total });
      // set({ totalCompra: total });
    },

    setTotalCompraSinCupon: (total) => {
      set({ totalCompraSinCupon: total });
    },

    setSelectedCoupon: (coupon) => {
        set({ selectedCoupon: coupon });
        get().recalcTotals();        // ¡un solo lugar para el cálculo!
    },

    setDineroRecibido: (dinero) => {
      set({ dineroRecibido: dinero });
    },

    setCambio: (cambio) => {
      set({ cambio: cambio });
    },

    setTipoPago: (tipo) => {
      set({ tipoPago: tipo });
    },

    setCupones: (cupones) => {
      set({ cupones: cupones });
    },

    setDataCambio: (data) => {
      set({ dataCambio: data });
    },

    setReturnedItems: (items) => {
      set({ returnedItems: items });
    },


    /*───────────  CUPÓN POR ÍTEM  ───────────*/
    applyItemCoupon: (unitId, coupon) => {
      set((state) => {
        const cartItems = state.cartItems.map((u) =>
          u.id === unitId
            ? {
                ...u,
                itemCoupon: coupon,
                priceWithItemCoupon:
                  u.product.salePrice * (1 - coupon.discount / 100),
              }
            : u
        );
        return { cartItems };
      });
      get().recalcTotals();          // ← actualiza totales
    },

    removeItemCoupon: (unitId) => {
      set((state) => {
        const cartItems = state.cartItems.map((u) =>
          u.id === unitId
            ? { ...u, itemCoupon: null, priceWithItemCoupon: u.product.salePrice }
            : u
        );
        return { cartItems };
      });
      get().recalcTotals();
    },

    /*───────────  RECÁLCULO CENTRAL  ───────────*/
    recalcTotals: () => {
      const { cartItems, selectedCoupon } = get();

      // Subtotal después de cupones por ítem
      const base = cartItems.reduce(
        (acc, u) => acc + Number(u.priceWithItemCoupon),
        0
      );

      // Cupón global (si existe)
      const pctGlobal = selectedCoupon?.discount ?? 0;
      const total = base * (1 - pctGlobal / 100);

      set({
        totalCompraSinCupon: base,
        totalCompra: Number(total.toFixed(2)),
      });
    },

    resetFinisedSale: () => {
      set({
        cartItems: [],
        totalCompra: 0,
        totalCompraSinCupon: 0,
        selectedCoupon: null,
        dineroRecibido: 0,
        cambio: 0,
        tipoPago: '',
      });
    }



  }))
);

export default useStore;

export const getState = useStore.getState;

// Suscribirte a todos los cambios de estado
useStore.subscribe(
    (state) => state, // Selector: monitorea todo el estado
    (state) => {
        // console.log('Estado actualizado-------------------->:')
        // console.log(state);
    } // Callback ejecutado cada vez que el estado cambia
);
