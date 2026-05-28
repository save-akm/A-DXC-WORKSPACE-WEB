'use client';

import { create } from 'zustand';

interface ChatUIState {
  isPromptActive: boolean;
  setPromptActive: (active: boolean) => void;
}

export const useChatUIStore = create<ChatUIState>((set) => ({
  isPromptActive: false,
  setPromptActive: (isPromptActive) => set({ isPromptActive }),
}));

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
}

interface ChatMessagesState {
  messages: ChatMessage[];
  pushMessage: (msg: { role: ChatRole; content: string }) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatMessagesState>((set) => ({
  messages: [],
  pushMessage: ({ role, content }) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          role,
          content,
          timestamp: Date.now(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),
}));
