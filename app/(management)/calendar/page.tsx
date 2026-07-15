import type { Metadata } from 'next';
import { CalendarPageView } from './_components/calendar-view';

export const metadata: Metadata = {
  title: 'Calendar — A-DXC Workspace',
};

export default function CalendarPage() {
  return <CalendarPageView />;
}
