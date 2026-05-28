'use client';

import { AppHubSection } from '@/components/app-hub-section';
import { AnnouncementsSection } from '@/components/announcements-section';
import { MeetItTeamSection } from '@/components/meet-it-team-section';
import { ActivitySection } from '@/components/activity-section';

export function Landing() {
  return (
    <div id="landing" className="relative w-full">
      <AppHubSection />
      <AnnouncementsSection />
      <MeetItTeamSection />
      <ActivitySection />
    </div>
  );
}
