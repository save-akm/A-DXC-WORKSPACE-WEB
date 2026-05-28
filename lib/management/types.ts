export interface ProjectMember {
  initial: string;
  color: string;
}

export type ProjectTone = 'sky' | 'pink' | 'emerald' | 'amber' | 'violet' | 'rose';

export interface ProjectItem {
  id: string;
  title: string;
  href: string;
  badge: string;
  color: string;
  tone: ProjectTone;
  progress: number;
  members: ProjectMember[];
  dueLabel: string;
  openIssues: number;
}

export interface ChannelItem {
  id: string;
  title: string;
  href: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  position: string;
  role: string;
  initial: string;
  accent: string;
}

export interface ViewTab {
  id: string;
  label: string;
  href: string;
}

export interface CurrentUser {
  name: string;
  email: string;
  initial: string;
  color: string;
}