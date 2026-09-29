import { create } from 'zustand';
import { AskResponse } from '../api/client';
import { Document } from '../types';

interface ChatState {
  doc: Document | null;
  history: AskResponse[];
  loading: boolean;
  sending: boolean;
  setDoc: (doc: Document | null) => void;
  setHistory: (history: AskResponse[] | ((prev: AskResponse[]) => AskResponse[])) => void;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  addMessage: (message: AskResponse) => void;
  updateMessageText: (id: string, text: string) => void;
  updateMessageSources: (id: string, sources: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  doc: null,
  history: [],
  loading: true,
  sending: false,
  
  setDoc: (doc) => set({ doc }),
  
  setHistory: (historyOrUpdater) => set((state) => ({
    history: typeof historyOrUpdater === 'function' 
      ? historyOrUpdater(state.history) 
      : historyOrUpdater
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setSending: (sending) => set({ sending }),
  
  addMessage: (message) => set((state) => ({
    history: [...state.history, message]
  })),
  
  updateMessageText: (id, text) => set((state) => ({
    history: state.history.map((msg) => 
      msg.id === id ? { ...msg, answer: msg.answer + text } : msg
    )
  })),

  updateMessageSources: (id, sources) => set((state) => ({
    history: state.history.map((msg) => 
      msg.id === id ? { ...msg, sourceCitations: sources } : msg
    )
  }))
}));
