import type { ConversationRole, Message } from './types';

export function canEditMessage(message: Message, myId: string | undefined): boolean {
  return (
    message.sender.id === myId
    && message.type === 'TEXT'
    && !message.deletedAt
  );
}

export function canDeleteMessage(
  message: Message,
  myId: string | undefined,
  myRole: ConversationRole | null,
  isGroup: boolean,
): boolean {
  if (!myId || message.deletedAt) return false;
  if (message.sender.id === myId) return true;
  if (!isGroup) return false;
  return myRole === 'OWNER' || myRole === 'ADMIN';
}

export function canPinMessage(myRole: ConversationRole | null, isGroup: boolean): boolean {
  if (!isGroup) return true;
  return myRole === 'OWNER' || myRole === 'ADMIN';
}

export function canManageGroup(myRole: ConversationRole | null): boolean {
  return myRole === 'OWNER' || myRole === 'ADMIN';
}

export function isGroupOwner(myRole: ConversationRole | null): boolean {
  return myRole === 'OWNER';
}

export function canChangeRoles(myRole: ConversationRole | null): boolean {
  return myRole === 'OWNER';
}
