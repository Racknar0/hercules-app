import { create } from 'zustand';

const initialState = {
 data: null,
 loading: true,
 qaStatus: { hasData: false, count: 0, pendientesCount: 0 },
 isRunning: false,
 qaLogs: [],
 loteOptions: [],
 selectedLote: null,
 fileCheck: null,
};

const setValue = (set, key) =>(valueOrUpdater) =>
 set((state) =>({
 [key]:
 typeof valueOrUpdater === 'function'
 ? valueOrUpdater(state[key])
 : valueOrUpdater,
 }));

export const useExtractorPageStore = create((set) =>({
 ...initialState,
 setData: setValue(set, 'data'),
 setLoading: setValue(set, 'loading'),
 setQaStatus: setValue(set, 'qaStatus'),
 setIsRunning: setValue(set, 'isRunning'),
 setQaLogs: setValue(set, 'qaLogs'),
 setLoteOptions: setValue(set, 'loteOptions'),
 setSelectedLote: setValue(set, 'selectedLote'),
 setFileCheck: setValue(set, 'fileCheck'),
 resetExtractorState: () =>set(initialState),
}));
