import type {
  ChannelItem,
  CurrentUser,
  ProjectItem,
  ViewTab,
  WorkspaceInfo,
} from './types';

export const workspace: WorkspaceInfo = {
  id: 'workspace',
  name: 'A-DXC Workspace',
  position: '',
  role: '',
  initial: 'W',
  accent: 'from-violet-500 to-fuchsia-500',
};

export const projects: ProjectItem[] = [
  {
    id: 'orbit-web',
    title: 'Orbit Web',
    href: '/projects/orbit-web',
    badge: 'ORB',
    color: 'bg-sky-400',
    tone: 'sky',
    progress: 68,
    openIssues: 12,
    dueLabel: 'Due in 6 days',
    members: [
      { initial: 'M', color: 'bg-fuchsia-500' },
      { initial: 'J', color: 'bg-emerald-500' },
      { initial: 'E', color: 'bg-cyan-500' },
    ],
  },
  {
    id: 'atlas-mobile',
    title: 'Atlas Mobile',
    href: '/projects/atlas-mobile',
    badge: 'ATL',
    color: 'bg-pink-400',
    tone: 'pink',
    progress: 42,
    openIssues: 23,
    dueLabel: 'Due in 2 weeks',
    members: [
      { initial: 'T', color: 'bg-amber-500' },
      { initial: 'R', color: 'bg-rose-500' },
    ],
  },
  {
    id: 'nova-api',
    title: 'Nova API',
    href: '/projects/nova-api',
    badge: 'NOV',
    color: 'bg-emerald-400',
    tone: 'emerald',
    progress: 91,
    openIssues: 4,
    dueLabel: 'Due tomorrow',
    members: [
      { initial: 'J', color: 'bg-emerald-500' },
      { initial: 'A', color: 'bg-violet-500' },
      { initial: 'M', color: 'bg-fuchsia-500' },
      { initial: 'E', color: 'bg-cyan-500' },
    ],
  },
  {
    id: 'lumen-design',
    title: 'Lumen Design',
    href: '/projects/lumen-design',
    badge: 'LUM',
    color: 'bg-amber-400',
    tone: 'amber',
    progress: 25,
    openIssues: 7,
    dueLabel: 'Just started',
    members: [
      { initial: 'E', color: 'bg-cyan-500' },
      { initial: 'M', color: 'bg-fuchsia-500' },
    ],
  },
];

export const channels: ChannelItem[] = [
  { id: 'general', title: 'general', href: '/channels/general' },
  { id: 'engineering', title: 'engineering', href: '/channels/engineering' },
  { id: 'design-crit', title: 'design-crit', href: '/channels/design-crit' },
  { id: 'random', title: 'random', href: '/channels/random' },
];

export const viewTabs: ViewTab[] = [
  { id: 'board', label: 'Board', href: '/projects/orbit-web' },
  { id: 'list', label: 'List', href: '/projects/orbit-web/list' },
  { id: 'timeline', label: 'Timeline', href: '/projects/orbit-web/timeline' },
  { id: 'calendar', label: 'Calendar', href: '/projects/orbit-web/calendar' },
];

export const currentUser: CurrentUser = {
  name: '',
  email: '',
  initial: '',
  color: 'bg-rose-500',
};
