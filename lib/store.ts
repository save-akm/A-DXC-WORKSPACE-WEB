// Back-compat barrel — store has been split into lib/stores/*.
// Existing imports of `useChatUIStore`, `useChatStore`, `useLoginUIStore`,
// and `useAppStore` continue to work via this file.
import { create } from 'zustand';

export { useChatUIStore, useChatStore } from './stores/chat-ui-store';
export type { ChatRole, ChatMessage } from './stores/chat-ui-store';
export { useLoginUIStore } from './stores/login-ui-store';
export { useAuthStore } from './stores/auth-store';
export type { AuthStatus } from './stores/auth-store';

interface AppState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
