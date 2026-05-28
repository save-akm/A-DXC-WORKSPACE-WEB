'use client';

import { useToastStore, type ToastAction, type ToastInput, type ToastVariant } from './toast-store';

export { ToastProvider } from './toast-provider';
export { useToastStore } from './toast-store';
export type { ToastData, ToastVariant, ToastAction } from './toast-store';

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: ToastAction;
}

function show(variant: ToastVariant, title: string, options?: ToastOptions): string {
  const input: ToastInput = {
    title,
    variant,
    description: options?.description,
    duration: options?.duration,
    action: options?.action,
  };
  return useToastStore.getState().add(input);
}

interface PromiseMessages<T> {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((error: unknown) => string);
  description?: string | ((value: T) => string);
}

function resolveMessage<T>(msg: string | ((v: T) => string), value: T): string {
  return typeof msg === 'function' ? msg(value) : msg;
}

function promise<T>(p: Promise<T>, messages: PromiseMessages<T>): Promise<T> {
  const store = useToastStore.getState();
  const id = store.add({
    variant: 'loading',
    title: messages.loading,
    duration: 0,
  });

  p.then(
    (value) => {
      useToastStore.getState().update(id, {
        variant: 'success',
        title: resolveMessage(messages.success, value),
        description: messages.description
          ? resolveMessage(messages.description, value)
          : undefined,
        duration: 4000,
      });
    },
    (error) => {
      useToastStore.getState().update(id, {
        variant: 'error',
        title:
          typeof messages.error === 'function'
            ? messages.error(error)
            : messages.error,
        description: error instanceof Error ? error.message : undefined,
        duration: 6000,
      });
    },
  );

  return p;
}

export const toast = Object.assign(
  (title: string, options?: ToastOptions) => show('default', title, options),
  {
    success: (title: string, options?: ToastOptions) => show('success', title, options),
    error: (title: string, options?: ToastOptions) => show('error', title, options),
    warning: (title: string, options?: ToastOptions) => show('warning', title, options),
    info: (title: string, options?: ToastOptions) => show('info', title, options),
    loading: (title: string, options?: ToastOptions) =>
      show('loading', title, { ...options, duration: 0 }),
    dismiss: (id: string) => useToastStore.getState().dismiss(id),
    promise,
  },
);
