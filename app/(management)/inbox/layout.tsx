import type { ReactNode } from 'react';
import { InboxShell } from './_components/inbox-shell';

export default function InboxLayout({ children }: { children: ReactNode }) {
  return <InboxShell>{children}</InboxShell>;
}
