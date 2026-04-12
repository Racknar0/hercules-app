import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialState = {
 files: [],
 isUploading: false,
 streamLogs: [],
 thinkingData: null,
 thinkingHistory: [],
 thinkingOpen: true,
 loteOptions: [],
 selectedLote: null,
 loteDocuments: [],
 pendientes: [],
 trashData: [],
 officialClient: '',
 officialDol: '',
 aiModel: 'gemini-3-flash-preview',
 enableQC: false,
};

const setValue = (set, key) =>(valueOrUpdater) =>
 set((state) =>({
 [key]:
 typeof valueOrUpdater === 'function'
 ? valueOrUpdater(state[key])
 : valueOrUpdater,
 }));

export const useOrganizerPageStore = create(
 persist(
 (set) =>({
 ...initialState,
 setFiles: setValue(set, 'files'),
 setIsUploading: setValue(set, 'isUploading'),
 setStreamLogs: setValue(set, 'streamLogs'),
 setThinkingData: setValue(set, 'thinkingData'),
 setThinkingHistory: setValue(set, 'thinkingHistory'),
 setThinkingOpen: setValue(set, 'thinkingOpen'),
 setLoteOptions: setValue(set, 'loteOptions'),
 setSelectedLote: setValue(set, 'selectedLote'),
 setLoteDocuments: setValue(set, 'loteDocuments'),
 setPendientes: setValue(set, 'pendientes'),
 setTrashData: setValue(set, 'trashData'),
 setOfficialClient: setValue(set, 'officialClient'),
 setOfficialDol: setValue(set, 'officialDol'),
 setAiModel: setValue(set, 'aiModel'),
 setEnableQC: setValue(set, 'enableQC'),
 resetOrganizerState: () =>set(initialState),
 }),
 {
 name: 'hercules-organizer-store',
 storage: createJSONStorage(() => localStorage),
 partialize: (state) =>({
 selectedLote: state.selectedLote,
 streamLogs: state.streamLogs,
 thinkingData: state.thinkingData,
 thinkingHistory: state.thinkingHistory,
 thinkingOpen: state.thinkingOpen,
 officialClient: state.officialClient,
 officialDol: state.officialDol,
 aiModel: state.aiModel,
 enableQC: state.enableQC,
 loteDocuments: state.loteDocuments,
 pendientes: state.pendientes,
 trashData: state.trashData,
 }),
 },
 ),
);
