export interface PresenceIdentifyPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
}

export interface OnlinePresenceUser {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
  status?: 'online' | 'away' | 'busy' | 'offline';
}
