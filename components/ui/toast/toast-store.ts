'use client';

import { create } from 'zustand';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastData {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  action?: ToastAction;
  duration: number;
  createdAt: number;
}

export type ToastInput = Omit<Partial<ToastData>, 'id' | 'createdAt'> & { title: string };

interface ToastState {
  toasts: ToastData[];
  add: (t: ToastInput) => string;
  update: (id: string, patch: Partial<ToastData>) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

let counter = 0;
const newId = () => `t_${Date.now().toString(36)}_${(counter++).toString(36)}`;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (input) => {
    const id = newId();
    const toast: ToastData = {
      id,
      variant: input.variant ?? 'default',
      title: input.title,
      description: input.description,
      action: input.action,
      duration: input.duration ?? 4000,
      createdAt: Date.now(),
    };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    return id;
  },
  update: (id, patch) =>
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));
