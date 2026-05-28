'use client';

import { createContext, useContext } from 'react';

const SidebarCollapsedContext = createContext(false);

export const SidebarCollapsedProvider = SidebarCollapsedContext.Provider;

export function useCollapsed() {
  return useContext(SidebarCollapsedContext);
}
