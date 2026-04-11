import { create } from 'zustand';

export const useDashboardStore = create((set) => ({
    qaStatus: {
        hasData: false,
        count: 0,
        pendientesCount: 0,
    },
    connStatus: null,
    setQaStatus: (qaStatus) => set({ qaStatus }),
    setConnStatus: (connStatus) => set({ connStatus }),
}));
